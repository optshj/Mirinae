# 리팩토링 계획

src 전체(약 6,200줄)를 훑고 정리한 리팩토링 후보. 파일 하나가 비대한 곳은 거의 없고, 복잡도는 **같은 개념이 여러 군데에서 각자 구현돼 있는 것**에서 나온다. 대개편 4개(A~D)가 뼈대이고, 나머지 중복 제거는 대부분 그 안에 흡수된다.

---

## 0. 먼저 깔 안전망

대개편 전에 회귀를 잡을 테스트가 없다. 지금 테스트는 `DarkModeButton.test.tsx`, `FlipCalendarButton.test.tsx` 두 개뿐.

- `entities/event/lib/eventLayout.ts` — 가장 복잡한 순수 함수(`getEventRange`, `buildMonthSegments`, `buildHolidayDates`)인데 테스트가 없다. B 작업이 이 파일을 건드리므로 먼저 테스트 한 파일을 둔다.
- `entities/event/lib/createEventBody.ts` — 종일 일정 end.date exclusive 처리, 시간 파싱. 같은 이유.

---

## A. 환경설정 저장소 단일화 (렌더러) — ✅ 완료

`shared/lib/preferences.ts`(`usePreference`/`getPreference`/`setPreference`/`applyPreferencesToHtml`)로 옮김. 기존 localStorage 키·저장 형식은 그대로 유지(`preferences.test.ts`가 검증). 아래는 작업 전 진단 기록.

### 현재 상태

설정 하나("미니뷰 켜짐" 등)가 세 군데에 흩어져 있다.

| 설정 | 초기 적용 | 변경 | 저장 위치 |
| --- | --- | --- | --- |
| theme | `app/main.tsx` | `DarkModeButton.tsx` (같은 판정 로직 복붙) | localStorage `'theme'` |
| flipFooter | `app/main.tsx` | `FlipFooterButton.tsx` | localStorage `'flipFooter'` |
| miniView | `app/main.tsx` | `MiniViewButton.tsx` | localStorage `'miniView'` |
| bgOpacity | `app/main.tsx` | `OpacityButton.tsx` | localStorage `'bgOpacity'` |
| paletteSet | `app/main.tsx` | `PaletteSetButton.tsx` | localStorage (상수 키) |
| holiday / colorFilter / maxLanes / calendarVisibility | 각 Context | 각 Context | localStorage, Context 4개가 같은 "읽기 → state → effect 저장" 반복 |
| colorLabels | `useColorLabels` | 〃 | localStorage, `useSyncExternalStore` 모듈 스토어 (위와 다른 방식) |
| footer 중요 색상 | `Footer.tsx` | `PalletteDropdown.tsx` | localStorage |
| 알림 on/off, 선행 시간 | `NotificationSettingsProvider` | 〃 | **electron-store** (IPC 경유) |

문제:
- 키 문자열이 파일마다 하드코딩 → 키 하나 바꾸면 2곳 이상 수정.
- 같은 문제를 Context 방식과 모듈 스토어 방식 두 가지로 풂.
- `<html>` 클래스(`mini-view`, `flip-footer`, `dark`, `palette-*`)를 상태 버스로 씀. `move-context.tsx`는 미니뷰 여부를 `classList.contains('mini-view')`로 DOM에서 읽는다. 상태의 원본이 DOM.
- Provider 중첩 6단(`app/provider/index.tsx`) 중 4개가 이 설정 Context.
- 이 설정들(holiday, maxLanes, colorFilter, visibility)은 이벤트 도메인이 아니라 UI 환경설정인데 `entities/event/context/`에 들어가 있다.

### 개편안

`useColorLabels`가 이미 쓰는 패턴(모듈 스토어 + `useSyncExternalStore`)을 일반화한다.

```ts
// shared/lib/preferences.ts
const PREFS = {
  theme: { key: 'theme', default: systemTheme(), html: (v) => toggle('dark', v === 'dark') },
  miniView: { key: 'miniView', default: false, html: (v) => toggle('mini-view', v) },
  // ...
};
export function usePreference<K extends keyof typeof PREFS>(name: K): [value, set]
export function applyPreferencesToHtml(): void // main.tsx에서 1회 호출
```

