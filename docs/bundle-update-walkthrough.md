# 번들 업데이트 실행 흐름

> 대상: `src/main/bundleUpdate.ts`, `src/main/bundleManifest.ts` (흐름상 거치는 `index.ts`, `preload/index.ts`, `App.tsx`도 짧게 다룬다)
> 기준: 2026-09-18 워킹 트리. `파일:줄` 표기는 이 시점 기준이라 코드가 바뀌면 어긋난다.

---

## 한눈에 보기

앱이 켜질 때 실제로 실행되는 순서다. 아래 절 번호가 이 번호와 같다.

```
[모듈 로드]  0   index.ts가 bundleUpdate.ts를 import → 상수·상태 준비
[ready 전]   1   registerRendererScheme      mirinae:// 를 https급 스킴으로 등록
[ready 후]   2   handleRendererProtocol      mirinae:// 요청 처리기 등록
             3   createWindow
             4   loadRenderer
                  4-1 분기: dev / preview / 두 번째 호출
                  4-2 30초 뒤 checkForUpdate 예약
                  4-3 상태 확인: build 없음 → 내장 렌더러로 끝   ← 받은 번들이 적용되는 곳
                  4-4 verifyBuild: 디스크 번들 서명·해시 재검증 (실패 → 내장)
                  4-5 served = 번들 폴더 → watchBoot: 감시 시작 → 로드
             5   페이지 로드: 프로토콜 핸들러가 요청마다 파일 제공
             6   렌더러: React 마운트 → renderer-ready
             7   watchBoot 결론: 성공 / 실패(→ 이 실행만 내장 폴백) / 중단
[+30초]      8   checkForUpdate                                ← 실제 다운로드
                  8-1 지금 build 말고 전부 청소
                  8-2 manifest 받기
                  8-3 검증 + 지금 build보다 큰지
                  8-4 파일 받기 → .download → rename
                  8-5 상태의 build 교체 → 다음 실행의 4-3에서 적용
```

- **첫 실행**이면 상태가 비어 있어서 4-3에서 바로 내장 렌더러로 끝나고(4-4, 4-5, 7 없음), 8에서 처음으로 번들을 받는다. 받은 번들은 **다음 실행의 4-3**에서 적용된다.
- **실패 기록은 남기지 않는다.** 받은 번들이 있으면 매 실행 시도하고, 실패하면 그 실행만 내장으로 넘어간다(7).

디스크에 렌더러가 있는 곳은 두 군데다. 어느 쪽이든 URL은 `mirinae://app/index.html`이고, 어느 폴더에서 꺼낼지는 모듈 변수 `served`가 정한다.

```
내장 렌더러 : {설치폴더}/resources/app.asar/out/renderer/   ← EMBEDDED_ROOT, 항상 존재, 폴백
받은 번들   : {userData}/bundle-update/{build}/              ← buildDir(build)
              ├── index.html
              ├── assets/index-XXXX.js ...
              └── .manifest.json   (서명된 manifest 원문, 4-4 재검증용)
```

---

## 0. 모듈 로드 — 상수와 상태

`index.ts`가 `bundleUpdate.ts`를 import하는 순간 최상위 코드가 한 번 실행된다.

### 상수 (`bundleUpdate.ts:12–27`)

| 상수                    | 값                                 | 의미                                                                                                                                  |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_KEY`            | Ed25519 PEM                        | 서명 검증용 공개키. **셸 코드에 박혀 있어** 셸 릴리스 때 고정된다. stage 스크립트가 태그 시점 이 파일에서 정규식으로 뽑아 검증에 쓴다 |
| `APP_URL`               | `mirinae://app/`                   | 운영 렌더러의 고정 origin                                                                                                             |
| `DEV_URL`               | `npm run dev`일 때만 Vite 주소     | electron-vite dev가 `ELECTRON_RENDERER_URL`을 넣어준다. preview(`npm run start`)에선 `undefined`                                      |
| `RENDERER_URL_PREFIX`   | `DEV_URL ?? APP_URL`               | `ipcHandler.ts`의 `isTrustedSender`가 "우리 렌더러에서 온 IPC인가" 판단에 쓴다                                                        |
| `BUNDLE_ENABLED`        | `app.isPackaged`                   | 설치본에서만 번들 업데이트. dev·preview에 원격 번들이 섞이지 않게                                                                     |
| `MANIFEST_URL`          | `.../shell-{앱버전}/manifest.json` | 셸 버전별 manifest 하나. publish가 `--clobber`로 교체한다 = "이 셸의 최신 번들 포인터"                                                |
| `fileUrl(build, hash)`  | `.../bundle-{build}/{sha256}`      | 파일은 build별 릴리스에 **해시 이름**으로 올라간다. 경로 대신 해시로 부르니 폴더 없이 릴리스 에셋으로 올릴 수 있다                    |
| `EMBEDDED_ROOT`         | `out/main/../renderer`             | 셸과 같이 설치된 렌더러                                                                                                               |
| `MANIFEST_FILE`         | `.manifest.json`                   | 번들 폴더에 같이 저장하는 manifest 원문. `.`으로 시작해서 번들 파일과 이름이 겹칠 수 없다(4-4의 경로 규칙)                            |
| `BOOT_TIMEOUT_MS`       | 10초                               | 이 안에 ready가 안 오면 부팅 실패. 예외·크래시는 즉시 잡히니(7) 이 시간은 **멈춤**만 기다린다                                         |
| `UPDATE_CHECK_DELAY_MS` | 30초                               | 부팅 직후엔 CPU·네트워크가 바쁘고(로그인 시 자동 실행), 네트워크가 아직 안 붙었을 수 있어서 미룬다                                    |

