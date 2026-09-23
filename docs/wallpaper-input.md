# 벽지 창 — 입력 전달

미리내 창은 바탕화면 레이어(`WorkerW`)의 자식이라 보통의 창처럼 OS에서 입력을 받지 못한다.
대신 `electron-as-wallpaper`가 **raw input을 가로채 창에 직접 메시지를 쏴주는** 경로로 입력을 받는다.
이 문서는 그 경로와, 거기서 나오는 제약을 다룬다. 좌표계는 [`wallpaper-window.md`](./wallpaper-window.md).

관련 파일: `src/main/wallpaper.ts`, `src/main/keyInput.ts`, `src/main/index.ts`, `node_modules/electron-as-wallpaper/src/input.rs`

---

## 입력이 창에 도달하는 경로

`attach()`에 `forwardMouseInput` / `forwardKeyboardInput`을 켜면 라이브러리가 숨은 창
(`RawInputWindowClass`)을 만들고 `RIDEV_INPUTSINK` 플래그로 raw input을 등록한다.
`INPUTSINK`는 **포커스와 무관하게** 시스템 전체 입력을 받는다는 뜻이다.

```
물리 입력 → RawInputWindow(WM_INPUT) → 미리내 hwnd로 PostMessage(WM_LBUTTONDOWN / WM_KEYDOWN ...)
```

여기서 나오는 성질들:

| 성질                         | 결과                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------ |
| 휠(`RI_MOUSE_HWHEEL`)은 무시 | 스크롤이 전달되지 않는다. 스크롤 대신 버튼으로 설계한다                        |
| 좌표는 `GetCursorPos` 1회    | 클릭·이동은 오지만 연속 드래그(pointermove) 스트림은 신뢰할 수 없다            |
| 전달 대상은 등록된 hwnd 목록 | 같은 hwnd가 두 번 등록되면 입력이 **2번씩** 전달된다 (아래 "attach는 한 번만") |
| 포커스 불필요                | 창이 활성화되지 않아도 입력이 들어온다 — 그래서 창은 활성화될 필요가 **없다**  |

## 창은 `focusable: true`다 — `false`는 키를 죽인다

`focusable: false`로 하면 `WS_EX_NOACTIVATE`가 붙어 OS가 창을 활성화하지 않는다.
네이티브 키 경로는 사라지지만 **포워딩된 키도 같이 죽는다.**

라이브러리는 키를 `PostMessageA(hwnd, WM_KEYDOWN, ...)`로 쏘고(`input.rs`의 `send_keyboard_input`)
메시지는 hwnd까지 도착한다. 하지만 Chromium은 이걸 **포커스된 위젯**으로 라우팅하는데,
Electron은 `focusable: false` 위젯을 `Activatable::kNo`로 만들고 Chromium 포커스 규칙은
활성화 불가능한 위젯 안의 창에 포커스를 주지 않는다(포커스는 그 창의 activatable 조상을 함께
활성화시키려 하는데 그게 없다) → 키 이벤트가 버려진다. `focusOnWebView()`로도 되살아나지 않는다.
마우스는 좌표 히트테스트라 포커스와 무관해서 클릭만 살아남는다.

그래서 `focusable: true`를 유지한다. 대신 Win10에선 키가 오는 경로가 둘이 된다.

### 경로가 둘이면 글자가 2번 — `keyInput.ts`

바탕화면 레이어 구조는 Windows 버전마다 달라서, Win11에선 이 창이 포그라운드가 되지 않지만
Win10에선 활성화된다. 활성화되면 물리 키 한 번에

1. 포커스된 창으로 가는 **네이티브** `WM_KEYDOWN`
2. raw input sink가 쏘는 **포워딩** `WM_KEYDOWN`

이 둘 다 도착한다. `HangulInput`은 `onKeyDown`마다 `preventDefault()` 후 직접 글자를 조립하므로
(`src/renderer/shared/ui/input.tsx`) keydown 2번 = **글자 2개**가 된다.

2중 입력의 원인은 이것 말고 hwnd 중복 등록(아래 "attach는 한 번만")도 있다.

두 경로는 Chromium 입력 파이프라인에서 합류하므로, 그 직전인 `before-input-event`에서 한 번만 거른다.
여기서 `preventDefault()`하면 페이지에 keydown 자체가 가지 않아서 리스너마다 따로 막을 필요가 없다.

