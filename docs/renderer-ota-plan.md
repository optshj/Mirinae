# 렌더러 OTA 업데이트 계획

> 상태: 계획 (2026-09-15) · 대상: `mirinae/` · 첫 적용 셸: **v1.0.0 풀 릴리스**
> 호스팅 비용: GitHub 무료 제공 범위 안에서 별도 요금 없이 운영할 예정이다. 서비스 정책은 바뀔 수 있다.

## 1. 요약

- **셸**(main + preload)은 지금처럼 electron-updater로 받고, 사용자가 설치를 승인한다.
- **번들**(renderer)은 GitHub Releases에서 백그라운드로 받아 **다음 실행 때** 적용한다. 사용자 승인은 없다.
- 번들을 원격 주소에서 바로 띄우지 않는다. 받아서 검증하고 `userData`에 저장한 뒤, 고정 origin `mirinae://app`으로 띄운다.
- 받은 번들로 부팅이 연속 2회 실패하면 그 빌드를 차단하고 앱 내장 렌더러로 돌아간다.
- v1.0.0에서 **단일 인스턴스 잠금**을 넣는다. 프로세스가 두 개면 OTA 상태와 폴더를 서로 덮어쓰기 때문이다.
- 런타임 의존성 추가는 없다 (Node `crypto`, Electron `net.fetch`/`protocol`, 기존 `electron-store`). 업로드는 설치된 `gh` CLI로 한다.

배경:

- 지금은 렌더러만 고쳐도 설치 파일 전체를 받고, 사용자가 승인하고, 재시작해야 한다 (`src/main/index.ts:90`의 `loadFile`, `src/main/autoUpdate.ts`).
- 토스플레이스가 웹뷰 영역만 따로 배포하는 구조를 공개한 적이 있지만 구현 세부는 공개되지 않았다 ([바이라인네트워크](https://byline.network/2024/09/12-329/)). 이 문서의 설계는 미리내에 맞춰 새로 정한 것이다.
- `main` 브랜치는 v0.5.1 이후 `src/main`과 `src/preload`가 바뀌었다(#158). OTA 자체도 셸 변경이므로 **v1.0.0 풀 릴리스를 먼저 낸다.**

---

## 2. 핵심 결정

### 2.1 로딩 방식

- 원격 `https://` 주소를 직접 로드하지 않는다.
  - 로그인 시 자동 실행이라 네트워크가 준비되기 전에 부팅할 수 있다.
  - 배포 서버가 곧 코드 실행 권한이 된다.
- 번들 폴더를 `file://`로 직접 로드하지 않는다. `file:` URL의 localStorage 동작은 표준에 정의돼 있지 않다.
- 스킴 `mirinae`를 `standard: true, secure: true, supportFetchAPI: true`로 등록한다.
  - 이 등록은 app ready 전에만 할 수 있다.
  - standard로 등록하지 않으면 localStorage 같은 웹 저장소 API가 막힌다 (Electron protocol 문서).
- URL은 항상 `mirinae://app/index.html`이다. 핸들러 규칙은 3.4에 있다.

### 2.2 기존 설정 이관

origin이 `file://`에서 `mirinae://app`으로 바뀌므로 localStorage를 옮겨야 한다. 대상은 테마, 팔레트, 필터 등 모든 키와 PostHog distinct_id다.

기존 앱은 `loadFile(join(__dirname, '../renderer/index.html'))`, 즉 설치 폴더 `app.asar` 안의 페이지에서 localStorage를 썼다. 업데이트해도 설치 경로가 같으므로 v1.0.0 내장 렌더러도 **정확히 같은 URL**이다. 따라서 다른 `file://` 페이지가 아니라 **그 URL에서** 읽는다.

1. `mainWindow`를 만든 **뒤에** 시작한다. 창이 하나도 없을 때 숨김 창을 닫으면 `window-all-closed`로 앱이 종료되기 때문이다.
2. 기본 session에서 `protocol.handle('file')`로 **그 URL 요청만** 빈 HTML로 응답한다. 나머지 `file:` 요청은 `net.fetch(req, { bypassCustomProtocolHandlers: true })`로 원래 처리에 넘긴다.
3. 숨김 창으로 같은 URL을 연다. 앱 코드, 분석 이벤트, API 호출 없이 origin만 같은 빈 문서가 뜬다.
4. `executeJavaScript`로 `Object.entries(localStorage)`를 읽어 main 메모리에 보관한다. 창을 닫고 `protocol.unhandle('file')`로 가로채기를 해제한다.
5. 새 origin의 첫 로드에서 preload가 앱 코드보다 먼저 `sendSync('take-legacy-storage')`로 데이터를 받는다. **새 origin에 없는 키만** `setItem`한다. 재시도할 때 사용자가 새로 바꾼 값을 덮지 않기 위해서다.
6. 전부 성공하면 preload가 `legacy-storage-applied` ACK를 보낸다. main은 **ACK를 받은 뒤에만** `legacy-storage-migrated = true`를 저장한다. 실패하거나 중간에 끊기면 다음 실행에서 처음부터 다시 한다.

- 2번(`file:` 가로채기)이 Phase 0에서 안 되면 차선책으로 바꾼다: 숨김 창 전용 preload가 문서 시작 시점에 읽어서 보내고 창을 바로 닫는다. 이 방식은 앱 스크립트가 실행되기 전에 창이 닫힌다는 보장이 없다.
- **이 코드는 v1.0.0 미만에서 바로 올라오는 업그레이드를 지원하는 동안 유지한다.** 오래 실행하지 않던 사용자가 v0.5.x에서 v1.2.0으로 건너뛸 수 있다.

### 2.3 호스팅: GitHub Releases

- OTA 전용 공개 저장소 `optshj/mirinae-renderer`를 쓴다. 앱 저장소 `optshj/Mirinae`의 릴리스는 electron-updater가 셸 업데이트 대상으로 읽기 때문에 섞지 않는다.
- 릴리스 하나가 셸 버전 하나다 (태그 `shell-{version}`).
  - 에셋은 `manifest.json`과 **sha256을 이름으로 쓴 파일들**이다.
  - 릴리스에는 폴더가 없고, 내용이 같은 파일은 다시 올리지 않게 된다.
- 다운로드 주소: `https://github.com/optshj/mirinae-renderer/releases/download/shell-{version}/{manifest.json | sha256}`
- 공식 문서 기준 한도: 릴리스 총 용량·대역폭 제한 없음, 파일당 2GiB 미만, 릴리스당 에셋 1000개 ([About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)).
- 캐시 헤더는 직접 정할 수 없다. 교체 직후 예전 manifest가 잠깐 보여도 build 번호 비교(2.6) 때문에 무시된다.

### 2.4 셸과 번들의 호환성

- 번들은 **빌드 기준이 된 셸 버전으로만** 배포한다. 서명된 manifest에 `shellVersion`이 있고, 셸은 자기 `app.getVersion()`과 같을 때만 받는다.
- `window.electron`(`@electron-toolkit/preload`)으로 raw `ipcRenderer`를 노출하던 것을 없앤다.
  - 이제 렌더러는 preload의 `Api` 타입에 있는 것만 부를 수 있다.
  - 기존 사용처는 `src/renderer/app/main.tsx:29`의 `process.platform` 하나라서 `window.api.platform`으로 바꾼다.
  - 타입은 개발 실수를 막을 뿐 런타임 권한 통제가 아니다. 그래서 민감한 IPC는 따로 발신자를 검증한다 (2.6).
- 배포 스크립트 가드. 호환성을 보장하지는 않고 실수를 막는 용도다.
  - `git diff v{version} HEAD -- src/main src/preload electron-builder.json electron.vite.config.ts resources`가 비어 있어야 한다.
  - `dependencies`와 `package-lock.json`의 Electron 버전이 태그 시점과 같아야 한다.
- **설치된 릴리스 셸로 스테이징 번들을 띄워보는 테스트를 배포 조건으로 둔다** (6.2).
- 같은 셸 버전 안에서는 localStorage를 **하위 호환되게만** 바꾼다. 번들이 실패하면 내장 렌더러로 돌아가는데, 내장 렌더러가 그 데이터를 읽을 수 있어야 한다.

### 2.5 적용 시점

- 업데이트 확인은 **실행 30초 후 한 번만** 한다. 셸 업데이트 확인(`autoUpdate.ts`의 `checkForUpdates()`)도 실행 시 한 번이다.
  - 실행 중에 배포된 번들은 재시작을 한 번 더 해야 적용된다. 어차피 적용이 다음 실행 때라서, 주기적으로 확인해도 앞당겨지는 건 재시작 한 번분이다.
  - 부팅 직후 네트워크가 안 되면 그 실행은 건너뛰고 다음 실행 때 다시 확인한다.
  - 도달률이 낮으면 그때 실패 시 재시도나 주기 확인을 추가한다 (8장).
- 받은 번들은 **다음 실행 때만** 적용한다. 실행 중 교체는 8장으로 미룬다.

### 2.6 보안

배포 서버(GitHub 계정과 저장소 포함)는 신뢰하지 않는다.

**서명과 manifest**

- manifest payload를 문자열째 Ed25519로 서명한다.
  - 공개키는 main 코드(`rendererUpdate.ts`)에 넣는다.
  - 개인키는 저장소 밖에 두고 반드시 백업한다.
- 서명과 별도로 스키마를 검증한다.
  - payload와 signature가 문자열이다.
  - `build`는 양의 안전한 정수다.
  - `index.html`이 들어 있다.
  - sha256은 64자리 hex다.
  - `size`는 0 이상 20MB 이하의 안전한 정수다.
  - 파일은 100개 이하, 총합 50MB 이하다.
- 파일 경로 규칙:
  - 세그먼트는 `[\w.-]`로만 이루어진다.
  - `.`으로 시작하거나 `.`으로 끝나면 안 된다. `..`, 절대 경로, 역슬래시, `C:`가 이 규칙으로 막힌다.
  - Windows 예약 이름(`con`, `prn`, `aux`, `nul`, `com1-9`, `lpt1-9`, 확장자가 붙어도 포함)은 거부한다.
  - 대소문자만 다른 경로가 겹치면 거부한다.
- manifest는 JSON 파싱 **전에** 스트리밍 단계에서 1MB로 자른다. 파일도 서명된 `size`를 넘는 순간 연결을 끊는다. 받은 내용은 sha256으로 확인하므로, 해시가 맞으면 바이트 수도 맞다.
- **다운그레이드 방지**: `highestBuild`보다 낮은 build는 거부한다. 이 값은 실패로 복구된 뒤에도 내려가지 않는다.
- 로드 직전에 서명과 해시를 다시 검증한다. 목적은 손상·변조 탐지이고, 같은 권한을 가진 로컬 공격자를 완전히 막지는 못한다.

**IPC와 창**

- **IPC 발신자 검증(이번에 적용)** 대상: `take-legacy-storage`, `legacy-storage-applied`, `renderer-ready`, `google-request`, `open-external`
  - `event.sender === mainWindow.webContents`
  - `event.senderFrame.parent === null` (메인 프레임)
  - `senderFrame.url`이 앱 URL로 시작한다 (운영 `mirinae://app/`, dev `ELECTRON_RENDERER_URL`). 커스텀 스킴은 `URL.origin`이 `"null"`이라 origin 대신 접두사로 비교한다.
  - `renderer-ready`는 추가로 이번 attempt URL과 정확히 같아야 한다.
- 창 이동 제한:
  - `will-navigate`는 전부 막는다.
  - `setWindowOpenHandler`는 `deny`로 둔다.
  - 렌더러에는 링크나 `window.open`이 없고 외부 링크는 `openExternal`만 쓴다 (grep 확인).
- `open-external`: 인자가 문자열이고, `URL.canParse`를 통과하고, `protocol === 'https:'`일 때만 연다.

**키와 계정 사고**

- 개인키가 유출되면 폐기 수단이 없다. 새 키를 넣은 셸을 풀 릴리스하는 수밖에 없다.
- GitHub가 털려도 개인키가 없으면 가짜 번들을 만들 수 없다. 공격자는 manifest를 지워 업데이트를 멈추게 할 수 있을 뿐이다.

---

## 3. 상태와 흐름

### 3.1 상태 (`electron-store` 키 `renderer-ota`)

```ts
type OtaState = {
  shellVersion: string; // 현재 셸과 다르면 전체 초기화
  highestBuild: number; // 받아들인 가장 높은 build, 내려가지 않음
  activeBuild: number | null; // 부팅에 쓰는 build
  pendingBuild: number | null; // 받아뒀다가 다음 실행에 active로 올릴 build
  bootingBuild: number | null; // ready를 기다리는 중인 build. 다음 실행에 남아 있으면 부팅이 중단된 것
  failedBoots: number; // activeBuild 연속 실패 횟수
  badBuilds: number[];
};
```

- **논리적 상태 전환 하나는 `store.set('renderer-ota', next)` 한 번으로 저장한다.**
  - `updateState(mutate)`는 최신 상태 읽기 → 변경 → 쓰기를 `await` 없이 동기로 처리한다.
  - 오래전에 읽어둔 객체를 나중에 쓰지 않는다.
- electron-store가 쓰는 conf는 `atomically`로 파일을 원자적으로 쓴다. 단, Windows `EXDEV` 오류가 나면 일반 쓰기로 폴백한다 (`node_modules/conf/dist/source/index.js`).
- 상태는 main 프로세스에서만, 단일 인스턴스 잠금을 얻은 프로세스만 바꾼다.

### 3.2 부팅

1. `shellVersion`이 다르면 상태를 초기화한다.
2. 한 번의 전환으로 처리한다.
   - 남아 있는 `bootingBuild`는 실패 1회로 세고 지운다. 이 실패가 2회째면 그 빌드를 차단한다.
   - 그다음 `pendingBuild`가 있으면 active로 올리고 `failedBoots = 0`으로 둔다.
3. `activeBuild`가 없으면 내장 렌더러를 띄운다.
4. `activeBuild` 폴더를 재검증한다.
   - 통과하면 manifest의 파일 목록을 메모리에 둔다. 프로토콜 핸들러가 이 목록만 제공한다.
   - 실패하면 `activeBuild = null`로 두고 내장 렌더러를 띄운다. 파일 문제는 빌드 결함이 아니므로 차단하지 않는다.
5. `bootingBuild`를 기록하고 감시를 시작한 뒤 `mirinae://app/index.html?attempt={UUID}`를 로드한다.
   - 감시 대상: 20초 타이머, ready, `did-fail-load`, `render-process-gone`, `before-quit`, `suspend`/`resume`
   - 리스너는 로드보다 먼저 등록한다.
6. **attempt 하나는 정확히 한 번만 결론을 낸다** (`settled` 플래그). 결론을 낼 때 타이머와 리스너를 모두 해제한다.
   - **성공** (유효한 ready): `bootingBuild = null`, `failedBoots = 0`
   - **실패** (타임아웃, 메인 프레임 `did-fail-load`(`-3` ERR_ABORTED 제외), `render-process-gone`): `bootingBuild = null`과 실패 +1(2회째면 차단)을 한 번에 저장하고, 이번 세션은 내장 렌더러를 띄운다. `bootingBuild`를 지우므로 다음 실행에서 같은 실패를 다시 세지 않는다.
   - **중단** (`before-quit`): 실패로 세지 않고 `bootingBuild`만 지운다.
   - **절전**: `suspend`면 타이머를 멈추고, `resume`하면 20초를 새로 준다.
   - 강제 종료나 OS 종료처럼 정리하지 못한 경우만 다음 실행의 2번에서 센다.

### 3.3 업데이트 확인 (실행당 1회)

1. `activeBuild`와 `pendingBuild`를 제외한 번들 폴더를 지운다.
2. manifest를 받는다 (1MB 제한). 404면 이 셸용 OTA가 없는 것이므로 끝낸다.
3. 서명과 스키마를 검증한다. `build >= highestBuild`이고, active·pending과 다르고, bad가 아닐 때만 계속한다.
4. 파일마다 크기 제한을 걸고 스트리밍으로 받아 sha256을 확인하고 `{build}.download/`에 저장한다.
   - manifest 원문은 `.manifest.json`으로 같이 저장한다. 경로 규칙상 번들 파일 이름과 겹칠 수 없다.
   - 모두 받으면 폴더 이름을 `{build}/`로 바꾼다.
5. 상태를 **다시 읽어** 3번 조건을 재확인하고, `pendingBuild`와 `highestBuild`를 한 번의 전환으로 저장한다. 이전 pending 폴더는 지운다.
6. 네트워크·서명·해시 실패는 로그만 남기고 다음 실행에서 재시도한다. 중단된 `.download` 폴더는 승격되지 않고 1번에서 지워진다.

### 3.4 프로토콜 핸들러와 초기화 순서

**초기화 순서**

- app ready 전: 단일 인스턴스 잠금을 요청한다 (실패하면 OTA·상태 초기화 전에 종료). 스킴을 등록한다.
- app ready 후: `protocol.handle('mirinae')` → `createWindow` → 설정 이관(2.2) → `loadRenderer` → 업데이트 확인 타이머 시작
- `mainWindow`가 기본 session을 쓰므로 핸들러도 기본 session에 등록한다.

**요청 처리**

- 요청 검증
  - `GET`만 허용한다 (그 외 405).
  - host가 정확히 `app`이 아니면 404를 준다.
  - pathname 디코딩에 실패하면 400을 준다.
- 제공 범위
  - 내장 렌더러: 번들 루트 밖으로 벗어나지 않는 경로(`safeJoin`)만 제공한다.
  - OTA: **검증된 manifest 파일 목록에 있는 경로만** 제공한다. `.manifest.json`도 404다.
- 응답
  - 파일은 `net.fetch(fileUrl, { bypassCustomProtocolHandlers: true })`로 읽는다.
  - 모든 응답에 `Cache-Control: no-store`를 붙인다.
  - 없는 파일은 404, 그 밖의 오류는 500을 준다.

---

## 4. 데이터 형식

```
github.com/optshj/mirinae-renderer/releases/shell-1.0.0/
├── manifest.json        배포마다 교체
├── 9f2c…(sha256)        index.html
└── 41ab…(sha256)        assets/index-XXXX.js ...
```

```json
{
  "payload": "{\"shellVersion\":\"1.0.0\",\"build\":20261001093000,\"commit\":\"61da449\",\"files\":{\"index.html\":{\"sha256\":\"9f2c…\",\"size\":601}}}",
  "signature": "base64…"
}
```

- `build`는 스테이징 시각을 UTC `YYYYMMDDHHmmss` 정수로 쓴 값이다.
- `commit`은 디버깅용이라 검증하지 않는다.
- 렌더러는 빌드 때 주입된 `import.meta.env.VITE_RENDERER_BUILD`로 자기 build를 안다 (내장 렌더러는 `'bundled'`). PostHog `renderer_build` 속성으로 붙인다.

---

## 5. 변경 파일

| 파일                                       | 할 일                                                                                                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main/store.ts`                        | `MIRINAE_OTA_URL`이 있으면 스토어 생성 **전에** userData를 `{userData}-ota-test`로 바꾼다 (6.2). 기본값에 `renderer-ota`, `legacy-storage-migrated: false` 추가                        |
| `src/main/index.ts`                        | 파일 최상단에 단일 인스턴스 잠금. 3.4 초기화 순서. `will-navigate`와 `setWindowOpenHandler` 차단                                                                                       |
| `src/main/rendererManifest.ts` (신규)      | `readManifest`: 서명·스키마 검증 (2.6). `safeJoin`: 루트 밖 경로 거부. electron import 없음                                                                                            |
| `src/main/rendererManifest.test.ts` (신규) | 정상 / payload 변조 / 셸 버전 불일치 / index.html 누락 / 위험 경로(`../x`, `/x`, `C:/x`, `a\x`, `a/../x`, `.x`, `x.`, `con.js`, 대소문자 충돌) / 크기·개수·총합 초과 / `safeJoin` 이탈 |
| `src/main/rendererUpdate.ts` (신규)        | 스킴 등록, `updateState`, 3.2 부팅, 3.3 확인, 3.4 핸들러. 요청은 `net.fetch` (시스템 프록시 반영, GitHub 302 리다이렉트 자동 추적)                                                     |
| `src/main/legacyStorage.ts` (신규)         | 2.2의 main 쪽 (`file:` 가로채기, 읽기, 백업, ACK 후 플래그 저장)                                                                                                                       |
| `src/main/ipcHandler.ts`                   | `isTrustedSender(event)` export. `google-request`·`open-external`에 적용하고, `open-external` 검증(2.6)과 `openExternal` 실패 catch 추가                                               |
| `src/main/versionCheck.ts:18`              | `webContents.on` → `once` (복구 리로드 때 패치노트가 다시 뜨는 것 방지)                                                                                                                |
| `src/main/activeWindow.ts`                 | `did-finish-load`마다 `lastIsExplorer = undefined` (리로드 후 `update-clickable` 재전송)                                                                                               |
| `src/preload/index.ts`                     | 최상단에 이관 수신 + ACK 전송. `Api`에 `platform`, `rendererReady` 추가. `window.electron` 노출 제거                                                                                   |
| `src/renderer/global.d.ts`                 | `electron: ElectronAPI` 제거                                                                                                                                                           |
| `src/renderer/app/main.tsx`                | `posthog.register({ renderer_build })` 추가, `window.api.platform` 사용                                                                                                                |
| `src/renderer/app/App.tsx`                 | `useEffect(() => window.api.rendererReady(), [])`                                                                                                                                      |
| `scripts/ota.js` (신규)                    | 6.1                                                                                                                                                                                    |
| `package.json`                             | `"ota:stage": "node scripts/ota.js"`, `"ota:publish": "node scripts/ota.js --publish"`                                                                                                 |
| `.gitignore`                               | `*.pem` 추가                                                                                                                                                                           |

- ready 신호는 네트워크 로딩을 기다리지 않는다. 오프라인 부팅이 실패로 판정되면 안 된다.
- 지금 렌더러에는 ErrorBoundary, Suspense, lazy가 없어서 루트가 커밋되면 정상 렌더다. 루트에 이런 것을 추가하면 ready 호출 위치를 정상 화면 컴포넌트로 옮긴다.
- npm 스크립트를 두 개로 나눈 이유: PowerShell 5.1에서는 `npm run x -- --flag`의 `--`가 사라진다.

---

## 6. 배포

### 6.1 `scripts/ota.js`

**stage** (`npm run ota:stage`, 환경변수 `MIRINAE_OTA_KEY` = 개인키 파일 경로)

1. 워킹 트리가 깨끗해야 한다. `v{version}` 태그가 있어야 하고, 2.4 가드를 통과해야 한다.
2. `VITE_RENDERER_BUILD={build}`로 `npm run build`를 실행한다.
3. `out/renderer`의 파일마다 2.6 스키마를 검사한다. `{sha256, size}`를 계산해 `release/ota/shell-{version}/{sha256}`에 복사한다.
4. payload(`commit` 포함)에 서명한다. 서명은 **`git show v{version}:src/main/rendererUpdate.ts`에서 뽑은 공개키**로 검증한다. 릴리스된 셸에 들어간 키와 개인키가 짝이 맞는지 확인하는 단계다.
5. `manifest.json`을 쓰고, build·shellVersion·commit·manifest sha256을 출력하고 `release/ota/shell-{version}/{build}.json`에 기록한다.

**publish** (`npm run ota:publish`, 재빌드 없음)

1. 스테이징 manifest의 서명을 셸 태그의 공개키로 확인한다. 파일마다 이름과 sha256이 일치하는지도 확인한다. 테스트 중에 산출물이 바뀌었으면 거부된다.
2. 운영 manifest의 build보다 커야 한다. 같은 build를 다시 올리거나 PC 시계가 틀린 경우를 막는다.
3. `shell-{version}` 릴리스가 없으면 만들고, 아직 올라가지 않은 해시 파일만 올린다.
4. 마지막에 `manifest.json`을 `--clobber`로 올린다. 교체하는 순간 잠깐 404가 날 수 있지만 클라이언트는 "업데이트 없음"으로 처리한다.
5. 에셋이 900개를 넘으면 경고한다.
   - 정리는 수동으로 하고, 최근 배포 몇 개가 참조한 에셋은 남긴다.
   - 옛 manifest를 받은 클라이언트가 아직 다운로드 중일 수 있으니, manifest 교체 직후에는 지우지 않는다.

배포는 한 사람이 한 PC에서만 한다고 전제한다. 그래서 동시 배포 잠금은 두지 않는다.

### 6.2 일반 배포 절차

1. `npm run ota:stage`
2. `npx http-server release/ota -p 8080 -c-1`로 로컬 서버를 띄운다.
3. 실행 중인 미리내를 종료한다 (단일 인스턴스 잠금 때문에 두 번째 실행은 바로 꺼진다).
4. 설치된 exe를 `MIRINAE_OTA_URL=http://127.0.0.1:8080` 환경변수로 실행한다.
   - 이 환경변수가 있으면 userData가 `{userData}-ota-test`로 분리된다. 운영 프로필의 `highestBuild`, `badBuilds`, localStorage가 오염되지 않는다.
   - 30초 후 받아지는지, 재실행하면 적용되는지 확인한다.
5. `npm run ota:publish`

- 설정 이관 테스트만은 환경변수 없이, v0.5.x를 설치해 쓰던 실제 프로필에서 한다.

### 6.3 OTA로 배포할 수 있는 변경

| 가능 ✅                                                                          | 불가 ❌ (풀 릴리스 필요)                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/**`, 렌더러 라이브러리(전부 `devDependencies`), localStorage 새 키 | `src/main/**`, `src/preload/**`, 새 `window.api`, `resources/**`, `electron-builder.json`, `electron.vite.config.ts`(렌더러 CSP 포함), `dependencies`, Electron 버전, localStorage 기존 키의 형식 변경·삭제 |

- `.env`의 `VITE_*`는 배포하는 PC의 값이 들어가므로 풀 릴리스 때와 같은지 확인한다.
- **핫픽스** (main에 셸 변경이 섞여 있을 때): `git switch -c hotfix/x v1.0.0` → 렌더러 커밋만 cherry-pick → stage, 테스트, publish → main에 머지. 구버전 셸용 배포도 같은 방법이다.
- **롤백**
  - 부팅이 깨지는 빌드는 클라이언트가 자동으로 복구한다.
  - 기능 버그는 정상 커밋이나 셸 태그에서 stage/publish 해서 더 높은 build로 덮는다.

### 6.4 준비 (1회)

1. 키 생성 (저장소 밖에서 실행). 출력된 공개키를 `rendererUpdate.ts`에 넣는다.
   ```bash
   node -e "const k=require('crypto').generateKeyPairSync('ed25519',{publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});require('fs').writeFileSync('mirinae-ota.pem',k.privateKey);console.log(k.publicKey)"
   ```
2. OTA 저장소 생성: `gh repo create optshj/mirinae-renderer --public --add-readme` (릴리스를 만들려면 커밋이 하나 필요하다)

---

## 7. 진행 단계와 검증

### Phase 0: 실기 확인 (코드 작성 전)

전제가 틀리면 해당 결정을 바꾼다.

1. `mirinae://app`으로 asar 안의 `out/renderer`를 띄운다. 모듈 스크립트, CSS, 폰트, CSP, PostHog 전송이 정상인지 본다. 모듈 스크립트가 막히면 privileges에 `corsEnabled` 추가를 검토한다.
2. 1번 상태에서 바탕화면 부착, 이동 모드, 클릭 포워딩을 확인한다. 클릭은 PowerShell `PostMessage`로 검증한다.
3. `protocol.handle('file')`로 기존 index.html URL을 빈 문서로 가로챈 뒤 읽은 localStorage가 v0.5.x에서 쓰던 설정과 같은지 본다. 안 되면 2.2의 차선책으로 바꾼다.
4. `app.setPath('userData')`를 스토어 생성 전에 바꾸면 스토어, localStorage, 로그, 단일 인스턴스 잠금이 모두 새 경로를 따르는지 확인한다.

### Phase 1: 구현

5장을 구현하고 6.4를 준비한다. `npm run typecheck`와 `npm run test`를 통과시킨다.

### Phase 2: 출시 전 로컬 검증 (`build:win` 설치 파일을 설치해서)

1. 정상 흐름: 받기 → 재실행 시 적용 → `renderer_build` 확인
2. v0.5.x → v1.0.0 설치: 설정과 distinct_id 유지. 두 번째 실행부터는 이관하지 않음
3. 이관 ACK 전에 강제 종료: 다음 실행에서 재시도. 그 사이 새 origin에서 바꾼 값은 유지
4. 오프라인 부팅: 받아둔 번들로 정상 부팅
5. manifest 변조, 파일 변조, 크기 초과, 위험 경로: 모두 적용 안 됨
6. 부팅 실패 빌드(`App` 최상단 `throw`): 1회차에 내장 렌더러, 2회차에 차단, 실패가 이중으로 세지지 않음
7. ready 대기 중 트레이로 종료: 실패로 세지 않음
8. ready 대기 중 절전: 복귀 후 20초 유예
9. ready를 받은 정상 OTA의 JS 파일 삭제: 재검증 실패 → 내장 렌더러, 차단 안 됨, 같은 build 재다운로드
10. 다운로드 중 로컬 서버 중단: `.download` 폴더가 적용되지 않고 다음 확인 때 정리됨
11. 두 번째 실행: 즉시 종료되고 상태 변화 없음
12. 새로고침 버튼: navigation 차단과 무관하게 정상 동작
13. OTA가 localStorage 새 키를 쓴 뒤 복구: 내장 렌더러 정상
14. 복구 리로드 후 다른 앱에 포커스: 바탕화면 클릭 차단 유지
15. 셸 버전을 올려 재설치: OTA 상태 초기화, 옛 폴더 정리

### Phase 3: v1.0.0 풀 릴리스

manifest가 아직 없으므로 내장 렌더러로 동작하고, 설정 이관만 실제로 일어난다. PostHog 사용자 수가 끊기지 않았는지 확인한다.

### Phase 4: 첫 OTA

작은 렌더러 수정으로 6.2 절차를 따른다. PostHog에서 `renderer_build` 분포와 build별 `$exception`을 확인한다.

---

## 8. 나중에 할 것

- **실행 중 교체**: 렌더러가 교체 가능 상태(열린 폼 없음, `useIsMutating() === 0`, 이동 모드 아님)를 main에 알리면 화면 잠금 시 교체한다. 풀 업데이트 토스트 재전송도 함께 처리한다.
- **나머지 IPC 핸들러 발신자 검증**: 2.6에 적용한 핸들러 외의 나머지
- **클라이언트 중복 다운로드 생략**: 해시가 같은 파일은 active 폴더에서 복사한다.
- **실행 중 재시도·주기 확인**: PostHog `renderer_build` 분포로 볼 때 새 번들이 사용자에게 너무 늦게 퍼지면
- **이관 코드 삭제**: v1.0.0 미만에서 바로 업그레이드하는 경로 지원을 끝낼 때
