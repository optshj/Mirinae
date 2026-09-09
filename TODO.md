# TODO — 전체 코드 점검 결과

2026-09-09 기준 `main`(v0.5.1) 전수 점검. 위에서부터 심각한 순서.
각 항목은 `파일:줄` → 증상 → 가장 짧은 고치는 법 순으로 적었다.

---

## 🔴 데이터 손실 · 기능이 조용히 망가지는 것

### 1. 일정을 수정/드래그하면 구글 캘린더의 나머지 정보가 전부 지워진다

`entities/event/api/index.ts:49` (`http.put`) + `entities/event/lib/createEventBody.ts`

`eventApi.update`는 **PUT**이고, `createEventBody`는 `summary`/`colorId`/`start`/`end`(+`recurrence`)만 만든다.
구글 `events.update`(PUT)는 리소스 **전체 교체**라, 보내지 않은 필드는 삭제된다:

- `description`(설명), `location`(장소), `attendees`(참석자), `reminders`(알림), `conferenceData`(Meet 링크), `attachments`
- `extendedProperties.private.completed` → **완료 표시한 일정을 드래그로 옮기면 완료가 풀린다**

구글 웹에서 만든 일정을 미리내에서 한 칸 옮기기만 해도 발생한다. 되돌릴 방법 없음.

**~~고치는 법: `update`를 `http.patch`로 바꾼다~~ → ✅ 완료** (`entities/event/api/index.ts`)
PATCH는 `start`/`end` 중첩 객체를 *병합*하므로 `{ date: null, dateTime: null, ...eventData.start }`로 반대쪽 키를 명시적으로 지운다.
⚠️ 종일↔시간 전환은 실기 1회 확인 필요.

### 2. 로그아웃 후 재로그인하면 자동 로그인이 영구히 깨질 수 있다

`main/oauth.ts:155-165`

`access_type=offline`만 있고 `prompt=consent`가 없다. 구글은 **최초 동의 때만** `refresh_token`을 준다.
로그아웃(`keytar` 삭제) 후 다시 로그인하면 `tokens.refresh_token`이 `undefined` → `oauth.ts:168`의 `if`가 걸러서 keytar에 아무것도 안 쓴다 → 앱 재시작 때마다 로그인 화면. 사용자가 구글 계정 설정에서 앱 권한을 직접 취소하기 전까지 복구 불가.

**고치는 법:** `authUrl.searchParams.append('prompt', 'consent')` 한 줄.

### 3. 일정 알림이 조용히 안 온다

`features/event-notification/lib/useEventNotifications.ts:30,48`

1시간 밖의 일정은 스킵하고 "items가 다시 바뀌면 재평가"에 의존하는데, react-query는 **structural sharing**이 기본값이라 폴링 결과가 같으면 `data` 레퍼런스가 그대로다 → `items` memo가 재계산되지 않음 → effect가 다시 안 돈다.
결과: 앱을 켜 둔 채 일정 변경이 없으면 **3시간 뒤 일정의 알림은 영영 예약되지 않는다.** 절전/복귀 후 `setTimeout` 드리프트도 같은 구멍.

**고치는 법:** effect 안에 `setInterval(schedule, 10분)` 추가하고 cleanup에서 clear.

### 4. "로그인 시 미리내 실행" 토글이 실제로 동작하지 않는다

`main/tray.ts:11,30` + `main/index.ts:21-24`

- `autoLaunchStatus`를 메뉴 만들 때 **한 번** 읽고, 클릭할 때마다 그 고정값의 `!`를 넣는다 → 두 번째 클릭부터 같은 값 재설정. 체크박스 표시도 갱신 안 됨.
- 그와 별개로 `index.ts`가 매 실행마다 `new AutoLaunch(...).enable()`을 무조건 호출 → 꺼도 다음 실행에 다시 켜진다.
- 자동 실행을 `auto-launch` 패키지와 `app.setLoginItemSettings` 두 경로로 이중 관리 중이라 서로 안 맞을 수 있다.

**고치는 법:** `index.ts`의 무조건 `enable()` 제거, 트레이는 클릭 시점에 `app.getLoginItemSettings().openAtLogin`을 읽고 `menuItem.checked`를 갱신. 관리 주체는 `setLoginItemSettings` 하나로.

### 5. 뮤테이션이 실패해도 사용자는 성공했다고 본다

`features/event/ui/AddEventForm.tsx:38-41`, `DeleteEventButton.tsx:19-25`, `EditEventForm.tsx:44-48`

`mutate` 호출 직후 `toast.success('일정을 추가했어요')`를 띄운다. 요청이 실패하면 `onError`가 낙관적 갱신만 조용히 롤백 → 화면에서 일정이 슥 사라지는데 사용자는 성공 토스트를 본 뒤다.