- 키·기본값·`<html>` 부수효과를 **한 표**에 선언. `main.tsx` 초기화와 각 버튼이 같은 정의를 씀.
- Context 4개 + `useColorLabels` + 각 버튼의 ad-hoc 로직 제거. Provider 트리는 Query/Login/Notification만 남는다.
- `<html>` 클래스는 "결과물"로만 남고 읽기는 `usePreference`로 (`move-context.tsx`의 classList 읽기 제거).
- 알림 설정(electron-store)은 main 프로세스도 읽어야 하므로 별개로 둔다. 단, 왜 저장소가 다른지 표 옆에 한 줄 주석.

예상 효과: 파일 약 6개 삭제, 설정 추가 시 수정 지점 1곳.

---

## B. 이벤트 뷰모델 정규화

### 현재 상태

`CalendarEvent`에서 같은 파생값을 여러 곳에서 각자 계산한다.

| 파생값 | 계산하는 곳 |
| --- | --- |
| 시작 시각 문자열 `category === 'time' ? start.dateTime : start.date` | `useCalendarItems` 정렬, `Footer.tsx` ×2, `FooterEvent.tsx` |
| 날짜 범위 `[startKey, endKey]` | `getEventRange` — `ScheduleModal`, `MiniCalendarGrid`, `useEventDrag` ×3, `EditEventForm` ×2에서 매번 재계산 |
| 완료 여부 `extendedProperties?.private?.completed === 'true'` | `EventList.tsx`, `EditEventForm.tsx`, `CompleteEventButton.tsx` |
| 이벤트 → 폼 상태 (`HH:mm` 또는 `'08:00'`/`'12:00'` 기본값) | `EditEventForm.tsx`, `useEventDrag.tsx` `commitMove` — 동일 코드 |
| 날짜 범위 delta 이동 | `useEventDrag.tsx`의 `previewRange`, `commitMove` — 동일 코드 |
| 시간 표시 포맷 | `EventList.formatDateTime`, `EditEventForm.renderTimeRange`, `FooterEvent.formatKorean` — 3벌 |
| `dayjs(x).format('YYYY-MM-DD')` | 21곳 |

- `shared/types/EventType.ts`(186줄)는 Google API 응답 필드를 전부 옮겨 적었지만 실제로 쓰는 건 10개 남짓. `recurrence: [string]`, `attendees: [{...}]`처럼 길이 1 튜플로 잘못 선언된 것도 있다.
- `EventBodyProp.recurrence`는 `string | null`, `FormState.recurrence`는 `RecurrenceType` — 같은 값의 타입이 다르다. `createEventBody`의 `RRULE_MAP[recurrence]` 인덱싱이 타입상 안전하지 않음.

### 개편안

`useCalendarItems`가 이미 모든 이벤트를 한 번 정규화(time/allDay 분기)하고 있다. 거기서 파생값까지 붙인다.

```ts
interface CalendarItem extends CalendarEvent {
  startKey: string;   // YYYY-MM-DD
  endKey: string;     // inclusive
  sortKey: string;    // dateTime 또는 date
  completed: boolean;
}
```

- `getEventRange` 호출, 완료 판정, 정렬 키 계산이 각 소비처에서 사라진다.
- `eventToForm(event): FormState`, `shiftRange(item, days)`, `toDateKey(date)` 를 `entities/event/lib`에 하나씩.
- 시간 포맷 3벌은 용도가 달라(영문 짧은/한글 범위/한글 날짜) 합치지 말고 `entities/event/lib/format.ts` 한 파일로 모으기만.
- `EventType.ts`는 쓰는 필드만 남김. `RecurrenceType`은 entities로 내려 `EventBodyProp`과 `FormState`가 공유.

---

## C. 메인 프로세스 정리

### C-1. 부착/분리 + 좌표 변환 + 저장이 3곳에 복붙

```ts
// ipcHandler.ts start-dragging, tray.ts menu-will-show
detachWallpaper(mainWindow);
mainWindow.setBounds(toScreenBounds(mainWindow.getBounds()));

// ipcHandler.ts stop-dragging, tray.ts menu-will-close
const bounds = mainWindow.getBounds();
attachWallpaper(mainWindow);
mainWindow.setBounds(toWallpaperBounds(bounds));
store.set('window-bounds', bounds);
```

