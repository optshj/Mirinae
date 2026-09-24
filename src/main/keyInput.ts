import type { BrowserWindow } from 'electron';

// 일부 환경(Win10 등)에선 키를 한 번 눌러도 입력이 2번 들어온다.
// 같은 키가 5ms 안에 또 오면 중복으로 보고 버린다 (사람은 그렇게 빨리 못 누른다).
const DUPLICATE_WINDOW_MS = 5;

export function dropDuplicateKeyInput(window: BrowserWindow, now: () => number = () => performance.now()) {
  let lastKey = '';
  let lastType = '';
  let lastAt = -Infinity;

  window.webContents.on('before-input-event', (event, input) => {
    const at = now();

    if (input.key === lastKey && input.type === lastType && at - lastAt < DUPLICATE_WINDOW_MS) {
      event.preventDefault();
      return;
    }

    lastKey = input.key;
    lastType = input.type;
    lastAt = at;
  });
}