**고치는 법:** 각 훅의 `onError`에 `toast.error('저장하지 못했어요')` 한 줄씩.

---

## 🟠 버그

### 6. 시작할 때 구글 토큰 갱신이 10번 넘게 동시에 나간다

`shared/hooks/useLogin.tsx:44-45`

`useLogin()`이 `useEvents`/`useHolidayEvents`/`LoginButton`/`ScheduleModal`에서 호출되고, `useCalendarItems`가 `CalendarGrid`·`MiniCalendarGrid`·`Footer`·`ScheduleModal`·`useEventNotifications` 5곳에서 쓰인다 → 인스턴스 10개 이상. 각각이 마운트 시 `refreshToken()`을 호출한다.

부작용 둘:

- 앱 시작마다 `oauth2.googleapis.com/token`에 동시 요청 10여 개
- `isAuthenticated`가 **인스턴스별 지역 상태**라 로그아웃해도 캘린더 쪽은 계속 `true`로 남아 일정이 그대로 보인다

**고치는 법:** `useLogin`을 Context(또는 작은 모듈 스토어)로 올려 앱 전체에서 하나만 돌게 한다.

### 7. 자정이 지나도 "오늘 일정"이 어제 것으로 남는다

`widgets/Footer/ui/Footer.tsx:23-30`

`todayEvent` memo가 `dayjs()`를 안에서 부르는데 deps는 `[items]`뿐. 자정 타이머로 `tomorrow`가 바뀌어도 재계산되지 않는다.

**고치는 법:** deps에 `tomorrow` 추가.

### 8. 여러 날짜에 걸친 일정이 푸터에 안 보인다

`widgets/Footer/ui/Footer.tsx:25-28`

`start`가 오늘인 것만 필터해서, 어제 시작해 내일 끝나는 일정은 "오늘 일정"에 없다.
`ScheduleModal`은 같은 판정을 `getEventRange`로 제대로 하고 있다 — 여기서도 그걸 쓰면 된다.

### 9. 푸터 스크롤 인덱스가 목록이 줄어도 안 돌아온다

`entities/event/ui/FooterEvent.tsx:14-19`

색상 필터를 걸거나 일정이 줄면 `visibleStartIndex`가 범위를 넘어 **아무것도 안 보이는데 위/아래 버튼도 비활성**이 된다.

**고치는 법:** `const startIndex = Math.min(visibleStartIndex, Math.max(0, items.length - showCount))` 로 클램프해서 쓴다.

### 10. 시간 슬라이더 드래그가 튀고, 포커스를 잃으면 안 놓아진다

`features/event/ui/components/LinearSlider.tsx:65-85`

- `move` 리스너가 pointerdown 시점의 `start`/`end`를 클로저로 잡는다. `PREFERRED_GAP` 보정으로 `end`가 밀리면 다음 move가 낡은 `end`를 다시 넣어 종료 썸이 왔다 갔다 한다.
- `pointercancel`/`blur` 정리가 없다. `disable-click`으로 pointerup이 유실되면 썸이 마우스를 계속 따라다닌다 (CLAUDE.md 제약 4번). `useEventDrag`는 이미 blur를 처리하고 있으니 같은 패턴 복사.

### 11. 401이 나면 토큰 재발급이 동시에 여러 번 나간다

`shared/lib/http.ts:33-47`

토큰 만료 시점에 진행 중이던 요청 수만큼 `refreshToken()`이 병렬 호출된다.

**고치는 법:** 모듈 스코프에 `let refreshing: Promise | null` 하나 두고 공유.

### 12. 다른 날짜를 열어도 "오늘은 일정이 없어요"

`widgets/Calendar/ui/ScheduleModal.tsx:52` — 문구 고정. 날짜에 맞춰 바꾸거나 "일정이 없어요"로.

### 13. 모달 로그인 버튼에 `tabIndex={-1}`이 없다

`widgets/Calendar/ui/ScheduleModal.tsx:40`

벽지 창에서 클릭 가능한 `<button>`엔 `tabIndex={-1}`이 필요하다(첫 클릭이 포커스만 먹는 문제). 같은 누락: `PatchNoteModal.tsx:37,52`, `UpdateNotification`의 두 버튼, `range-picker.tsx:51,70,73,121`, `sonner.tsx:24`, `EventForm.tsx`의 반복/색상/제출 버튼들.
모달 안에서는 창이 이미 포커스된 상태라 대개 괜찮으니, **모달 밖 버튼부터** 확인.

### 14. PostHog 집계가 어긋난다