### 상태 (`bundleUpdate.ts:29–38`)

`electron-store`의 `bundle-update` 키에 저장된다.

```ts
type BundleState = {
  shellVersion: string;
  build: number;
};

const readState = (): BundleState => {
  const state: BundleState | null = store.get('bundle-update');
  if (state?.shellVersion === app.getVersion()) return state;
  return { shellVersion: app.getVersion(), build: 0 };
};
```

| 필드           | 의미                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shellVersion` | 이 상태를 만든 셸 버전                                                                                                                             |
| `build`        | 받아서 검증을 마친 최신 build. `0`이면 없음. **내려가지 않고, 이 값 이하인 build는 받지 않는다** → 다운그레이드 차단과 중복 다운로드 방지를 맡는다 |

- `readState`는 저장된 상태가 **지금 셸 버전 것**일 때만 쓰고, 아니면(첫 실행, 셸 업데이트) `build: 0`인 빈 상태를 돌려준다. 옛 셸용 번들은 새 셸과 호환이 보장되지 않고, 옛 셸의 핫픽스 build 번호가 새 셸 번들보다 클 수도 있어서 전부 버린다.
  - 같은 이유로 상태 모양이 바뀌어도 마이그레이션이 필요 없다. 상태를 다루는 코드는 main에 있고, main이 바뀌면 셸 버전도 바뀐다.
- 상태를 쓰는 곳은 **8-5 한 곳뿐**이다. 나머지는 전부 읽기만 한다.

---

## 1. `registerRendererScheme` — 스킴 등록 (`index.ts:17` → `bundleUpdate.ts:43`)

```ts
protocol.registerSchemesAsPrivileged([{ scheme: 'mirinae', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
```

- Electron이 **app ready 전에만** 허용하는 API라 `index.ts` 최상단에서 부른다. 여기선 요청을 처리하지 않고 권한만 등록한다.
- `standard`: http처럼 `scheme://host/path`로 파싱한다. 상대 경로(`./assets/x.js`)가 풀리고, origin `mirinae://app`이 생기고, **localStorage가 허용된다**(standard가 아니면 웹 저장소가 막힘). 설정·PostHog id가 localStorage에 있으니 필수다.
- `secure`: https와 같은 secure context로 취급한다.
- `supportFetchAPI`: 렌더러가 `fetch('mirinae://app/...')`로 자기 파일을 읽을 수 있게 한다.

---

## 2. `handleRendererProtocol` — 처리기 등록 (`index.ts:97` → `bundleUpdate.ts:49`)

```ts
let served: { root: string; files?: Set<string> } = { root: EMBEDDED_ROOT };

export const handleRendererProtocol = () =>
  protocol.handle('mirinae', async (request) => { ... });
```

- `protocol.handle`: 이제부터 `mirinae://` 요청이 오면 이 함수가 불린다. 포트를 여는 서버가 아니라 **프로세스 안에서 요청을 가로채 `Response`를 돌려주는 핸들러**다.
- 이 시점엔 **등록만** 한다. 요청마다 도는 로직은 5에서 본다.
- 어느 폴더에서 꺼낼지는 `served`가 정한다. 기본값이 내장이라, 무슨 일이 있어도 일단 내장은 뜬다. `served`는 4에서 바뀐다.

---

## 3. 창 생성 (`index.ts:98`)

`createWindow()`로 창을 만든다. 아직 아무것도 로드하지 않는다(로드는 4에서).

---

## 4. `loadRenderer` — 어떤 렌더러로 부팅할지 (`index.ts:101` → `bundleUpdate.ts:86`)

```ts
export async function loadRenderer(win: BrowserWindow) {
  if (DEV_URL) return void win.loadURL(DEV_URL);
  if (booted || !BUNDLE_ENABLED) return void loadServed(win);
  booted = true;
  setTimeout(checkForUpdate, UPDATE_CHECK_DELAY_MS);

  const { build } = readState();
  if (build === 0) return loadEmbedded(win); // 아직 받은 build가 없으면 내장 렌더러로 부팅
  const files = await verifyBuild(build);
  if (!files) return loadEmbedded(win); // 검증 실패하면 내장 렌더러로 부팅

  served = { root: buildDir(build), files };
  watchBoot(win, build, `${APP_URL}index.html?attempt=${randomUUID()}`);
}
```

### 4-1. 분기

- **dev**: Vite dev 서버를 바로 연다(HMR). 프로토콜·번들 전부 건너뛴다.
- **preview**(`!BUNDLE_ENABLED`): 내장 렌더러를 `mirinae://`로 띄운다. preview로도 프로토콜 경로를 테스트할 수 있다.
- **두 번째 호출**(`booted`): macOS `activate`로 창을 다시 만들 때(`index.ts:108`). 업데이트 예약은 **프로세스당 한 번**이어야 하니, 지금 `served`로 다시 로드만 한다.
- 로드 헬퍼 `loadServed`(`bundleUpdate.ts:77`)는 `loadURL`의 reject(로드 중단·실패)를 로그로만 남긴다. **성공·실패 판정은 이 Promise가 아니라 7의 이벤트로 한다.**

### 4-2. 업데이트 확인 예약

아래 어떤 경로(내장 부팅, 검증 실패)로 빠지든 확인은 해야 하니 **분기보다 먼저** 둔다. 실행당 딱 한 번이다. 30초 뒤 8로 이어진다.

### 4-3. 상태 확인 — 받은 번들이 적용되는 곳

- 지난 실행의 8-5에서 `build`가 새 값으로 저장됐다면, 여기서 그 값을 읽는 순간이 **새 번들이 적용되는 순간**이다.
- `build === 0`(첫 실행, 이 셸용 번들 없음, 셸이 막 업데이트됨)이면 내장으로 끝난다.

폴백 함수(`bundleUpdate.ts:79`):

```ts
const loadEmbedded = (win) => {
  served = { root: EMBEDDED_ROOT };
  loadServed(win);
};
```

폴백은 항상 이 함수다(4-4 실패, 7 실패에서도 쓴다). `served`를 내장으로 되돌리고 다시 로드한다.

### 4-4. `verifyBuild` — 디스크 번들 재검증 (`bundleUpdate.ts:101`)

다운로드할 때(8) 이미 검증했지만, 그 뒤에 디스크가 손상되거나 파일이 바뀌었을 수 있으니 **로드 직전에 다시** 한다.

```ts
async function verifyBuild(build) {
  const manifest = readManifest(await readFile(join(dir, MANIFEST_FILE), 'utf8'), PUBLIC_KEY, app.getVersion());
  if (manifest.build !== build) throw new Error(`빌드 번호 불일치: ${manifest.build}`);
  for (const [path, file] of Object.entries(manifest.files)) {
    if (sha256(await readFile(join(dir, path))) !== file.sha256) throw new Error(`해시 불일치: ${path}`);
  }
  return new Set(Object.keys(manifest.files)); // → served.files 화이트리스트
  // 어떤 에러든 catch → log.warn('build N 재검증 실패, 내장 렌더러로 부팅') → null
}
```

1. 폴더 안 `.manifest.json`(8에서 저장한 원문)을 **`readManifest`로 서명부터 다시 검증**한다. (아래 상세)
2. **빌드 번호**: 폴더 이름(= 상태의 `build`)과 manifest에 서명된 build가 같아야 한다. 서명은 진짜인 다른 build의 manifest가 섞이면, 이어지는 해시 비교가 엉뚱한 목록으로 돌기 때문이다. 셸 버전은 1의 `readManifest` 안에서 이미 확인했다.
3. 목록의 **모든 파일** 해시를 비교한다. 없거나 다르면 실패.
4. 통과하면 경로 목록을 `Set`으로 돌려준다 → 5에서 이 목록에 있는 파일만 제공한다.

**실패하면** 내장으로 간다. 같은 build는 8-3에서 다시 받지 않으니, **더 높은 build가 배포될 때까지** 매 실행 재검증에 실패하고 내장으로 뜬다(재검증은 파일 몇 개 해시라 금방 끝난다).

한계: 같은 사용자 권한으로 파일을 바꿀 수 있는 공격자는 공개키가 박힌 셸 자체도 바꿀 수 있으니 완벽한 방어는 아니다. 목적은 **손상·어설픈 변조 탐지**다.

#### `readManifest` 상세 (`bundleManifest.ts:22`)

4-4와 8-3 두 곳에서 쓴다. `scripts/bundle.mjs`(stage/publish)도 같은 함수를 import해서 "사용자 앱이 이 manifest를 받아들일까"를 똑같은 코드로 확인한다. 그래서 이 파일엔 electron import가 없다(Node가 `.ts`를 바로 실행한다).

manifest 모양:

```json
{ "payload": "{\"shellVersion\":\"1.0.0\",\"build\":20261001093000,\"files\":{...}}", "signature": "base64..." }
```

**payload가 문자열**이다. JSON은 키 순서·공백에 따라 같은 데이터도 바이트가 달라지는데, 서명은 바이트에 대해 한다. 그래서 서명한 바이트를 문자열째 보관하고, 검증이 끝난 **뒤에** 파싱한다.

검사 순서(하나라도 걸리면 `throw` = 거부):

| 단계 | 코드                                               | 내용                                                                                                                                                                                                      |
| ---- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `JSON.parse(raw) ?? {}`                            | 바깥 JSON 파싱. `?? {}`는 raw가 `"null"`일 때 구조 분해 TypeError 대신 다음 줄 에러로 넘기려는 것                                                                                                         |
| 2    | `typeof payload/signature === 'string'`            | 형식                                                                                                                                                                                                      |
| 3    | `verify(null, Buffer.from(payload), 공개키, 서명)` | **Ed25519 서명 검증. 핵심.** Ed25519는 해시가 알고리즘에 포함돼 첫 인자가 `null`. 맞으면 = 개인키 주인이 만든 payload. GitHub가 털려도 개인키 없이는 가짜 번들을 못 만든다                                |
| 4    | `JSON.parse(payload)`                              | 서명 확인된 payload를 이제서야 파싱                                                                                                                                                                       |
| 5    | `shellVersion === 현재 셸`                         | URL(`shell-{version}`)에도 버전이 있지만 **URL은 서명 대상이 아니다.** 1.0.0용으로 서명된 manifest를 `shell-1.1.0`에 올려도 여기서 걸린다. 번들은 자기 셸의 `window.api`를 전제로 해서 다른 셸에선 깨진다 |
| 6    | `build`가 양의 안전한 정수                         | stage 시각 `YYYYMMDDHHmmss`라 클수록 최신. 8-3의 `build` 비교가 여기에 의존                                                                                                                               |
| 7    | `files`가 배열·null 아닌 객체                      | `typeof null`, `typeof []`도 `'object'`라 따로 막음                                                                                                                                                       |
| 8    | 파일 100개 이하                                    | 서명이 맞아도 실수로 이상한 걸 올렸을 때를 막는 안전장치                                                                                                                                                  |
| 9    | `Object.hasOwn(files, 'index.html')`               | 진입점 필수. `in`은 프로토타입까지 봐서(`'constructor' in {}` → true) `hasOwn`                                                                                                                            |
| 10   | 파일마다: `isSafeBundlePath(path)`                 | 경로 안전성 (아래)                                                                                                                                                                                        |
| 11   | 파일마다: 소문자 경로 중복 금지                    | Windows·macOS는 대소문자를 구분 안 해서 `A.js`와 `a.js`가 같은 파일이 된다 → 해시와 디스크 내용이 어긋남                                                                                                  |
| 12   | 파일마다: sha256이 소문자 hex 64자                 | 이 값이 다운로드 URL의 파일 이름이 되니 엄격하게                                                                                                                                                          |
| 13   | 파일마다: `isSize(size, 20MB)`                     | `Number.isSafeInteger` + 0 이상 + 상한. `"10"`, `1.5`, `NaN` 거부. 이 값이 8-4의 스트리밍 상한이 된다                                                                                                     |
| 14   | 합계 50MB 이하                                     |                                                                                                                                                                                                           |

`isSafeBundlePath`(`bundleManifest.ts:18`): manifest 경로를 `join(폴더, path)`로 디스크에 쓰니, 폴더 밖으로 나가거나 파일 시스템이 다르게 해석하는 이름을 막는다. `/`로 쪼갠 **모든 조각**이 네 조건을 통과해야 한다.

| 조건                                              | 막는 것                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/^[\w.-]+$/` (영문·숫자·`_`·`.`·`-`, 1글자 이상) | 빈 조각(`/x`, `a//b`), 역슬래시(`a\x`), 콜론(`C:/x`, NTFS 대체 스트림 `a.js:x`), 공백·`%`·유니코드 |
| `.`으로 시작 금지                                 | `.`, `..`(상위 폴더), 숨김 파일. `.manifest.json`과 겹칠 수 없는 것도 이 규칙 덕분                 |
| `.`으로 끝 금지                                   | Windows는 끝의 `.`을 떼서 `index.html.`과 `index.html`이 같은 파일이 된다                          |
| Windows 예약 이름 금지                            | `con`, `nul.js`, `com1.txt` — 확장자가 붙어도 장치로 취급된다                                      |

### 4-5. 번들로 전환 → `watchBoot` 시작 (`bundleUpdate.ts:116`)

- `served`를 번들 폴더로 바꾼다. 이제부터 프로토콜은 번들 폴더에서, **목록에 있는 파일만** 제공한다.
- `watchBoot`가 "이 번들이 실제로 화면까지 떴는가"를 판정한다. 시작할 때 하는 일:

```ts
ipcMain.on('renderer-ready', onReady);
webContents.on('did-fail-load', onFailLoad);
webContents.on('console-message', onConsole);
webContents.on('render-process-gone', onGone);
app.on('before-quit', onQuit);
powerMonitor.on('suspend', pauseTimer);
powerMonitor.on('resume', startTimer);
startTimer(); // 10초 타이머
loadServed(win, url); // 로드
```

- 리스너를 **로드보다 먼저** 등록한다. 로드가 아주 빨리 끝나거나 실패해도 이벤트를 놓치지 않는다.
- URL 끝의 `?attempt={uuid}`는 이번 시도만의 표식이다. 내장 렌더러도 같은 `mirinae://app/index.html`이라, 이게 없으면 폴백으로 뜬 내장 렌더러의 ready나 이전 시도의 늦은 ready를 번들 성공으로 착각할 수 있다. 이 uuid는 7의 `onReady`에서 확인한다.

---

## 5. 페이지 로드 — 요청마다 도는 프로토콜 핸들러 (`bundleUpdate.ts:50–75`)

`index.html`, `assets/*.js`, `*.css`를 요청할 때마다 2에서 등록한 함수가 돈다.

```ts
if (request.method !== 'GET') return respond(405); // 정적 파일 서버라 GET만
const url = new URL(request.url);
if (url.host !== 'app') return respond(404); // origin을 mirinae://app 하나로 고정
path = decodeURIComponent(url.pathname.slice(1)); // '/assets/x.js' → 'assets/x.js' (실패 시 400)

const { root, files } = served;
const file = files ? (files.has(path) ? join(root, path) : null) : safeJoin(root, path);

if (!file || !(await stat(file)).isFile()) return respond(404);
const response = await net.fetch(pathToFileURL(file).href, { bypassCustomProtocolHandlers: true });
headers.set('Cache-Control', 'no-store');
return new Response(response.body, { status: response.status, headers });
// ENOENT·ENOTDIR → 404, 그 외 → 로그 + 500
```

1. **요청 검증**: GET만(405), host는 `app`만(404). `?attempt=` 같은 쿼리는 `pathname`에 안 들어가서 무시된다. `decodeURIComponent`는 `%20` 같은 인코딩을 풀고, 잘못된 인코딩이면 400. 인코딩된 `%2e%2e%2f`(`../`)는 여기서 풀린 뒤 다음 단계에서 걸린다.
2. **파일 결정**:
   - 번들(`files` 있음): 목록에 **정확히 있는 경로만**. 폴더에 다른 파일이 끼어 있어도 제공하지 않는 화이트리스트다. `.manifest.json`도 목록에 없어서 404다. 목록 경로는 `isSafeBundlePath`를 통과했으니 `join`해도 밖으로 못 나간다.
   - 내장(`files` 없음): manifest가 없으니 `safeJoin`으로 root 밖만 막는다.
3. **파일 읽기**: `readFile` 대신 `file://` URL로 `net.fetch`한다.
   - Chromium이 **MIME 타입을 붙여준다.** `<script type="module">`은 MIME이 맞지 않으면 실행을 거부한다.
   - 스트리밍이라 큰 파일도 메모리에 통째로 안 올린다.
   - `bypassCustomProtocolHandlers`: `file:`에 커스텀 핸들러가 걸려 있어도 우회해서 진짜 파일을 읽는다. 지금은 `file:`을 가로채는 곳이 없어서 안전장치다.
4. **`Cache-Control: no-store`**: 내장이든 번들이든 URL이 똑같아서, 캐시가 남으면 build를 바꿔도 이전 파일이 뜰 수 있다. 에러 응답(`respond`)에도 붙인다.

`safeJoin`(`bundleManifest.ts:52`):

```ts
const full = resolve(root, path); // '..'까지 계산한 절대 경로
const rel = relative(root, full); // root에서 얼마나 떨어졌나
return rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel) ? full : null;
```

- `rel === ''` → root 자신(폴더) → 거부
- `..` 또는 `..\`로 시작 → root 밖 → 거부. `startsWith('..')`만 쓰면 root 안의 정상 파일 `..foo`까지 막아서 구분자까지 붙여 비교한다.
- `isAbsolute(rel)` → Windows에서 다른 드라이브면 `relative`가 절대 경로를 준다 → 거부

---

## 6. 렌더러 쪽 — ready 신호

React 마운트 → `App.tsx:20`의 `useEffect(() => window.api.rendererReady(), [])` → preload가 `ipcRenderer.send('renderer-ready')`.

- React 루트가 커밋돼야 `useEffect`가 돈다. 번들 JS가 초기화 중에 예외를 던지면 ready가 **안 오고**, 대신 콘솔에 `Uncaught ...`가 찍혀 7에서 즉시 잡힌다.
- ready는 네트워크 로딩(구글 캘린더)을 기다리지 않는다. 오프라인 부팅이 실패로 판정되면 안 되니까.
- 내장 렌더러도 ready를 보내지만, `watchBoot`가 없으면 듣는 쪽이 없어서 무시된다.

---

## 7. `watchBoot` 결론 (`bundleUpdate.ts:116–170`)

아래 신호 중 **먼저 온 하나로만** 결론을 낸다(`settled` 플래그).

| 신호                  | 결과      | 조건·이유                                                                                                                                                               |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderer-ready` IPC  | `ready`   | `isTrustedSender`(mainWindow의 메인 프레임, 앱 URL) **그리고** `senderFrame.url === 이번 attempt URL`(uuid 포함)                                                        |
| `console-message`     | `failed`  | `level === 'error'`이고 `Uncaught `로 시작. 시작 중 잡히지 않은 예외(모듈 실행 에러, React 렌더 에러) = 흰 화면이라 **즉시** 실패. `Uncaught (in promise)`는 제외(아래) |
| `did-fail-load`       | `failed`  | 메인 프레임만, 코드 `-3`(ERR_ABORTED) 제외. -3은 다른 로드가 시작돼 이전 로드가 취소될 때 나는 코드라 번들 결함이 아니다                                                |
| `render-process-gone` | `failed`  | 렌더러 프로세스가 죽음(크래시, OOM)                                                                                                                                     |
| 10초 타이머           | `failed`  | 위 어느 신호도 없이 ready가 안 옴 = **멈춤**(무한 루프, 끝나지 않는 대기). 먼저 `forcefullyCrashRenderer()`로 렌더러를 끝낸다                                           |
| `before-quit`         | `aborted` | 부팅 중 사용자가 앱을 종료함. 리스너만 정리한다                                                                                                                         |

- **`Uncaught (in promise)`를 빼는 이유**: 오프라인 부팅 때 네트워크 요청이 reject되는 것처럼 정상 상황에서도 나올 수 있다. 비동기 실패로 화면이 안 뜨면 타이머가 잡는다.
- CSP의 `Refused to apply inline style` 같은 메시지도 error 레벨이지만 `Uncaught`로 시작하지 않아서 걸리지 않는다.
- **타이머에서 렌더러를 끝내는 이유**: 멈춘 렌더러는 다음 `loadURL`을 처리하지 못할 수 있다. 프로세스를 끝내면 이어지는 로드가 새 프로세스에서 뜬다(Electron 35에서 무한 루프 페이지로 확인: 폴백이 새 pid로 로드됨). `render-process-gone`은 그 뒤에 오지만 이미 리스너가 해제돼 있다.
- **절전**: `suspend`면 타이머를 멈추고, `resume`하면 **10초를 새로** 준다. 절전 시간이 타임아웃으로 계산되면 멀쩡한 build가 실패로 찍힌다.

`settle`이 하는 일:

```ts
if (settled) return;
settled = true;
clearTimeout(timer);
// 리스너 7개 전부 해제

if (result === 'ready') log.info(`[BundleUpdate] build ${build} 부팅 성공`);
if (result !== 'failed') return;
log.error(`[BundleUpdate] build ${build} 부팅 실패: ${reason}`);
loadEmbedded(win);
```

- **리스너를 전부 해제**한다. 안 그러면 부팅이 끝난 뒤의 이벤트(나중의 크래시·콘솔 에러, 폴백 렌더러의 ready)가 결론을 뒤집으려 하고, 리스너도 쌓인다.
- **실패하면 이번 실행만 내장으로** 다시 띄운다. 상태에는 아무것도 쓰지 않으니 **다음 실행에서 같은 번들을 다시 시도**한다.
  - 로그인 직후처럼 PC가 느려서 생긴 오탐이면 다음 실행엔 번들로 뜬다.
  - 번들이 정말 깨졌으면 더 높은 build가 배포될 때까지 매 실행 이 폴백을 거친다. 예외라면 1~2초, 멈춤이라면 10초 뒤에 내장이 뜬다.

---

## 8. `checkForUpdate` — 실제 다운로드 (`bundleUpdate.ts:194`, 부팅 30초 뒤)

전체가 try/catch다. 네트워크·서명·해시·디스크 실패는 전부 로그만 남기고, 다음 실행에서 처음부터 다시 한다. 앱 동작에는 영향이 없다.

### 8-1. 청소 — `removeUnusedBuilds` (`bundleUpdate.ts:188`)

```ts
const keep = String(readState().build);
// bundle-update/ 아래에서 keep이 아닌 폴더 전부 삭제
```

- 옛 build, 중단된 `{build}.download`, 셸 업데이트 전의 폴더가 지워진다. 폴더가 아직 없으면(첫 실행) 그냥 넘어간다. `build`가 0이면 `'0'`이라는 폴더는 없으니 전부 지워진다.
- 지금 세션이 번들로 떴다면 그 폴더가 바로 `state.build`라 지워지지 않는다.
- 디스크에는 보통 **build 1개**만 남는다(8-4에서 새로 받은 직후엔 이번 세션이 쓰는 것까지 2개, 다음 실행의 청소 때 1개). **이전 번들로 롤백하는 경로는 없고, 폴백은 항상 내장이다.**

### 8-2. manifest 받기 — `download` (`bundleUpdate.ts:172`)

```ts
const raw = await download(MANIFEST_URL, MANIFEST_MAX_BYTES).catch((error) => {
  if (error.status === 404) return null;
  throw error;
});
if (!raw) return log.info('[BundleUpdate] 이 셸용 번들 없음');
```

- **404는 에러가 아니라 "이 셸용 번들 없음"**이다. 셸을 막 릴리스했거나 publish가 manifest를 교체하는 순간일 수 있다.

`download` 자체:

```ts
const response = await net.fetch(url, { cache: 'no-store' });
if (!response.ok) throw Object.assign(new Error(...), { status: response.status });
for await (const chunk of response.body) {
  size += chunk.length;
  if (size > maxBytes) throw new Error('크기 제한 초과');   // 루프를 빠져나가면 스트림 취소 = 연결 끊김
  chunks.push(chunk);
}
return Buffer.concat(chunks);
```

- `net.fetch`: Chromium 네트워크 스택이라 시스템 프록시를 따르고, GitHub 릴리스의 302 리다이렉트도 자동으로 따라간다. `cache: 'no-store'`로 방금 교체된 manifest를 캐시된 옛것으로 읽지 않는다.
- 에러에 `status`를 붙여 던져서 호출하는 쪽이 404만 따로 처리할 수 있다.
- **받으면서 크기를 센다.** 상한을 넘는 순간 끊는다. 서버가 거대한 응답을 보내도 상한 이상은 안 받는다.
  - manifest: 1MB(`MANIFEST_MAX_BYTES`). 서명 확인 전이라 내용을 믿을 수 없으니 크기부터 자른다.
  - 파일(8-4): 서명된 `size`. 정상이면 딱 그 크기라 넘을 일이 없고, 더 작게 오면 해시에서 걸린다.

### 8-3. 검증 + 받을지 판단

```ts
const { build, files } = readManifest(text, PUBLIC_KEY, app.getVersion()); // 4-4의 표와 같은 검증
if (build <= readState().build) return;
```

지금 `build` 이하는 전부 거부한다. 이 비교 하나가 두 가지를 막는다.

- **다운그레이드**: 예전 build의 manifest(서명은 진짜)를 다시 먹여도 안 받는다. CDN이 교체 직전의 옛 manifest를 잠깐 돌려줘도 무시된다.
- **중복 다운로드**: 이미 받은 build와 같으니, 대부분의 실행은 여기서 조용히 끝난다. 깨진 번들(4-4 실패, 7 실패)도 같은 번호라 다시 받지 않는다.

### 8-4. 파일 받기 → 임시 폴더 → rename

```ts
const temp = `${buildDir(build)}.download`;
for (const [path, file] of Object.entries(files)) {
  const data = await download(fileUrl(build, file.sha256), file.size);
  if (sha256(data) !== file.sha256) throw ...;                   // 서명된 해시와 같아야
  await mkdir(dirname(join(temp, path)), { recursive: true });   // assets/ 같은 하위 폴더
  await writeFile(join(temp, path), data);
}
await writeFile(join(temp, MANIFEST_FILE), text);                // 원문 저장 → 4-4 재검증용
await rename(temp, buildDir(build));                             // 완성본으로 한 번에 교체
```

- 바로 `{build}/`에 쓰지 않고 **`{build}.download/`에 받는다.** 도중에 끊겨도 반쯤 받은 폴더가 완성된 build처럼 보이지 않는다. 남은 찌꺼기는 다음 확인의 8-1에서 지워진다.
- 8-1이 지금 `build` 말고 전부 지웠고 새 build는 그보다 크니, `temp`도 `{build}/`도 이 시점엔 없다.
- 파일은 순서대로 하나씩 받고, 받을 때마다 **해시를 확인**한다. 해시가 맞다 = 개인키 주인이 서명한 그 내용이다.
- 마지막에 **rename 한 번**으로 완성본을 만든다. 같은 드라이브 안의 rename은 사실상 원자적이라 `{build}/`는 "없거나 완성본이거나" 둘 중 하나다.

### 8-5. 상태 저장

```ts
store.set('bundle-update', { shellVersion: app.getVersion(), build } satisfies BundleState);
log.info(`[BundleUpdate] build ${build} 받음, 다음 실행에 적용`);
```

- 새 build를 저장한다. 이 순간부터 이 build 이하는 거부된다.
- **이번 세션은 그대로다.** 지금 화면은 `served.root`(메모리)가 가리키는 폴더를 계속 쓰고, 옛 폴더는 다음 실행의 8-1에서 지워진다. 다음 실행의 **4-3**이 새 `build`를 읽는 순간 적용된다.

---

## 시나리오: 실행을 거듭할 때 상태 변화

셸 1.0.0 설치 직후부터. B1 < B2 < B3 < B4는 build 번호. 상태는 저장된 `build`.

| #   | 상황                              | 부팅 (4~7)                                             | 30초 뒤 (8)                                         | 끝난 뒤 `build` |
| --- | --------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | --------------- |
| 1   | 첫 실행                           | build 0 → 4-3 **내장**                                 | manifest B1 → 받음                                  | B1              |
| 2   | 재실행                            | B1 재검증 OK → ready                                   | B1 ≤ B1 → 끝                                        | B1              |
| 3   | B2 배포 후 실행                   | B1로 부팅 성공                                         | B2 > B1 → 받음                                      | B2              |
| 4   | 재실행, B2가 시작 중 예외를 던짐  | B2 로드 → `Uncaught ...` → **즉시 내장**               | B1 폴더 삭제. B2 ≤ B2 → 끝                          | B2              |
| 5   | 재실행                            | 다시 B2 시도 → 즉시 내장 (B3 배포 전까지 매 실행 반복) | B2 ≤ B2 → 끝                                        | B2              |
| 6   | B3(수정본) 배포 후 실행           | B2 시도 → 즉시 내장                                    | B3 > B2 → 받음                                      | B3              |
| 7   | 재실행                            | B3로 부팅 성공                                         | B2 폴더 삭제                                        | B3              |
| 8   | 로그인 직후 PC가 느려 10초를 넘김 | 렌더러 강제 종료 → 이번 실행만 내장                    | B3 ≤ B3 → 끝                                        | B3              |
| 9   | 재실행                            | B3 다시 시도 → 성공                                    |                                                     | B3              |
| 10  | B3 폴더 파일이 손상됨             | 4-4 재검증 실패 → 내장 (매 실행 반복)                  | B3 ≤ B3 → **다시 안 받음**                          | B3              |
| 11  | B4 배포 후 실행                   | 재검증 실패 → 내장                                     | B4 > B3 → 받음                                      | B4              |
| 12  | electron-updater로 셸 1.1.0 설치  | `readState`: shellVersion 다름 → build 0 → 내장        | 옛 폴더 전부 삭제, `shell-1.1.0/manifest.json` 확인 | 1.1.0용 새 상태 |

정리하면:

- 받은 번들은 **항상 다음 실행에** 적용된다(실행 중 교체 없음).
- 실패하면 **그 실행만** 내장으로 돌아가고, 다음 실행에 다시 시도한다. 이전 번들로 돌아가는 경로는 없다.
- 깨진 번들은 **더 높은 build를 배포해야** 벗어난다(롤백 = 수정본을 새 build로 publish).

---

## 알아둘 점

- **ready 전의 `Uncaught` 에러는 무해해도 실패로 본다.** 첫 렌더 전에 잡히지 않은 예외를 내는 코드(서드파티 스크립트 포함)가 있으면 멀쩡한 번들도 매 실행 내장으로 떨어진다. 초기화 코드의 예외는 잡아서 처리해야 한다.
- **깨진 번들이 죽기 전에 한 일이 매 실행 반복될 수 있다.** 예외나 멈춤 전에 보낸 PostHog 이벤트, 알림, API 호출 등이다.
- **ready 판정이 URL 완전 일치에 의존한다(7).** 지금 렌더러엔 라우터나 `history.pushState`가 없어서 괜찮다. 첫 렌더 전에 URL을 바꾸는 코드(라우터, 쿼리 정리 등)를 넣으면 ready가 인정되지 않아 모든 번들 부팅이 10초 뒤 내장으로 떨어진다. 루트에 ErrorBoundary·Suspense를 넣을 때도 `rendererReady()` 위치를 "정상 화면이 떴을 때"로 옮겨야 한다. ErrorBoundary가 렌더 에러를 잡으면 `Uncaught`로 찍히지 않아서, 에러 화면이 ready로 판정될 수 있다.
- 파일·함수 이름은 `bundle`인데 manifest 타입 이름만 `RendererManifest`다(`bundleManifest.ts:13`).
