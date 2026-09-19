import { app, ipcMain, net, powerMonitor, protocol, type BrowserWindow, type IpcMainEvent } from 'electron';
import { is } from '@electron-toolkit/utils';
import log from 'electron-log';
import { randomUUID } from 'crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { isTrustedSender } from './ipcHandler';
import { MANIFEST_MAX_BYTES, readManifest, safeJoin, sha256 } from './bundleManifest';
import { store } from './store';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAtUqv43U8sbMtYaKWJgWAxhfiWHFIw0SlpHtnt7CJiw0=
-----END PUBLIC KEY-----`;

const APP_URL = 'mirinae://app/';
const DEV_URL = is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined;
export const RENDERER_URL_PREFIX = DEV_URL ?? APP_URL;

const GITHUB_RELEASE_BASE = 'https://github.com/optshj/mirinae-renderer/releases/download';
const MANIFEST_URL = `${GITHUB_RELEASE_BASE}/shell-${app.getVersion()}/manifest.json`;
const fileUrl = (build: number, hash: string) => `${GITHUB_RELEASE_BASE}/bundle-${build}/${hash}`;
const EMBEDDED_ROOT = join(__dirname, '../renderer');
const MANIFEST_FILE = '.manifest.json';
const BOOT_TIMEOUT_MS = 10_000;
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1시간
const UPDATE_CHECK_TIMEOUT_MS = 10 * 60 * 1000; // 확인 한 번의 시간 제한. 확인 간격보다 짧아야 한다

type BundleState = {
  shellVersion: string; // 현재 셸과 다르면 전체 초기화
  build: number; // 받아서 검증을 마친 최신 build. 0이면 없음. 내려가지 않는다(다운그레이드 방지)
};

const readState = (): BundleState => {
  const state: BundleState | null = store.get('bundle-update');
  if (state?.shellVersion === app.getVersion()) return state;
  return { shellVersion: app.getVersion(), build: 0 };
};

const bundleRoot = () => join(app.getPath('userData'), 'bundle-update');
const buildDir = (build: number) => join(bundleRoot(), String(build));

export const registerRendererScheme = () => protocol.registerSchemesAsPrivileged([{ scheme: 'mirinae', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

let served: { root: string; files?: Set<string> } = { root: EMBEDDED_ROOT }; // 현재 제공중인 번들

export const handleRendererProtocol = () =>
  protocol.handle('mirinae', async (request) => {
    const respond = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

    if (request.method !== 'GET') return respond(405);
    const url = new URL(request.url);
    if (url.host !== 'app') return respond(404);
    let path: string;
    try {
      path = decodeURIComponent(url.pathname.slice(1));
    } catch {
      return respond(400);
    }

    const { root, files } = served;
    const file = files ? (files.has(path) ? join(root, path) : null) : safeJoin(root, path);
    try {
      if (!file || !(await stat(file)).isFile()) return respond(404);
      const response = await net.fetch(pathToFileURL(file).href, { bypassCustomProtocolHandlers: true });
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') return respond(404);
      log.error('[BundleUpdate] 파일 제공 실패', path, error);
      return respond(500);
    }
  });

const loadServed = (win: BrowserWindow, url = `${APP_URL}index.html`) => win.loadURL(url).catch((error) => log.warn('[BundleUpdate] 로드 중단', url, error.message));

const loadEmbedded = (win: BrowserWindow) => {
  served = { root: EMBEDDED_ROOT };
  loadServed(win);
};

let booted = false;

export function loadRenderer(win: BrowserWindow) {
  if (DEV_URL) return void win.loadURL(DEV_URL); // Dev에서는 개발 서버를 바로 띄운다
  if (!app.isPackaged) return void loadServed(win); // Preview에서는 내장 렌더러를 띄운다
  if (booted) return void loadServed(win); // macOS activate로 창을 다시 만들 때는 지금 served로 다시 로드만 한다
  booted = true;
  checkUpdate(); // 부팅 시 업데이트 확인
  setInterval(checkUpdate, UPDATE_CHECK_INTERVAL_MS); // 매 시간마다 업데이트 확인
  bootLatest(win);
}

async function bootLatest(win: BrowserWindow) {
  const { build } = readState();
  if (build === 0) return loadEmbedded(win); // 아직 받은 build가 없을 시, 내장 렌더러로 부팅
  const files = await verifyBuild(build); // 빌드 유효성 검증
  if (!files) return loadEmbedded(win); // 검증 실패 시, 내장 렌더러로 부팅

  served = { root: buildDir(build), files };

  // 이 번들이 실제로 화면까지 뜨는지 감시한다
  const url = `${APP_URL}index.html?attempt=${randomUUID()}`;
  const { webContents } = win;
  let settled = false;
  let timer: NodeJS.Timeout | undefined;

  const startTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // 멈춘 렌더러는 다음 로드를 처리하지 못할 수 있어 프로세스를 끝낸다. 이어지는 로드는 새 프로세스에서 뜬다
      webContents.forcefullyCrashRenderer();
      settle('failed', 'ready 시간 초과');
    }, BOOT_TIMEOUT_MS);
  };
  const pauseTimer = () => clearTimeout(timer);
  const onReady = (event: IpcMainEvent) => {
    if (isTrustedSender(event) && event.senderFrame?.url === url) settle('ready');
  };
  const onFailLoad = (_: Electron.Event, code: number, description: string, _url: string, isMainFrame: boolean) => {
    if (isMainFrame && code !== -3) settle('failed', `did-fail-load ${code} ${description}`);
  };
  // 시작 중 잡히지 않은 예외 = 흰 화면. 비동기 거부(in promise)는 오프라인처럼 정상일 때도 나서 타임아웃에 맡긴다
  const onConsole = ({ level, message }: Electron.Event<Electron.WebContentsConsoleMessageEventParams>) => {
    if (level === 'error' && message.startsWith('Uncaught ') && !message.startsWith('Uncaught (in promise)')) settle('failed', message);
  };
  const onGone = (_: Electron.Event, details: Electron.RenderProcessGoneDetails) => settle('failed', `render-process-gone ${details.reason}`);
  const onQuit = () => settle('aborted');

  function settle(result: 'ready' | 'failed' | 'aborted', reason?: string) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    ipcMain.removeListener('renderer-ready', onReady);
    webContents.removeListener('did-fail-load', onFailLoad);
    webContents.removeListener('console-message', onConsole);
    webContents.removeListener('render-process-gone', onGone);
    app.removeListener('before-quit', onQuit);
    powerMonitor.removeListener('suspend', pauseTimer);
    powerMonitor.removeListener('resume', startTimer);

    if (result === 'ready') log.info(`[BundleUpdate] build ${build} 부팅 성공`);
    if (result !== 'failed') return;
    log.error(`[BundleUpdate] build ${build} 부팅 실패: ${reason}`);
    loadEmbedded(win);
  }

  ipcMain.on('renderer-ready', onReady);
  webContents.on('did-fail-load', onFailLoad);
  webContents.on('console-message', onConsole);
  webContents.on('render-process-gone', onGone);
  app.on('before-quit', onQuit);
  powerMonitor.on('suspend', pauseTimer);
  powerMonitor.on('resume', startTimer);
  startTimer();
  loadServed(win, url);
}

async function verifyBuild(build: number) {
  const dir = buildDir(build);
  try {
    const manifest = readManifest(await readFile(join(dir, MANIFEST_FILE), 'utf8'), PUBLIC_KEY, app.getVersion());
    if (manifest.build !== build) throw new Error(`빌드 번호 불일치: ${manifest.build}`);
    for (const [path, file] of Object.entries(manifest.files)) {
      if (sha256(await readFile(join(dir, path))) !== file.sha256) throw new Error(`해시 불일치: ${path}`);
    }
    return new Set(Object.keys(manifest.files));
  } catch (error) {
    log.warn(`[BundleUpdate] build ${build} 재검증 실패, 내장 렌더러로 부팅`, error);
    return null;
  }
}

async function download(url: string, maxBytes: number, signal: AbortSignal) {
  const response = await net.fetch(url, { cache: 'no-store', signal }); // signal이 끊기면 응답 대기·본문 읽기 모두 에러로 끝난다
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}: ${url}`), { status: response.status });
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (response.body) {
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > maxBytes) throw new Error(`크기 제한 초과: ${url}`); // 루프를 빠져나가면 스트림이 취소된다
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks);
}

