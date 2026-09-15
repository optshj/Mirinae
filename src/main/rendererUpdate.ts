// 렌더러 OTA: 번들을 받아 검증·저장하고 mirinae://app 으로 띄운다 (docs/renderer-ota-plan.md 3장)
import { app, ipcMain, net, powerMonitor, protocol, type BrowserWindow, type IpcMainEvent } from 'electron';
import { is } from '@electron-toolkit/utils';
import log from 'electron-log';
import { randomUUID } from 'crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { isTrustedSender } from './ipcHandler';
import { MANIFEST_MAX_BYTES, readManifest, safeJoin, sha256 } from './rendererManifest';
import { store } from './store';

// docs/renderer-ota-plan.md 6.4에서 만든 Ed25519 공개키(PEM)로 교체한다.
// scripts/ota.mjs가 셸 태그의 이 파일에서 PEM 블록을 뽑아 서명을 확인하므로 줄바꿈 그대로 둔다.
const PUBLIC_KEY = 'MCowBQYDK2VwAyEAtUqv43U8sbMtYaKWJgWAxhfiWHFIw0SlpHtnt7CJiw0=';

const APP_URL = 'mirinae://app/';
const DEV_URL = is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined;
export const RENDERER_URL_PREFIX = DEV_URL ?? APP_URL;

// dev·preview에서는 로컬 빌드를 봐야 하므로 스테이징 테스트(MIRINAE_OTA_URL)가 아니면 끈다
const OTA_ENABLED = app.isPackaged || Boolean(process.env.MIRINAE_OTA_URL);
const OTA_BASE_URL = `${process.env.MIRINAE_OTA_URL ?? 'https://github.com/optshj/mirinae-renderer/releases/download'}/shell-${app.getVersion()}`;
const BUNDLED_ROOT = join(__dirname, '../renderer');
const MANIFEST_FILE = '.manifest.json';
const BOOT_TIMEOUT_MS = 20_000;
const UPDATE_CHECK_DELAY_MS = 30_000;

type OtaState = {
  shellVersion: string; // 현재 셸과 다르면 전체 초기화
  highestBuild: number; // 받아들인 가장 높은 build, 내려가지 않음
  activeBuild: number | null; // 부팅에 쓰는 build
  pendingBuild: number | null; // 받아뒀다가 다음 실행에 active로 올릴 build
  bootingBuild: number | null; // ready를 기다리는 중인 build. 다음 실행에 남아 있으면 부팅이 중단된 것
  failedBoots: number; // activeBuild 연속 실패 횟수
  badBuilds: number[];
};

const readState = (): OtaState => {
  const state: OtaState | null = store.get('renderer-ota');
  if (state?.shellVersion === app.getVersion()) return state;
  return { shellVersion: app.getVersion(), highestBuild: 0, activeBuild: null, pendingBuild: null, bootingBuild: null, failedBoots: 0, badBuilds: [] };
};

// 논리적 전환 하나 = 최신 상태 읽기 → 변경 → 쓰기 한 번. await를 끼우지 않는다
const updateState = (mutate: (state: OtaState) => void) => {
  const state = readState();
  mutate(state);
  store.set('renderer-ota', state);
  return state;
};

const recordBootFailure = (state: OtaState, build: number) => {
  state.bootingBuild = null;
  if (state.activeBuild !== build) return;
  state.failedBoots += 1;
  if (state.failedBoots < 2) return;
  state.badBuilds.push(build);
  state.activeBuild = null;
  state.failedBoots = 0;
};

const isWanted = (state: OtaState, build: number) => build >= state.highestBuild && build !== state.activeBuild && build !== state.pendingBuild && !state.badBuilds.includes(build);

const otaRoot = () => join(app.getPath('userData'), 'renderer-ota');
const buildDir = (build: number) => join(otaRoot(), String(build));

// ---------- 프로토콜 (3.4) ----------