`wallpaper.ts`가 attach/detach만 감싸고, 좌표계 전환은 호출자 책임이라 짝이 어긋날 여지가 있다(제약 9번과 같은 종류의 위험). `wallpaper.ts`에 `detachForEdit(win)` / `reattach(win)`으로 묶어 부착 상태와 좌표계를 한 곳에서 관리한다. `tray.ts`의 "위치 초기화"도 `toWallpaperBounds`+`store.set`을 따로 하므로 같은 헬퍼로.

### C-2. 순환 import

- `ipcHandler.ts`, `tray.ts` → `import { mainWindow } from '.'` (index.ts ↔ 각 모듈 순환)
- `bundleUpdate.ts` → `ipcHandler.ts`(`isTrustedSender`) → `bundleUpdate.ts`(`RENDERER_URL_PREFIX`) 순환

`mainWindow`는 `initTray(win)`, `registerIPCHandlers(win)`처럼 인자로 넘기고, `isTrustedSender`는 `bundleUpdate`나 별도 `security.ts`로 옮긴다.

### C-3. IPC 계약이 문자열로만 묶여 있음

채널 이름이 `ipcHandler.ts`, `preload/index.ts`, `bundleUpdate.ts`, `activeWindow.ts`, `oauth.ts`(`auth-expired`)에 문자열로 흩어져 있다. 이름 하나 오타 나면 조용히 안 됨. 그리고 `isTrustedSender` 검사가 `open-external`, `google-request`에만 있고 `set-notifications-*`, `show-notification`, `quit-app` 등에는 없다 — 기준이 일관되지 않음.

- 채널 이름 상수 + 페이로드 타입을 `src/shared/ipc.ts`(main/preload 공용) 한 파일로.
- `ipcMain.on/handle`을 감싸 **모든** 핸들러에 `isTrustedSender`를 기본 적용.

### C-4. 작은 것

- `store.ts`: `new (Store as any).default(...)` — 스키마 타입이 없어 `store.get('window-bounds')`가 `any`. 제네릭으로 타입 지정.
- `oauth.ts`: `fetchAccessTokens`/`refreshAccessToken`이 같은 토큰 POST를 반복 → `postToken(params)` 하나로. `SERVICE_NAME = 'Mirinae'`가 `index.ts`와 `oauth.ts`에 중복.
- `index.ts`: Sentry DSN, AutoLaunch가 모듈 최상단에서 바로 실행 — `whenReady` 안 초기화 블록으로 모으면 진입점 흐름이 한눈에 보인다.

---

## D. 플랫폼 어댑터 (macOS 대비)

macOS 지원이 확정 목표라서 추측성 추상화가 아니다. Windows 전용 지점이 지금 여러 파일에 흩어져 있다.

- `wallpaper.ts` — `electron-as-wallpaper`
- `wallpaperBounds.ts` — WorkerW 상대 좌표
- `activeWindow.ts` — `C:\Windows\explorer.exe` 하드코딩
- `keyInput.ts` — 이중 keydown dedupe (Windows 부착 방식의 부작용)

```ts
// main/desktop/index.ts
interface DesktopHost {
  attach(win): void;
  detach(win): void;
  toScreenBounds(b): Rectangle;
  toHostBounds(b): Rectangle;
  isDesktopFocused(): Promise<boolean>;
}
export const desktop: DesktopHost = process.platform === 'win32' ? windowsHost : macHost;
```

C-1을 먼저 하면 호출부가 `detachForEdit/reattach`로 이미 좁혀져 있어 이 단계는 구현 교체만 남는다. 지금 시점엔 `windowsHost` 하나만 두고 `macHost`는 mac 작업 때 추가.

---

## E. 렌더러 중복 제거 (A·B와 별개로 바로 할 수 있는 것)

### E-1. 낙관적 업데이트 보일러플레이트 ×5

`entities/event/hooks/use{Add,Edit,Delete,Complete,Restore}Event.tsx` 모두
`cancelQueries → getQueryData → setQueryData → onError 롤백 → onSettled invalidate`를 반복한다. 다른 건 items 변환 한 줄.

