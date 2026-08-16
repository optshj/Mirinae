# 데스크톱 알림 기능

일정 시작 10분 전에 OS 데스크톱 알림(Windows 토스트 / macOS 알림센터)을 띄우는 기능. 헤더 설정 메뉴에서 켜고 끌 수 있다.

## 아키텍처

```
renderer (이벤트 감시·판단)  →  IPC  →  main (실제 알림 발송)
```

이벤트 데이터(Google Calendar)는 renderer에만 있고, OS 알림 API(`Notification`)는 main 프로세스 전용이라 이렇게 나눴다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| `src/main/store.ts` | `notifications-enabled` 설정 키 추가 (기본값 `true`) |
| `src/main/ipcHandler.ts` | IPC 채널 3개 추가: `get/set-notifications-enabled`, `show-notification` (main에서 `Notification.isSupported()` 체크 후 실제 발송) |
| `src/preload/index.ts` | 위 3개를 `window.api`로 노출 |
| `src/renderer/features/event-notification/` (신규) | `useEventNotifications` 훅 + `NotificationSettingButton` 토글 UI |
| `src/renderer/app/App.tsx` | `useEventNotifications()`를 항상 마운트되는 `EventNotifications` 컴포넌트로 최상단에 부착 |
| `src/renderer/widgets/Header/ui/Header.tsx` | 설정 드롭다운에 `<NotificationSettingButton />` 추가 (다크모드 토글 옆) |

## 핵심 로직 (`useEventNotifications.ts`)

- `useCalendarItems()`로 얻은 이벤트 중 `category === 'time'`(시간 지정 일정)만 대상.
- 시작 10분 전 시각(`NOTIFICATION_LEAD_MINUTES = 10`)을 계산해 `setTimeout`으로 예약.
- **주의점**: Google Calendar API가 과거~미래 2년치 이벤트를 한 번에 가져오는데, `setTimeout`은 delay가 약 24.8일(2^31-1ms)을 넘으면 32비트 오버플로로 즉시 실행돼버리는 Node/Chromium 버그가 있다. 그래서 알림 시각이 **1시간 이내**로 다가온 이벤트만 타이머를 걸고, 나머지는 10분 폴링 때마다 재평가하도록 함.
- 이미 알림을 보낸 이벤트 id는 `useRef<Set<string>>`로 추적해 중복 발송 방지.

## UI

`HolidayButton` 등 설정 드롭다운의 다른 토글 항목과 동일하게 공용 `shared/ui/switch.tsx`의 `Switch` 컴포넌트(`role="switch"`) 재사용. 이전에는 `Bell`/`BellOff` 아이콘이 슬라이드하는 전용 알약형 토글을 별도로 구현했으나, 일반 토글 버튼으로 교체함.

## 검증

- `npm run typecheck` 통과 확인.
- `npm run lint` 결과는 별도 확인 필요.
