# 데스크톱 알림 기능

일정 시작 N분 전(5/10/15/30분 중 선택, 기본 10분)에 OS 데스크톱 알림(Windows 토스트 / macOS 알림센터)을 띄우는 기능. 헤더 설정 메뉴 → 일반 탭에서 켜고 끄고, 알림 시점도 조절할 수 있다.

## 아키텍처

```
renderer (이벤트 감시·판단)  →  IPC  →  main (실제 알림 발송)
```

이벤트 데이터(Google Calendar)는 renderer에만 있고, OS 알림 API(`Notification`)는 main 프로세스 전용이라 이렇게 나눴다. 설정값(켜짐 여부·알림 시점)은 `electron-store`로 main 프로세스에 영구 저장되고, renderer는 IPC로 읽고 쓴다.

## 관련 파일

| 파일 | 내용 |
|---|---|
| `src/main/store.ts` | `notifications-enabled`(기본 `true`), `notification-lead-minutes`(기본 `10`) 설정 키 |
| `src/main/ipcHandler.ts` | IPC 채널: `get/set-notifications-enabled`, `get/set-notification-lead-minutes`, `show-notification`(main에서 `Notification.isSupported()` 체크 후 실제 발송) — 각 `set-*`은 PostHog로도 변경 이벤트를 남긴다 |
| `src/preload/index.ts` | 위 채널들을 `window.api`로 노출 |
| `src/renderer/features/event-notification/model/notification-settings-context.tsx` | `NotificationSettingsProvider` + `useNotificationSettings()` — `enabled`/`leadMinutes` 상태와 IPC 호출을 여기 한 곳에 모음 |
| `src/renderer/features/event-notification/` | `useEventNotifications` 훅(알림 예약/발송 판단) + `NotificationSettingButton` UI(토글 + 알림 시점 스테퍼) |
| `src/renderer/app/provider/index.tsx` | `NotificationSettingsProvider`를 `MaxLanesProvider` 등과 같은 자리에서 앱 루트에 부착 — 부팅 시 딱 한 번만 IPC로 값을 읽어온다 |
| `src/renderer/app/App.tsx` | `useEventNotifications()`를 항상 마운트되는 `EventNotifications` 컴포넌트로 최상단에 부착 — 설정 드롭다운이 닫혀 있어도 예약은 계속 돈다 |
| `src/renderer/widgets/Header/ui/SettingsMegaMenu.tsx` | 설정 드롭다운 일반 탭에 `<NotificationSettingButton />` 배치 |

## 상태 관리 (`notification-settings-context.tsx`)

`notifications-enabled`/`notification-lead-minutes`는 `entities/event`의 `MaxLanesProvider`와 같은 패턴으로 `NotificationSettingsProvider`가 앱 루트(`app/provider/index.tsx`)에서 부팅 시 한 번만 IPC로 읽어와 Context로 전역 공유한다. `NotificationSettingButton`과 `useEventNotifications` 둘 다 이 Context를 구독한다.

원래는 `NotificationSettingButton`이 이 값을 로컬 `useState`로 직접 fetch했었다. 설정 드롭다운(`DropdownMenuContent`)은 닫힐 때 Radix가 내용을 언마운트하는데, 그 때문에 열 때마다 컴포넌트가 새로 마운트되면서 IPC 응답을 기다리는 동안 `useState` 기본값(켜짐)이 잠깐 보였다가 실제 값으로 바뀌는 깜빡임이 있었다 — 실제로는 꺼둔 상태라면 열 때마다 "켜짐→꺼짐"으로 전환되는 게 보였다. Provider를 앱 루트로 옮기면서 이 fetch가 앱 부팅 시 한 번만 일어나게 됐고, 드롭다운을 여닫아도 값은 그대로라 깜빡임이 사라졌다.

## 핵심 로직 (`useEventNotifications.ts`)

- `useCalendarItems()`로 얻은 이벤트 중 `category === 'time'`(시간 지정 일정)만 대상.
- `useNotificationSettings()`의 `enabled`가 `false`면 그 즉시 종료 — 스케줄 자체를 안 잡는다.
- 각 이벤트의 시작 시각 − `leadMinutes`를 계산해 `setTimeout`으로 예약.
- **주의점**: Google Calendar API가 과거~미래 2년치 이벤트를 한 번에 가져오는데, `setTimeout`은 delay가 약 24.8일(2^31-1ms)을 넘으면 32비트 오버플로로 즉시 실행돼버리는 Node/Chromium 버그가 있다. 그래서 알림 시각이 **1시간 이내**로 다가온 이벤트만 타이머를 걸고, 나머지는 `items`가 갱신될 때(캘린더 데이터 10분 폴링, `entities/event/api/queries.ts`의 `refetchInterval`) 다시 평가한다.
- 이미 알림을 보낸 이벤트 id는 `useRef<Set<string>>`로 추적해 중복 발송 방지.
- effect의 의존성 배열이 `[items, enabled, leadMinutes]`라서, 알림을 끄거나 알림 시점을 바꾸는 즉시 cleanup이 돌면서 이미 예약돼 있던 타이머까지 전부 `clearTimeout`된다. (이전에는 `enabled`/`leadMinutes`를 effect 안에서 매번 IPC로 새로 fetch했는데 의존성엔 없어서, 알림을 꺼도 이미 걸어둔 타이머는 취소되지 않고 그대로 울리는 버그가 있었다 — Context로 옮기면서 같이 고쳐짐.)
- 실제 발송은 `window.api.showNotification({ title, body })` → main의 `show-notification` 핸들러가 `new Notification(...).show()` 호출.

## UI (`NotificationSettingButton.tsx`)

- 켜짐/꺼짐은 다른 설정 항목들과 동일하게 공용 `shared/ui/switch.tsx`의 `Switch`(`role="switch"`) 재사용.
- 켜져 있을 때만 "N분 전" 미리보기 카드와, `ChevronDown`/`ChevronUp` 버튼으로 `LEAD_MINUTES_OPTIONS = [5, 10, 15, 30]` 중 값을 바꾸는 스테퍼가 펼쳐진다.
- 값과 토글/변경 함수는 전부 `useNotificationSettings()`에서 받아 쓴다 — 이 컴포넌트 자체는 IPC를 직접 호출하지 않는다.

## 검증

- `npm run typecheck` 통과 확인.
- `npm run lint` 결과는 별도 확인 필요.
