import activeWindow from 'active-win';
import type { BrowserWindow } from 'electron';

const WINDOWS_EXPLORER_PATH = 'C:\\Windows\\explorer.exe';

let windowCheckInterval: NodeJS.Timeout | undefined;
let lastIsExplorer: boolean | undefined;

export function startActiveWindowWatcher(mainWindow: BrowserWindow) {
  if (windowCheckInterval) {
    return;
  }

  // 리로드된 페이지는 disable-click 상태를 모르므로 다음 틱에 다시 보낸다
  mainWindow.webContents.on('did-finish-load', () => {
    lastIsExplorer = undefined;
  });

  windowCheckInterval = setInterval(async () => {
    try {
      const window = await activeWindow();
      const isExplorer = window?.owner?.path === WINDOWS_EXPLORER_PATH;

      if (isExplorer !== lastIsExplorer) {
        lastIsExplorer = isExplorer;
        mainWindow.webContents.send('update-clickable', isExplorer);
      }
    } catch (error) {
      console.error('Failed to get active window:', error);
    }
  }, 1000);
}

export function stopActiveWindowWatcher() {
  if (windowCheckInterval) {
    clearInterval(windowCheckInterval);
    windowCheckInterval = undefined;
    lastIsExplorer = undefined;
  }
}
