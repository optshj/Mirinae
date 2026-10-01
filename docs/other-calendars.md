# 다른 캘린더 (구독·공유 캘린더, 공휴일)

기본 캘린더(`primary`) 말고도 Google 캘린더의 "다른 캘린더"(URL로 추가한 ICS 구독 캘린더, 다른 사람이 공유한 캘린더)와 대한민국 공휴일을 달력에 함께 보여준다. 캘린더마다 표시 여부와 색을 설정 > 캘린더 > **다른 캘린더**에서 고른다.

## 데이터 흐름

```
calendarList ──▶ useOtherCalendars ──▶ OtherCalendarButton (설정 UI)
                   │  (+ 설정 병합,          │
                   │    공휴일 고정 항목)     └▶ useCalendarSettings.update
                   ▼
             useOtherEvents ── 켜진 캘린더마다 events 조회
                   ▼
             useCalendarItems ── primary·공휴일·다른 캘린더 일정을 한 목록으로 합침
```

### API — `entities/event/api/index.ts`

- `getEvents(calendarId = 'primary')` — 캘린더 하나의 일정. `primary`와 다른 캘린더가 같은 함수를 쓴다.
- `getCalendarList()` — `users/me/calendarList`. 응답에서 `id`, `summary`, `summaryOverride`, `colorId`, `selected`, `primary`만 쓴다 (`GoogleCalendar` 타입, `entities/event/types`).
- `getHolidays()` — `HOLIDAY_CALENDAR_ID` 캘린더의 일정.
- 요청은 메인 프로세스(`src/main/oauth.ts`)를 거치고, 거기서 `https://www.googleapis.com/calendar/v3/`로 시작하는 주소만 허용한다. OAuth 스코프 `calendar.readonly`로 `calendarList`를 읽을 수 있어서 추가 동의가 필요 없다.

### Query 키 — `entities/event/api/queries.ts`

| 키 | 내용 | 주기 |
| --- | --- | --- |
| `['googleCalendarEvents']` | primary 일정 | 10분 |
| `['googleCalendarOtherEvents', calendarId]` | 다른 캘린더 일정 (캘린더별) | 10분 |
| `['googleCalendarList']` | 캘린더 목록 | staleTime 10분 |
| `['googleCalendarHolidays']` | 공휴일 | — |

다른 캘린더 키는 prefix가 `googleCalendarEvents`와 달라서, primary mutation의 `invalidateQueries(eventKeys.events)`가 다른 캘린더 쿼리까지 다시 부르지 않는다. 헤더 새로고침 버튼은 `refetchQueries({ type: 'active' })`라 켜진 다른 캘린더도 함께 다시 불러온다.

### 목록 만들기 — `useOtherCalendars` (`entities/event/hooks/useEvent.tsx`)

반환: `{ id, summary, enabled, colorId }[]`

1. 맨 앞에 공휴일 항목(`HOLIDAY_CALENDAR_ID`, "대한민국 공휴일")을 고정으로 둔다. Google에서 공휴일 캘린더를 구독하지 않은 사용자도 있어서 `calendarList`에 기대지 않는다.
2. `calendarList`에서 `primary`와 `#holiday@group.v.calendar.google.com`이 들어간 캘린더(Google 공휴일 캘린더)는 뺀다. 공휴일은 1번 항목 하나로만 다룬다.
3. 이름은 `summaryOverride`(사용자가 Google에서 바꾼 이름)가 있으면 그걸 쓰고, 없으면 `summary`를 쓴다.
4. 저장된 설정이 없을 때의 기본값:
   - `enabled` — Google 캘린더에서 체크돼 있는지(`selected`)
   - `colorId` — 캘린더 `colorId`(1~24)를 이벤트 팔레트 11색에 접은 값 `COLORPALLETTE[(colorId - 1) % 11]`. 캘린더마다 고정된 색이 나온다.

### 일정 가져오기 — `useOtherEvents`

켜진 캘린더(공휴일 제외)만 `useQueries`로 조회하고 `{ colorId, items }[]`로 돌려준다. 공휴일은 별도 쿼리(`useHolidayEvents`)를 쓴다. `combine`을 `useCallback`으로 고정해서, 결과가 그대로면 같은 배열이 나오고 `useCalendarItems`의 `useMemo`가 다시 돌지 않는다.

### 합치기 — `useCalendarItems`