export const registerRendererScheme = () => protocol.registerSchemesAsPrivileged([{ scheme: 'mirinae', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// 이번 세션이 제공하는 렌더러. files가 있으면 검증된 OTA 번들이라 목록에 있는 경로만 제공한다
let served: { root: string; files?: Set<string> } = { root: BUNDLED_ROOT };

const respond = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export const handleRendererProtocol = () =>
  protocol.handle('mirinae', async (request) => {
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
      log.error('[RendererOTA] 파일 제공 실패', path, error);
      return respond(500);
    }
  });

// ---------- 부팅 (3.2) ----------

const loadServed = (win: BrowserWindow, url = `${APP_URL}index.html`) => win.loadURL(url).catch((error) => log.warn('[RendererOTA] 로드 중단', url, error.message));

const loadBundled = (win: BrowserWindow) => {
  served = { root: BUNDLED_ROOT };
  loadServed(win);
};

let booted = false;

export async function loadRenderer(win: BrowserWindow) {
  if (DEV_URL) return void win.loadURL(DEV_URL);
  if (booted || !OTA_ENABLED) return void loadServed(win);
  booted = true;

  const { activeBuild: build } = updateState((state) => {
    if (state.bootingBuild !== null) recordBootFailure(state, state.bootingBuild);
    if (state.pendingBuild !== null) {
      state.activeBuild = state.pendingBuild;
      state.pendingBuild = null;
      state.failedBoots = 0;
    }
  });
  setTimeout(checkForUpdate, UPDATE_CHECK_DELAY_MS);

  if (build === null) return loadBundled(win);
  const files = await verifyBuild(build);
  if (!files) {
    // 파일 문제는 빌드 결함이 아니므로 차단하지 않는다. 다음 확인 때 같은 build를 다시 받는다
    updateState((state) => {
      if (state.activeBuild === build) state.activeBuild = null;
    });
    return loadBundled(win);
  }

  served = { root: buildDir(build), files };
  updateState((state) => {
    state.bootingBuild = build;
  });
  watchBoot(win, build, `${APP_URL}index.html?attempt=${randomUUID()}`);
}

async function verifyBuild(build: number) {
  const dir = buildDir(build);
  try {
    const manifest = readManifest(await readFile(join(dir, MANIFEST_FILE), 'utf8'), PUBLIC_KEY, app.getVersion());
    if (manifest.build !== build) throw new Error(`build 불일치: ${manifest.build}`);
    for (const [path, file] of Object.entries(manifest.files)) {
      if (sha256(await readFile(join(dir, path))) !== file.sha256) throw new Error(`해시 불일치: ${path}`);
    }
    return new Set(Object.keys(manifest.files));
  } catch (error) {
    log.warn(`[RendererOTA] build ${build} 재검증 실패, 내장 렌더러로 부팅`, error);
    return null;
  }
}

// attempt 하나는 정확히 한 번만 결론을 낸다
function watchBoot(win: BrowserWindow, build: number, url: string) {
  const { webContents } = win;
  let settled = false;
  let timer: NodeJS.Timeout | undefined;

  const startTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => settle('failed', 'ready 시간 초과'), BOOT_TIMEOUT_MS);
  };
  const pauseTimer = () => clearTimeout(timer);
  const onReady = (event: IpcMainEvent) => {
    if (isTrustedSender(event) && event.senderFrame?.url === url) settle('ready');
  };
  const onFailLoad = (_: Electron.Event, code: number, description: string, _url: string, isMainFrame: boolean) => {
    if (isMainFrame && code !== -3) settle('failed', `did-fail-load ${code} ${description}`);
  };
  const onGone = (_: Electron.Event, details: Electron.RenderProcessGoneDetails) => settle('failed', `render-process-gone ${details.reason}`);
  const onQuit = () => settle('aborted');

  function settle(result: 'ready' | 'failed' | 'aborted', reason?: string) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    ipcMain.removeListener('renderer-ready', onReady);
    webContents.removeListener('did-fail-load', onFailLoad);
    webContents.removeListener('render-process-gone', onGone);
    app.removeListener('before-quit', onQuit);
    powerMonitor.removeListener('suspend', pauseTimer);
    powerMonitor.removeListener('resume', startTimer);

    if (result === 'ready') {
      updateState((state) => {
        state.bootingBuild = null;
        state.failedBoots = 0;
      });
      log.info(`[RendererOTA] build ${build} 부팅 성공`);
    } else if (result === 'aborted') {
      updateState((state) => {
        state.bootingBuild = null;
      });
    } else {
      log.error(`[RendererOTA] build ${build} 부팅 실패: ${reason}`);
      updateState((state) => recordBootFailure(state, build));
      loadBundled(win);
    }
  }

  ipcMain.on('renderer-ready', onReady);
  webContents.on('did-fail-load', onFailLoad);
  webContents.on('render-process-gone', onGone);
  app.on('before-quit', onQuit);
  powerMonitor.on('suspend', pauseTimer);
  powerMonitor.on('resume', startTimer);
  startTimer();
  loadServed(win, url);
}

// ---------- 업데이트 확인 (3.3) ----------

async function download(url: string, maxBytes: number) {
  const response = await net.fetch(url, { cache: 'no-store' });
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

async function removeUnusedBuilds() {
  const { activeBuild, pendingBuild } = readState();
  const keep = [String(activeBuild), String(pendingBuild)];
  const names = await readdir(otaRoot()).catch(() => [] as string[]);
  await Promise.all(names.filter((name) => !keep.includes(name)).map((name) => rm(join(otaRoot(), name), { recursive: true, force: true })));
}

async function checkForUpdate() {
  try {
    await removeUnusedBuilds();

    const raw = await download(`${OTA_BASE_URL}/manifest.json`, MANIFEST_MAX_BYTES).catch((error) => {
      if (error.status === 404) return null;
      throw error;
    });
    if (!raw) return log.info('[RendererOTA] 이 셸용 번들 없음');

    const text = raw.toString('utf8');
    const manifest = readManifest(text, PUBLIC_KEY, app.getVersion());
    const { build } = manifest;
    if (!isWanted(readState(), build)) return;

    const temp = `${buildDir(build)}.download`;
    await rm(temp, { recursive: true, force: true });
    for (const [path, file] of Object.entries(manifest.files)) {
      const data = await download(`${OTA_BASE_URL}/${file.sha256}`, file.size);
      if (sha256(data) !== file.sha256) throw new Error(`해시 불일치: ${path}`);
      const dest = join(temp, path);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, data);
    }
    await writeFile(join(temp, MANIFEST_FILE), text);
    await rm(buildDir(build), { recursive: true, force: true });
    await rename(temp, buildDir(build));

    const previous = readState().pendingBuild;
    const next = updateState((state) => {
      if (!isWanted(state, build)) return;
      state.pendingBuild = build;
      state.highestBuild = build;
    });
    if (next.pendingBuild !== build) return;
    log.info(`[RendererOTA] build ${build} 받음, 다음 실행에 적용`);
    if (previous !== null) await rm(buildDir(previous), { recursive: true, force: true });
  } catch (error) {
    // 네트워크·서명·해시 실패는 다음 실행에서 재시도한다. 중단된 .download 폴더는 다음 확인 때 지워진다
    log.warn('[RendererOTA] 업데이트 확인 실패', error);
  }
}