- 알림 설정 이벤트가 **두 번** 기록된다: `features/event-notification/model/notificationSettingsContext.tsx:35,45`(렌더러)와 `main/ipcHandler.ts:69,76`(메인)에서 같은 이벤트명을 각각 capture.
- 메인은 `store`의 `posthog-device-id`, 렌더러는 posthog-js 익명 id를 쓴다 → **한 사용자가 두 사람으로 잡힌다.** 렌더러에서 device id로 `posthog.identify()` 필요.

### 15. 자정에 끝나는 시간 일정이 하루 더 걸쳐 보인다

`entities/event/lib/eventLayout.ts:14-18` — `end.dateTime`의 날짜 부분만 쓰므로 `22:00~24:00` 일정이 이틀짜리로 렌더된다. 종료가 정확히 `00:00`이면 하루 빼면 된다.

---

## 🟡 성능

### 16. Tooltip마다 전역 pointermove 리스너 + 레이아웃 측정

`shared/ui/tooltip.tsx:54-80` — 인스턴스마다 `window.pointermove`에 붙어 매 이벤트 `getBoundingClientRect()`를 호출한다. 헤더에만 5~6개, 모달을 열면 일정 수만큼 늘어난다.
**고치는 법:** 리스너 하나를 공유하는 작은 디스패처(또는 `elementFromPoint` 한 번)로 통합.

### 17. 미니뷰가 꺼져 있어도 셀 42개의 rect를 매번 잰다

`widgets/Calendar/ui/MiniCalendarGrid.tsx:36-56` — 컴포넌트가 항상 마운트되고 CSS로만 숨겨져 있어서, 일반 뷰에서도 마우스를 움직일 때마다 42회 `getBoundingClientRect()`가 돈다.
**고치는 법:** `onMove` 첫 줄에서 컨테이너가 안 보이면 즉시 return, 또는 미니뷰일 때만 마운트.

### 18. 새로고침이 앱 전체 리로드

`features/refresh/ui/RefreshButton.tsx:7` — `window.location.reload()`라 모든 상태가 날아가고 6번의 토큰 갱신 폭주가 다시 일어난다.
**고치는 법:** `queryClient.invalidateQueries({ queryKey: eventKeys.events })`.

---

## 🔵 보안 / 하드닝

### 19. 렌더러에 범용 `ipcRenderer`가 그대로 노출돼 있다

`preload/index.ts:94` — `contextBridge.exposeInMainWorld('electron', electronAPI)`가 임의 채널 `send/invoke`를 열어준다. **렌더러 어디에서도 안 쓴다**(확인 완료).
**고치는 법:** 그 줄과 `global.d.ts`의 `electron: ElectronAPI` 삭제. 코드도 줄고 표면도 줄어든다.

### 20. OAuth 콜백에 `state` 검증도, 경로 검증도 없다

`main/oauth.ts:34-47,155-163` — 로컬 서버가 **어떤 경로로든** `?code=` 만 오면 받아들이고, `state` 파라미터가 없다. 로컬에서 도는 다른 프로세스가 공격자 코드를 밀어 넣어 엉뚱한 계정으로 로그인시킬 수 있다.
**고치는 법:** `crypto.randomBytes`로 state 생성 → authUrl에 추가 → 콜백에서 대조, 그리고 `url.pathname === '/callback'` 확인.

### 21. `open-external`에 URL 검증이 없다

`main/ipcHandler.ts:10` — `shell.openExternal(url)`에 아무 문자열이나 들어간다. 지금 호출부는 `SITE_URL` 뿐이니 `https://`만 통과시키는 가드 한 줄이면 끝.

### 22. 로그아웃해도 구글 쪽 토큰이 살아 있다

`main/oauth.ts:140-144` — keytar만 지운다. `https://oauth2.googleapis.com/revoke` 호출을 추가하면 2번 항목(재로그인 시 refresh_token 미발급)도 같이 해소된다.

### 23. `VITE_CLIENT_SECRET`이 메인 번들과 소스맵에 인라인된다

`electron.vite.config.ts:14,26-27` — 설치형 앱의 client secret은 구글 기준 "비밀이 아님"이라 치명적이진 않지만, `sourcemap: true` + Sentry 업로드로 더 널리 퍼진다. 프로덕션 메인 소스맵이 정말 필요한지 한 번 판단할 것.

---

## ⚪ 죽은 코드 · 정리

