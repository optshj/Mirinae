# PostHog 수집 지점 main → renderer 이관

## 왜

main(`posthog-node`)과 renderer(`posthog-js`)가 **각각 다른 distinct_id로** 같은 프로젝트에 이벤트를 쏘고 있었다.

- main: `electron-store`에 저장한 device UUID (`posthog-device-id`)
- renderer: `posthog-js`가 만든 익명 ID (localStorage)

한 명의 유저가 PostHog에서 두 사람으로 잡혀 퍼널·리텐션이 갈라졌고, main 이벤트는 세션 리플레이에 붙지 않았다. 게다가 알림 설정 2종은 양쪽에서 중복 발사되고 있었다.

## 이벤트별 이관 결과

| 이벤트              | 전 (main)                       | 후 (renderer)                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `window_moved`      | `ipcHandler.ts` `stop-dragging` | `features/move/model/move-context.tsx` — invoke 반환 bounds로 캡처 |
| `opacity_changed`   | `ipcHandler.ts` `set-opacity`   | `features/opacity/ui/OpacityButton.tsx`                            |
| `user_logged_in`    | `oauth.ts:172`                  | `shared/hooks/useLogin.tsx` `handleLogin`                          |
| `user_logged_out`   | `oauth.ts:142`                  | `useLogin.tsx` `logout`                                            |
| `update_available`  | `autoUpdate.ts:21`              | `app/main.tsx` — 새 `update-available` 채널                        |
| `update_downloaded` | `autoUpdate.ts:34`              | `entities/update/ui/UpdateNotification.tsx` — 기존 채널 재사용     |
| `update_accepted`   | `autoUpdate.ts:56`              | `UpdateNotification.tsx` `handleInstall`                           |
| `update_declined`   | `autoUpdate.ts:66`              | `UpdateNotification.tsx` `handleDismiss`                           |

이벤트 이름과 프로퍼티 키는 전부 그대로 유지했다. 기존 PostHog 인사이트/대시보드는 안 깨진다.

---

## IPC 변경

| 채널            | 전                             | 후                                                                                           |
| --------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `stop-dragging` | `ipcMain.on` (fire-and-forget) | `ipcMain.handle` — 최종 `finalBounds` 반환. renderer가 `window_moved` 프로퍼티를 채우기 위함 |

---

## 곁다리로 고쳐진 것

`OpacityButton`이 `setOpacity((prev) => { ... window.api.setOpacity(...) ... })`처럼 **state updater 안에서 IPC를 호출**하고 있었다. React StrictMode에서 updater가 두 번 실행되면 IPC도 두 번 나간다. `changeOpacity(delta)` 헬퍼로 빼면서 부수효과를 updater 밖으로 꺼냈고, 코드도 줄었다.

---

## 실기 검증 필요

- [ ] 창 이동 후 `window_moved`가 올바른 bounds로 찍히는지 (`stop-dragging`이 `on`→`handle`로 바뀜)
- [ ] 시작 직후 `update_available` / `update_error`가 유실 없이 도착하는지
- [ ] `app_launched`의 `app_version`이 채워지는지
- [ ] PostHog에서 이벤트가 **하나의 distinct_id**로 모이는지, 세션 리플레이에 붙는지