```ts
// src/main/keyInput.ts — createWindow()에서 한 번 건다
window.webContents.on('before-input-event', (event, input) => {
  const at = now();

  if (input.key === lastKey && input.type === lastType && at - lastAt < DUPLICATE_WINDOW_MS) {
    // 버린 키로는 lastAt을 갱신하지 않는다 — 갱신하면 auto-repeat이 연쇄적으로 먹힌다
    event.preventDefault();
    return;
  }
  ...
});
```

OS 버전으로 포워딩을 분기하지 않는 이유는 "Win10은 활성화, Win11은 안 됨"이 관찰일 뿐이기 때문이다
(활성화되는 Win11 빌드가 나오면 그 분기는 깨진다). 5ms 창은 사람이 같은 키를 그 안에 두 번 못 치고
auto-repeat은 ~30ms라 오탐이 없으며, 원인이 네이티브 중복이든 hwnd 중복 등록이든 똑같이 덮는다.

## attach는 한 번만 — `wallpaper.ts`

라이브러리의 `start_input_forwarding`은 호출될 때마다 hwnd를 전달 목록에 **push만** 한다. 중복 검사가 없다.
JS쪽 `detach()`는 이미 분리된 상태면 조용히 무시한다. 그래서 attach/detach 짝이 어긋나면
같은 hwnd가 2개 등록돼 키·마우스가 영구히 2번씩 전달된다.

호출부가 셋(기동, 화면조절 종료, 트레이 메뉴 닫힘)이라 짝은 쉽게 어긋난다.
예: 화면조절 시작(detach) → 트레이 메뉴 열기(detach, 무시됨) → 메뉴 닫힘(**attach**) → 화면조절 종료(**attach**).

그래서 부착 여부를 한 곳에서 들고 있는 래퍼만 쓴다. `attach`/`detach`를 직접 import하지 않는다.

```ts
// src/main/wallpaper.ts
let isAttached = false;

export function attachWallpaper(window: BrowserWindow) {
  if (isAttached) return;
  attach(window, WALLPAPER_OPTIONS);
  isAttached = true;
}
```

## 증상별 원인

| 증상                                   | 원인                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| 글자가 2번씩 입력됨                    | 네이티브 + 포워딩 두 경로 동시 수신, 또는 hwnd 중복 등록 (`keyInput.ts`가 덮는다) |
| 키가 아예 안 들어옴                    | `focusable: false`로 바꿨을 때 — 포워딩된 `WM_KEYDOWN`이 라우팅될 위젯이 없음     |
| 클릭도 2번씩 먹힘                      | hwnd 중복 등록 (네이티브 클릭은 데스크톱이 가져가므로 이쪽만 해당)                |
| 첫 클릭이 씹히고 두 번째 클릭부터 반응 | 첫 클릭이 창 활성화에 소비됨 — Win10에서 창이 활성화되기 때문                     |
| 휠 스크롤이 안 먹음                    | 포워딩이 휠을 버린다                                                              |

---

## 검증

자동 테스트가 없다. **CDP나 페이지 내 `dispatchEvent`는 OS 포워딩 경로를 안 타므로 가짜 검증이다.**
네이티브 경로를 그대로 재현하는 `PostMessage(WM_LBUTTONDOWN/UP)`만 유효하고,
raw input sink까지 타는 검증은 **사람이 실제 키를 치는 것**뿐이다.

다른 앱이 포그라운드면 `disable-click`으로 앱 전체 `pointer-events: none`이 되므로
(`src/main/activeWindow.ts`) 합성 클릭 검증도 바탕화면이 포그라운드일 때만 의미가 있다.

Windows 10과 11 양쪽에서:

1. 기동 직후(트레이·화면조절 건드리기 전) 한글 입력. 글자가 **1번만** 들어오는가
2. 빠르게 연타·길게 눌러 auto-repeat. 5ms dedupe가 정상 입력을 씹지 않는가
3. 날짜 클릭 → 일정 추가 → 한글 입력
4. 첫 클릭이 바로 먹히는가
5. 화면조절·트레이 메뉴를 섞어서 여러 번 열고 닫은 뒤에도 1~4가 그대로인가 (중복 등록 확인)

창이 실제로 어떤 상태인지는 PowerShell로 확인할 수 있다 — 부모가 `WorkerW`,
확장 스타일에 `WS_EX_LAYERED`(0x00080000)와 `WS_EX_NOACTIVATE`(0x08000000)가 있으면 정상이다.