| 위치                                                             | 내용                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/ui/command.tsx`, `shared/ui/textarea.tsx` (+ 각 stories) | 프로덕션 코드에서 **전혀 안 쓴다.** 지우면 `cmdk` 의존성도 같이 제거 가능                                                                                                                  |
| `package.json` devDeps                                           | `jest`(^30) — vitest를 쓰고 있고 `@testing-library/jest-dom`만 필요하다. `@react-oauth/google` — 어디서도 import 안 함. 둘 다 삭제                                                         |
| `main/ipcHandler.ts:84-88`                                       | `renderer-ready` 핸들러가 죽어 있다(preload에 노출도, 호출도 없음). 게다가 `title === 'Program Manager'`로 Explorer를 판별해서 `activeWindow.ts:17`의 `owner.path` 방식과 이중화 — 지울 것 |
| `main/posthog.ts:29-37`                                          | `setUserDistinctId`/`getUserDistinctId`/`appVersion` 전부 미사용                                                                                                                           |
| `preload/index.ts:76`                                            | `ipcRenderer.removeListener(listener)`를 등록 **전에** 호출 — 방금 만든 함수라 항상 no-op                                                                                                  |
| `electron.vite.config.ts:50`                                     | `connect-src`의 `https://discord.com` 미사용 (문의하기는 외부 브라우저로 연다)                                                                                                             |
| `pages/Calender/`                                                | 폴더명 오타 (Calender → Calendar)                                                                                                                                                          |
| `components.json:6`                                              | tailwind css 경로가 `src/renderer/src/index.css`인데 실제는 `src/renderer/app/index.css` — `shadcn add`가 엉뚱한 데를 본다                                                                 |
| `CalendarGrid.tsx:100,105`                                       | `${cond && 'class'}` 패턴이 false일 때 `"false"`를 클래스로 넣는다. `cond ? 'class' : ''`로                                                                                                |

---

## 🧪 품질 · 인프라

### 24. `npm run lint`가 지금 실패한다 (21건)

`setupTests.ts`(9), `FlipCalendarButton.test.tsx`(11), `MoveDialog.tsx`(1). 대부분 들여쓰기라 `--fix`로 끝난다. `vitest.config.ts`도 4-space라 prettier 설정(2-space)과 어긋남.
CI에 lint가 없다(워크플로는 chromatic, notion-to-github 둘뿐) — 그래서 깨진 채 머지됐다.

### 25. `noImplicitAny`가 꺼져 있다

`@electron-toolkit/tsconfig`가 `noImplicitAny: false`. 그래서 `preload/index.ts`의 콜백들, `useLogin.tsx:18`의 `receivedTokens`, `EventType.ts:95`의 `preferences: { (key): string }`(인덱스 시그니처가 아니라 **호출 시그니처** 오타 — `Record<string, string>`이어야 함)가 다 통과한다.

### 26. `Events` 타입의 모든 필드가 필수로 선언돼 있다

`shared/types/EventType.ts:1-169` — 구글은 `description`/`location`/`attendees` 등을 대부분 응답에서 **생략**한다. 타입은 `string`인데 런타임은 `undefined` → 나중에 그 필드를 쓰는 순간 터진다. 실제 쓰는 필드만 남기고 나머지는 optional로.

또 `entities/event/types/index.tsx:9`의 `recurrence?: string | null`은 `RecurrenceType`이어야 한다. 지금은 아무 문자열이나 들어가면 `RRULE_MAP[...]`이 `undefined`가 되어 `recurrence: [undefined]`가 전송된다.

### 30. 문서와 코드가 어긋난다

- CLAUDE.md 제약 2번은 "연속 드래그(pointermove) 신뢰 불가"인데, 실제로는 `useEventDrag`(일정 이동)와 `LinearSlider`(시간 조절)가 pointermove 드래그로 구현돼 있다. 실기에서 되는 거면 제약 문구를 갱신하고, 아니면 코드를 바꿔야 한다 — 지금은 어느 쪽인지 알 수 없다.
- CLAUDE.md 제약 1번이 가리키는 `WeekCalendar/lib/useHourScroll.ts`는 **존재하지 않는다**(주간 뷰가 사라짐).
- `entities/patchNote/ui/PatchNoteModal.tsx:8`의 버전이 하드코딩이라 릴리스마다 수동 갱신해야 하고, 버전을 건너뛴 사용자는 중간 패치노트를 못 본다.
- `.env.example`이 없어서 새로 클론하면 `VITE_CLIENT_ID` 등을 알 방법이 없다. README에도 설명 없음.

---

## 먼저 손대면 좋은 순서

1. **1번 (PUT → PATCH)** — 유일하게 사용자 데이터가 실제로 없어지는 항목, 고치는 건 한 단어
2. **2번 (`prompt=consent`)** — 한 줄, 로그인 불능 상태를 막는다
3. **4번 (자동 실행)** + **5번 (실패 토스트)** — 작고 체감 큼
4. **3번 (알림 주기 재예약)** — 기능이 조용히 안 도는 문제
5. **6번 (useLogin 단일화)** — 리팩터링이 좀 있지만 7·11·18번의 뿌리
6. 죽은 코드/의존성 정리 + lint 통과 — 기계적 작업, PR 하나로