let checking = false;

async function checkUpdate() {
  if (checking) return; // 이전 확인이 아직 진행 중이면 건너뛴다. 겹치면 서로의 .download 폴더를 지운다
  checking = true;
  const signal = AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS); // 멈춘 요청 때문에 확인이 끝나지 않는 걸 막는다
  try {
    // 최신 build와 이번 실행이 화면에 쓰는 폴더만 남긴다. 옛 build와 중단된 .download 폴더가 여기서 지워진다
    const keep = [String(readState().build), basename(served.root)];
    const names = await readdir(bundleRoot()).catch(() => []);
    await Promise.all(names.filter((name) => !keep.includes(name)).map((name) => rm(join(bundleRoot(), name), { recursive: true, force: true })));

    const raw = await download(MANIFEST_URL, MANIFEST_MAX_BYTES, signal).catch((error) => {
      if (error.status === 404) return null;
      throw error;
    });
    if (!raw) return log.info('[BundleUpdate] 이 셸용 번들 없음');

    const text = raw.toString('utf8');
    const { build, files } = readManifest(text, PUBLIC_KEY, app.getVersion());
    if (build <= readState().build) return; // 다운그레이드 방지

    // 다 받고 이름을 바꾸기 전까지는 완성된 build로 보이지 않는다
    const temp = `${buildDir(build)}.download`;
    for (const [path, file] of Object.entries(files)) {
      const data = await download(fileUrl(build, file.sha256), file.size, signal);
      if (sha256(data) !== file.sha256) throw new Error(`해시 불일치: ${path}`);
      const dest = join(temp, path);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, data);
    }
    await writeFile(join(temp, MANIFEST_FILE), text);
    await rename(temp, buildDir(build));

    store.set('bundle-update', { shellVersion: app.getVersion(), build });
    log.info(`[BundleUpdate] build ${build} 받음, 다음 실행에 적용`);
  } catch (error) {
    // 네트워크·시간 초과·서명·해시 실패는 다음 확인 때 재시도한다. 중단된 .download 폴더는 다음 확인 때 지워진다
    log.warn('[BundleUpdate] 업데이트 확인 실패', error);
  } finally {
    checking = false;
  }
}
