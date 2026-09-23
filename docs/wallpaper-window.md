# 벽지 창 — 좌표계

미리내 창은 `electron-as-wallpaper`의 `attach()`로 바탕화면 레이어에 붙는다. `attach()`는 내부적으로
`SetParent(hwnd, WorkerW)`를 호출하므로, 창이 **바탕화면을 그리는 창의 자식**이 된다. 그래서 부착 중에는
`getBounds`/`setBounds` 좌표가 화면 절대 좌표가 아니라 **부모(가상 화면 원점) 기준 상대값**이 된다.
이 문서는 그 좌표계를 다룬다.

관련 파일: `src/main/index.ts`, `src/main/wallpaperBounds.ts`, `src/main/wallpaper.ts`, `src/main/ipcHandler.ts`, `src/main/tray.ts`

---

## 좌표계

### 두 개의 좌표계

| 상태         | `getBounds()` / `setBounds()`가 쓰는 기준         |
| ------------ | ------------------------------------------------- |
| 분리(detach) | 화면 **절대** 좌표                                |
| 부착(attach) | 부모(WorkerW) = **가상 화면 원점** 기준 상대 좌표 |

가상 화면 원점은 모든 디스플레이 중 가장 왼쪽/위 좌표다. 주 모니터가 제일 왼쪽이면 (0,0)이라 두 좌표계가
같아지고, 왼쪽에 모니터를 붙이면 음수가 되면서 갈라진다.

### 저장 좌표계는 "절대" 하나로 통일

`store`의 `window-bounds`는 **항상 화면 절대 좌표**다 (기본값 `{ width: 1280, height: 800, x: 0, y: 0 }`).
변환은 부착/분리 경계에서만 한다. 경계를 넘는 호출은 `wallpaper.ts`의 `attachWallpaper`/`detachWallpaper`
래퍼만 쓴다 — `electron-as-wallpaper`의 `attach`/`detach`를 직접 부르면 부착 여부가 갈려서
좌표계 변환과 입력 전달이 동시에 어긋난다([`wallpaper-input.md`](./wallpaper-input.md)).

```
기동      store(절대) → BrowserWindow 생성(절대) → attachWallpaper → setBounds(toWallpaperBounds → 상대)
화면조절 시작   detachWallpaper → setBounds(toScreenBounds → 절대) → setResizable(true)
화면조절 종료   getBounds(절대) → attachWallpaper → setBounds(toWallpaperBounds → 상대) → store.set(절대)
트레이 메뉴    열림: detachWallpaper + toScreenBounds / 닫힘: attachWallpaper + toWallpaperBounds + store.set(절대)
```

### 변환은 물리 픽셀에서 — `wallpaperBounds.ts`

```ts
const shiftByVirtualOrigin = (bounds: Rectangle, sign: 1 | -1): Rectangle => {
  const origins = screen.getAllDisplays().map((display) => screen.dipToScreenRect(null, display.bounds));
  const minX = Math.min(...origins.map((origin) => origin.x));
  const minY = Math.min(...origins.map((origin) => origin.y));
  const physical = screen.dipToScreenRect(null, bounds);

  return screen.screenToDipRect(null, { ...physical, x: physical.x + sign * minX, y: physical.y + sign * minY });
};
export const toScreenBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, 1); // 상대 → 절대
export const toWallpaperBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, -1); // 절대 → 상대
```

`getBounds`/`setBounds`가 다루는 값은 **DIP**(배율 나눈 논리 픽셀)인데, 부모 창의 원점은 **물리 픽셀**이다.
DIP 공간에선 디스플레이마다 제 배율로 배치되므로 DIP끼리 원점을 더하고 빼면 배율 차이만큼 어긋난다.
그래서 물리 픽셀로 환산해서 보정하고 다시 DIP로 되돌린다.

예: 왼쪽 2560×1440@150% + 오른쪽 1920×1080@100%(주 모니터)

|                  | 물리  | DIP                     |
| ---------------- | ----- | ----------------------- |
| 왼쪽 모니터 원점 | -2560 | -2560 / 1.5 ≈ **-1707** |

부모 원점은 물리 -2560인데 DIP -1707로 계산하면 **853px씩 튄다.** 배율이 모두 같으면 두 값이 일치해서
증상이 안 나타난다 — 단일 모니터나 같은 배율 듀얼에서 멀쩡했던 이유다.

### 증상별 원인

| 증상                                                | 원인                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 배율 다른 듀얼에서 화면조절 시작/종료마다 위치가 튐 | 원점 보정을 DIP 좌표에서 해서                                                                                          |
| 실행 직후 **첫** 화면조절에서만 크기가 갑자기 변함  | 저장값은 상대 좌표인데 창 생성 시 절대 좌표로 해석 → 엉뚱한 모니터 배율로 물리 크기가 잡힌 채 시작, 첫 조절에서 정리됨 |

### macOS

`dipToScreenRect` / `screenToDipRect`는 **Windows 전용 API**다. 애초에 부착 자체가 Windows 전용이라
macOS 부착 방식이 생기면 이 파일은 그 좌표계에 맞춰 새로 써야 한다.

---

## 검증

자동 테스트가 없다. 배율이 다른 듀얼 모니터가 있어야 재현되는 영역이라,
목(mock)으로 짠 테스트는 목을 검증하는 꼴이 된다.

배율 섞인 듀얼 모니터에서:

1. 화면조절 시작/종료를 반복해도 위치·크기가 그대로인가
2. 실행 직후 첫 화면조절에서 크기가 변하지 않는가
3. 트레이 메뉴를 열고 닫아도 제자리인가

2번은 되는데 **매번** 크기가 변한다면 `dipToScreenRect`/`screenToDipRect`의 첫 인자를
`null` → `mainWindow`로 바꿔본다. Electron이 DIP↔물리 환산에 "rect에 가장 가까운 디스플레이"가 아니라
"창이 올라가 있는 디스플레이"의 배율을 쓴다는 뜻이 되기 때문이다. 두 변환 모두 같은 기준을 써야
왕복이 정확해진다.
