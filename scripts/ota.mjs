// 렌더러 OTA 스테이징·배포 (docs/renderer-ota-plan.md 6.1)
//   npm run ota:stage    MIRINAE_OTA_KEY=개인키 파일 경로. 빌드·서명해서 release/ota/shell-{version}/ 에 둔다
//   npm run ota:publish  재빌드 없이 스테이징 결과를 GitHub Releases에 올린다
// 검증은 클라이언트와 같은 src/main/rendererManifest.ts를 쓴다 (Node 타입 스트리핑, Node 22.18+)
import { execFileSync, execSync } from 'node:child_process';
import { createPrivateKey, sign } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { readManifest, sha256 } from '../src/main/rendererManifest.ts';

const REPO = 'optshj/mirinae-renderer';
const SHELL_PATHS = ['src/main', 'src/preload', 'electron-builder.json', 'electron.vite.config.ts', 'resources'];

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;
const release = `shell-${version}`;
const stageDir = join('release', 'ota', release);
const manifestPath = join(stageDir, 'manifest.json');

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();
const git = (...args) => run('git', args);
const gh = (...args) => run('gh', [...args, '--repo', REPO]);

// 릴리스된 셸에 실제로 들어간 공개키. 이 키로 검증돼야 사용자 앱이 받아들인다
function tagPublicKey() {
  let source = '';
  try {
    source = git('show', `${tag}:src/main/rendererUpdate.ts`);
  } catch {
    fail(`${tag} 태그가 없거나 그 시점에 rendererUpdate.ts가 없습니다`);
  }
  return source.match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/)?.[0] ?? fail(`${tag}의 rendererUpdate.ts에 공개키가 없습니다`);
}

function verified(manifestText, publicKey) {
  try {
    return readManifest(manifestText, publicKey, version);
  } catch (error) {
    return fail(`manifest 검증 실패: ${error.message}`);
  }
}

function stage() {
  const keyPath = process.env.MIRINAE_OTA_KEY ?? fail('MIRINAE_OTA_KEY에 개인키 파일 경로를 지정하세요');
  if (git('status', '--porcelain')) fail('워킹 트리가 깨끗하지 않습니다');
  const publicKey = tagPublicKey();

  // 2.4 가드: 호환성을 보장하진 않고, 셸 변경이 섞인 번들을 내보내는 실수를 막는다
  const shellDiff = git('diff', '--name-only', tag, 'HEAD', '--', ...SHELL_PATHS);
  if (shellDiff) fail(`${tag} 이후 셸 파일이 바뀌었습니다. 풀 릴리스하거나 ${tag}에서 hotfix 브랜치를 만드세요:\n${shellDiff}`);
  const dependenciesAt = (ref) => JSON.parse(git('show', `${ref}:package.json`)).dependencies;
  const electronAt = (ref) => JSON.parse(git('show', `${ref}:package-lock.json`)).packages['node_modules/electron'].version;
  if (!isDeepStrictEqual(dependenciesAt(tag), dependenciesAt('HEAD'))) fail(`${tag} 이후 dependencies가 바뀌었습니다`);
  if (electronAt(tag) !== electronAt('HEAD')) fail(`${tag} 이후 Electron 버전이 바뀌었습니다`);

  const build = Number(new Date().toISOString().replace(/\D/g, '').slice(0, 14)); // UTC YYYYMMDDHHmmss
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_RENDERER_BUILD: String(build) } });

  mkdirSync(stageDir, { recursive: true });
  const outDir = join('out', 'renderer');
  const files = {};
  for (const entry of readdirSync(outDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath, entry.name);
    const data = readFileSync(full);
    const hash = sha256(data);
    files[relative(outDir, full).split(sep).join('/')] = { sha256: hash, size: data.length };
    copyFileSync(full, join(stageDir, hash));
  }

  const commit = git('rev-parse', '--short', 'HEAD');
  const payload = JSON.stringify({ shellVersion: version, build, commit, files });
  const signature = sign(null, Buffer.from(payload), createPrivateKey(readFileSync(keyPath))).toString('base64');
  const manifestText = JSON.stringify({ payload, signature });
  // 클라이언트와 같은 검증(서명·스키마·경로)을 셸 태그의 공개키로 돌린다. 개인키 짝이 안 맞으면 여기서 멈춘다
  verified(manifestText, publicKey);

  writeFileSync(manifestPath, manifestText);
  const record = { build, shellVersion: version, commit, manifestSha256: sha256(manifestText) };
  writeFileSync(join(stageDir, `${build}.json`), `${JSON.stringify(record, null, 2)}\n`);
  console.log(record);
  console.log('\n다음: npx http-server release/ota -p 8080 -c-1 → 설치된 앱을 MIRINAE_OTA_URL=http://127.0.0.1:8080 으로 실행해 확인 → npm run ota:publish');
}

async function publish() {
  if (!existsSync(manifestPath)) fail('스테이징된 manifest가 없습니다. npm run ota:stage를 먼저 실행하세요');
  const manifest = verified(readFileSync(manifestPath, 'utf8'), tagPublicKey());
  for (const [path, file] of Object.entries(manifest.files)) {
    const staged = join(stageDir, file.sha256);
    const data = existsSync(staged) ? readFileSync(staged) : null;
    if (!data || sha256(data) !== file.sha256 || data.length !== file.size) fail(`스테이징 이후 파일이 바뀌었거나 없습니다: ${path}`);
  }

  // 같은 build 재배포나 틀린 PC 시계를 막는다
  const live = await fetch(`https://github.com/${REPO}/releases/download/${release}/manifest.json`);
  if (live.ok) {
    const liveBuild = JSON.parse(JSON.parse(await live.text()).payload).build;
    if (manifest.build <= liveBuild) fail(`운영 build(${liveBuild})보다 커야 합니다: ${manifest.build}`);
  } else if (live.status !== 404) {
    fail(`운영 manifest 확인 실패: HTTP ${live.status}`);
  }

  let assets = [];
  try {
    assets = gh('release', 'view', release, '--json', 'assets', '--jq', '.assets[].name').split('\n').filter(Boolean);
  } catch {
    gh('release', 'create', release, '--title', release, '--notes', `미리내 셸 ${version}용 렌더러 번들`);
  }

  const missing = [...new Set(Object.values(manifest.files).map((file) => file.sha256))].filter((hash) => !assets.includes(hash));
  if (missing.length) gh('release', 'upload', release, ...missing.map((hash) => join(stageDir, hash)));
  // manifest는 마지막에 교체한다. 교체 순간의 404는 클라이언트가 "업데이트 없음"으로 처리한다
  gh('release', 'upload', release, manifestPath, '--clobber');

  const count = new Set([...assets, ...missing, 'manifest.json']).size;
  if (count > 900) console.warn(`⚠ 에셋 ${count}개: 1000개 제한 전에 옛 해시 파일을 수동으로 정리하세요. 최근 배포가 참조하는 파일은 남기고, manifest 교체 직후에는 지우지 마세요`);
  console.log(`✔ ${release} build ${manifest.build} 배포 완료 (새 파일 ${missing.length}개)`);
}

if (process.argv.includes('--publish')) await publish();
else stage();