- 다른 캘린더 일정은 primary 일정과 같은 `time`/`allDay` 변환을 거치고, `colorId`를 **캘린더 색으로 덮어쓰고** `readOnly: true`를 붙인다.
- 초대받은 일정은 primary와 다른 캘린더에 같은 `id`로 둘 다 올 수 있어서, primary에 있는 `id`는 다른 캘린더 쪽에서 뺀다.
- 공휴일은 `category: 'holiday'`, `colorId: holidayColorId`, `readOnly: true`로 만든다. `showHoliday`가 꺼져 있으면 빈 배열이다.
- 색상 필터와 정렬은 모든 일정에 똑같이 적용된다. 일정 알림(`useEventNotifications`)도 이 목록을 쓰므로 다른 캘린더 일정도 알림 대상이다.

## 설정 저장 — `entities/event/hooks/useCalendarSettings.tsx`

- localStorage `calendar-settings`(`CALENDAR_SETTINGS_STORAGE_KEY`)에 `Record<calendarId, { enabled?, colorId? }>`로 저장한다. 값이 없는 필드는 위 기본값을 쓴다.
- `useColorLabels`와 같은 모듈 스토어(`useSyncExternalStore`) 패턴이라 Provider가 없다. `update(calendarId, patch)`를 부르면 저장하고 구독자에게 알린다.
- `useHoliday()` — 공휴일 설정만 꺼내는 훅. `{ showHoliday, holidayColorId }`
  - `showHoliday`: `calendar-settings`의 공휴일 `enabled`. 없으면 localStorage `holiday` 값을 보고 `'false'`가 아니면 켠다.
  - `holidayColorId`: 없으면 `'10'`.
  - `CalendarGrid`는 이 `showHoliday`로 날짜 숫자를 빨갛게 칠할지 정한다 (`buildHolidayDates`). 색상 필터와는 무관하다.

## 읽기 전용 — `readOnly`

`Events.readOnly`(`shared/types/EventType.ts`)는 Google API에 없는 앱 전용 필드다. 수정·삭제·완료·드래그 API가 모두 `calendars/primary/events/{id}`로 요청하기 때문에, primary가 아닌 일정(공휴일·다른 캘린더)은 전부 `readOnly: true`이고 아래에서 막힌다.

| 위치 | 동작 |
| --- | --- |
| `entities/event/ui/EventList.tsx` | 드래그 커서·`onPointerDown` 연결 안 함 |
| `features/event-drag/hooks/useEventDrag.tsx` | `startDrag`, `commitMove`에서 바로 return |
| `features/event/ui/EditEventForm.tsx` | 클릭해도 수정 폼이 안 열림(`stopPropagation`), 완료·삭제 버튼 숨김 |

공휴일을 같은 날 맨 위에 두는 정렬(`eventLayout.ts`)은 `readOnly`가 아니라 `category === 'holiday'`로 판단한다.

## 설정 UI — `features/event/ui/OtherCalendarButton.tsx`

- 설정 > 캘린더 카테고리(`widgets/Header/ui/SettingsMegaMenu.tsx`)의 `DropdownMenuSub`. 로그인 안 했으면 렌더링하지 않는다.
- 캘린더마다 한 줄: `[색 점] 이름 [Switch]`. 색 점을 누르면 그 캘린더가 편집 대상이 되고 아래에 `ColorChips`가 뜬다 (다시 누르면 닫힘).
- 벽지 창 제약에 맞춰 버튼은 `tabIndex={-1}`, 색은 CSS 점(`event-color-N`)만 쓰고, 스크롤 영역 없이 목록 길이만큼 늘어난다. 제약 목록은 루트 `CLAUDE.md` 참고.

## 확인 방법

1. Google 캘린더 웹에서 **다른 캘린더 > URL로 추가**로 공개 ICS 캘린더를 하나 추가한다.
2. `npm run dev` → 설정 > 캘린더 > 다른 캘린더에 공휴일과 그 캘린더가 보이는지 확인한다.
3. 켜기/끄기와 색 변경이 달력에 바로 반영되고, 앱을 재시작해도 유지되는지 확인한다.
4. 다른 캘린더·공휴일 일정은 드래그가 안 되고, 클릭해도 수정 폼이 열리지 않는지 확인한다.

ICS 구독 캘린더는 Google이 주기적으로(보통 수 시간 간격) 원본을 가져오므로, 원본에서 바꾼 일정은 앱 새로고침과 무관하게 Google 반영 이후에 보인다.