- 이미 어긋남: `useEditEvent`, `useAddEvent`는 `{ items }`만 넣어 `...previousData`를 빠뜨리고 나머지 셋은 넣는다.
- `useAddEvent`의 `if (!unit)` 분기는 타입상 도달 불가.

```ts
function useOptimisticEventMutation<V>(mutationFn: (v: V) => Promise<unknown>, update: (items: CalendarEvent[], v: V) => CalendarEvent[])
```

각 훅이 5~10줄로 준다.

### E-2. 포인터 hover 판정 ×3

`CalendarGrid.tsx:23-43`과 `MiniCalendarGrid.tsx:36-57`이 글자 하나 안 다르게 같다. `tooltip.tsx:54-80`도 rect 판정이 같다.
→ `shared/hooks/useHoveredKey()` (`{ hoveredKey, registerRef }`). tooltip은 지연 타이머가 있어 `isPointInRect(rect, e)`만 공유.

### E-3. 이벤트 폼

- `AddEventForm`/`EditEventForm`: `updateForm`, 제목 검증 토스트가 동일 → `useEventForm(initial, submit)`.
- `단축키 <Kbd>…</Kbd>` 툴팁 마크업이 `EventForm.tsx` ×2, `AddEventForm.tsx` ×1 → `<ShortcutHint keys="Ctrl + Enter" />`.
- `EventForm`이 `document.getElementById('edit-event-form')`로 다른 폼 존재를 확인 — DOM을 통한 숨은 결합. `show-event-form` html 클래스로 다른 UI를 숨기는 것도 같은 종류. "지금 열린 폼" 상태를 `ScheduleModal`이 들고 내려주는 게 정상 흐름.
- `useEffect` 의존성의 `formId`는 쓰이지 않음.

### E-4. 요일 헤더 ×3

`CalendarGrid`, `MiniCalendarGrid`, `shared/ui/range-picker.tsx` → `shared/ui/WeekdayHeader`.

### E-5. 슬라이스 경계

- `features/event`가 잡동사니: 일정 폼/완료/삭제 + 캘린더 목록, 색상 필터, 줄 수, 팔레트, footer 색상 드롭다운. A를 하면 설정 버튼들은 `features/calendar-settings`로 분리.
- 오타 `Pallette`/`PALLETTE` (`PalletteDropdown.tsx`, `COLORPALLETTE`, `event-color-pallete.css`) — 파일 옮길 때 같이 정정.
- `entities/event/index.tsx`의 `export * from './lib/eventLayout'` — 공개 API를 명시적으로.

---

## F. 버그 의심 (리팩토링 중 확인)

- `Footer.tsx` "오늘 일정": `start`가 오늘인 것만 걸러서 **어제 시작해 오늘까지 이어지는 일정이 빠진다.** "다가오는 일정"도 시작일 기준이라 진행 중 일정은 어디에도 안 뜬다. B의 `startKey/endKey`로 범위 판정하면 자연스럽게 고쳐짐.
- `useEditEvent` 낙관적 업데이트가 `{ items }`만 세팅해 캐시의 다른 필드를 날린다 (E-1).

---

## G. 프로젝트 문서 불일치

`.claude/projects/mirinae.md`의 다음 내용은 현재 코드와 다르다.

- "zustand가 package.json에 있지만 레거시" → package.json에 없음.
- "`features/search`는 빈 디렉토리" → 디렉토리 없음.
- "`shared/ui/textarea.tsx`에 수동 `onWheel`" → 파일·핸들러 없음.

---

## 권장 순서

1. **0 (테스트)** — eventLayout, createEventBody.
2. **E-1, E-2** — 동작 변화 없는 순수 중복 제거. 위험 최소.
3. **B** — 뷰모델 정규화. F의 Footer 버그를 같이 처리.
4. **A** — 설정 저장소 단일화 + `features/calendar-settings` 분리(E-5).
5. **C-1 → C-2 → C-3** — 메인 프로세스. C-1은 실기 검증(부착/분리, 트레이 메뉴, 이동 모드) 필수.
6. **D** — mac 작업 착수 시점에.
7. E-3, E-4, C-4는 해당 파일을 건드릴 때 같이.
