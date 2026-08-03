# CLAUDE.md

## 핵심 전제

미리내는 `electron-as-wallpaper`(`^2.0.3`)로 창을 바탕화면 아이콘 레이어 뒤에 직접 붙이는 위젯형 캘린더다. 일반 Electron 앱처럼 다루면 안 된다. 관련 코드: `src/main/index.ts`, `ipcHandler.ts`, `activeWindow.ts`, `tray.ts`.

**타겟 플랫폼은 Windows와 macOS 둘 다다.** 지금 코드는 Windows에서만 동작하지만, macOS 지원은 "여유 되면"이 아니라 확정된 목표다. Windows 전용 하드코딩을 새로 추가할 땐 macOS 이식을 항상 염두에 둘 것 (아래 "macOS 지원 현황" 참고).

## 제약사항

1. **휠 스크롤 미전달** — `forwardMouseInput`은 클릭/이동만 전달한다. 스크롤 대신 버튼으로 설계할 것 (예: `WeekCalendar/lib/useHourScroll.ts`).
2. **연속 드래그(pointermove) 신뢰 불가 + 검증 수단도 없음** — CDP나 페이지 내 `dispatchEvent`는 OS 포워딩 경로를 안 타는 가짜 검증. 단일 클릭(pointerdown→즉시 pointerup)으로 설계할 것. 실제 경로 검증은 PowerShell `PostMessage(WM_LBUTTONDOWN/UP)`만 유효.
3. **`WebkitAppRegion: drag` 데드존** — z-order 무관하게 기하학적으로 계산됨. 겹칠 수 있는 플로팅 UI엔 `no-drag` 필수 (unmount→remount 시 재계산 지연 가능 — 헤더와 안 겹치게 오프셋 주는 게 더 안전).
4. **`disable-click`이 진행 중 제스처를 끊을 수 있음** — 다른 앱 포커스 시 앱 전체 `pointer-events: none`. 드래그 중 pointerup 유실 가능 → 취소/정리 로직 필수 (`event-drag/hooks/useEventDrag.tsx`).
5. **이미지/WebGL/플러그인 비활성** (`main/index.ts`의 `images:false` 등) — `<img>`/WebGL 안 뜸. 아이콘·그래픽은 SVG/CSS만.
6. **CSP가 인라인 스타일 차단** (`vite-plugin-csp-guard`) — Radix/cmdk류가 콘솔에 `Refused to apply inline style` 경고를 낼 수 있음(대체로 비치명적). 새 외부 API 호출 시 `electron.vite.config.ts`의 `connect-src`도 갱신할 것.
7. **네이티브 IME 신뢰 불가** — 한글 입력 필드는 반드시 `HangulInput`(`shared/ui/input.tsx`) 재사용, 일반 `<input>` 금지. cmdk `CommandInput` 같은 외부 입력 컴포넌트는 한글 입력이 중요하면 실기 검증 전까지 위험 요소로 취급.

## macOS 지원 현황 (목표 확정, 구현은 아직)

- `electron-as-wallpaper`가 Windows 전용 네이티브 모듈이라 바탕화면 부착 자체가 안 됨 — 핵심 블로커, 별도 네이티브 통합 필요.
- 그 외에도 `activeWindow.ts`의 Explorer 하드코딩, `electron-builder.json`(mac 타겟 없음), `active-win` darwin prebuild 패키징 제외 등 손볼 곳이 많음.
- 제약 3번(드래그 데드존)은 Chromium 공통이라 mac에도 적용될 가능성 높음. 1·2·4번은 Windows 구현체에서 관찰된 것이라 mac 대체 구현에도 같은 제약이 있을지는 재검증 필요.
