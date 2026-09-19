import { execFileSync, execSync } from 'node:child_process';
import { createPrivateKey, sign } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { readManifest, sha256 } from '../src/main/bundleManifest.ts';

const REPO = process.env.MIRINAE_BUNDLE_REPO ?? 'optshj/mirinae-renderer';
const SHELL_PATHS = ['src/main', 'src/preload', 'electron-builder.json', 'electron.vite.config.ts', 'resources'];
const { version: VERSION } = JSON.parse(readFileSync('package.json', 'utf8'));
const TAG = `v${VERSION}`;
const RELEASE = `shell-${VERSION}`;
const BUNDLE_ROOT = join('release', 'bundle');
const MANIFEST_PATH = join(BUNDLE_ROOT, RELEASE, 'manifest.json');
const buildDir = (build) => join(BUNDLE_ROOT, `bundle-${build}`);

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const git = (...args) => run('git', args);
const gh = (...args) => run('gh', [...args, '--repo', REPO]);

let hasTag = true;
try {
  git('rev-parse', '--verify', '--quiet', `refs/tags/${TAG}`);
} catch {
  hasTag = false;
}

// 태그(있으면) 또는 워킹 트리의 파일. 커밋 안 한 변경도 그대로 반영된다
const readAt = (ref, file) => (ref ? git('show', `${ref}:${file}`) : readFileSync(file, 'utf8'));

// 릴리스된 셸(태그)에 들어간 공개키. 이 키로 검증돼야 사용자 앱이 받아들인다. 태그가 없으면 릴리스 전이라 워킹 트리 것을 쓴다
function readPublicKey() {
  const ref = hasTag ? TAG : null;
  const pem = readAt(ref, 'src/main/bundleUpdate.ts').match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/)?.[0];
  return pem ?? fail(`${ref ?? '워킹 트리'}의 bundleUpdate.ts에 PEM 공개키가 없습니다`);
}

function verified(manifestText, publicKey) {
  try {
    return readManifest(manifestText, publicKey, VERSION);
  } catch (error) {
    return fail(`manifest 검증 실패: ${error.message}`);
  }
}

function stage() {
  const keyPath = process.env.MIRINAE_BUNDLE_KEY ?? fail('MIRINAE_BUNDLE_KEY에 개인키 파일 경로를 지정하세요');
  const publicKey = readPublicKey();

  if (hasTag) {
    const shellDiff = git('diff', '--name-only', TAG, '--', ...SHELL_PATHS);
    if (shellDiff) fail(`${TAG} 이후 셸 파일이 바뀌었습니다. 셸 변경사항 적용을 위해 셸 배포를 진행하세요 :\n${shellDiff}`);
    const dependenciesAt = (ref) => JSON.parse(readAt(ref, 'package.json')).dependencies;
    const electronAt = (ref) => JSON.parse(readAt(ref, 'package-lock.json')).packages['node_modules/electron'].version;
    if (!isDeepStrictEqual(dependenciesAt(TAG), dependenciesAt(null))) fail(`${TAG} 이후 dependencies가 바뀌었습니다`);
    if (electronAt(TAG) !== electronAt(null)) fail(`${TAG} 이후 Electron 버전이 바뀌었습니다`);
  } else {
    console.warn(`⚠ ${TAG} 태그가 없어 셸 변경 가드를 건너뜁니다. 릴리스 전 셸이라 받을 사용자가 없을 때만 괜찮습니다`);
  }

  const build = Number(new Date().toISOString().replace(/\D/g, '').slice(0, 14)); // YYYYMMDDHHmmss
  execSync('npm run typecheck:web && npx electron-vite build', { stdio: 'inherit', env: { ...process.env, VITE_BUNDLE_BUILD: String(build) } });

  const dir = buildDir(build);
  mkdirSync(dir, { recursive: true });
  const outDir = join('out', 'renderer');
  const files = {};
  for (const entry of readdirSync(outDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath, entry.name);
    const data = readFileSync(full);
    const hash = sha256(data);
    files[relative(outDir, full).split(sep).join('/')] = { sha256: hash, size: data.length };
    copyFileSync(full, join(dir, hash));
  }

  const commit = `${git('rev-parse', '--short', 'HEAD')}${git('status', '--porcelain') ? '-dirty' : ''}`;
  const payload = JSON.stringify({ shellVersion: VERSION, build, commit, files });
  const signature = sign(null, Buffer.from(payload), createPrivateKey(readFileSync(keyPath))).toString('base64');
  const manifestText = JSON.stringify({ payload, signature });
  verified(manifestText, publicKey);

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, manifestText);
  const record = { build, shellVersion: VERSION, commit, manifestSha256: sha256(manifestText) };
  writeFileSync(join(dir, 'record.json'), `${JSON.stringify(record, null, 2)}\n`);
  console.log(record);
}

const ensureRelease = (name, title) => {
  try {
    gh('release', 'view', name, '--json', 'name');
  } catch {
    gh('release', 'create', name, '--title', title, '--notes', `미리내 셸 ${VERSION}용 렌더러 번들`);
  }
};

async function publish() {
  if (!existsSync(MANIFEST_PATH)) fail('스테이징된 manifest가 없습니다. npm run bundle:stage를 먼저 실행하세요');
  const manifest = verified(readFileSync(MANIFEST_PATH, 'utf8'), readPublicKey());
  const dir = buildDir(manifest.build);
  for (const [path, file] of Object.entries(manifest.files)) {
    const staged = join(dir, file.sha256);
    const data = existsSync(staged) ? readFileSync(staged) : null;
    if (!data || sha256(data) !== file.sha256 || data.length !== file.size) fail(`스테이징 이후 파일이 바뀌었거나 없습니다: ${path}`);
  }

  const live = await fetch(`https://github.com/${REPO}/releases/download/${RELEASE}/manifest.json`);
  if (live.ok) {
    const publishedBuild = JSON.parse(JSON.parse(await live.text()).payload).build;
    if (manifest.build <= publishedBuild) fail(`배포된 build(${publishedBuild})보다 커야 합니다: ${manifest.build}`);
  } else if (live.status !== 404) {
    fail(`운영 manifest 확인 실패: HTTP ${live.status}`);
  }

  const filesRelease = `bundle-${manifest.build}`;
  ensureRelease(filesRelease, `${RELEASE} · build ${manifest.build}`);
  const hashes = [...new Set(Object.values(manifest.files).map((file) => file.sha256))];
  gh('release', 'upload', filesRelease, ...hashes.map((hash) => join(dir, hash)), '--clobber');

  ensureRelease(RELEASE, RELEASE);
  gh('release', 'upload', RELEASE, MANIFEST_PATH, '--clobber');
  console.log(`✔ ${filesRelease} 배포 완료 (파일 ${hashes.length}개) → ${RELEASE}/manifest.json 교체`);
}

if (process.argv.includes('--publish')) await publish();
else stage();
