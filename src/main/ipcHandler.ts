import { ipcMain, app, shell, Notification } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import { mainWindow, getVirtualScreenOffset } from '.';
import { tryAutoLogin, logoutGoogleOAuth, startGoogleOAuth } from './oauth';
import { store } from './store';
import activeWindow from 'active-win';

export const registerIPCHandlers = () => {
  ipcMain.on('open-external', (_, url) => shell.openExternal(url));

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('try-auto-login', tryAutoLogin);
  ipcMain.handle('logout-google-oauth', logoutGoogleOAuth);
  ipcMain.on('start-google-oauth', startGoogleOAuth);

  ipcMain.on('quit-app', () => app.quit());

  ipcMain.on('start-dragging', (_, options?: { resizable?: boolean }) => {
    detach(mainWindow);
    const { x, y, width, height } = mainWindow.getBounds();
    const { minX, minY } = getVirtualScreenOffset();

    mainWindow.setBounds({
      x: x + minX,
      y: y + minY,
      width,
      height
    });
    mainWindow.setResizable(options?.resizable ?? true);
  });

  // 렌더러가 window_moved 애널리틱스를 남길 수 있도록 최종 bounds를 돌려준다
  ipcMain.handle('stop-dragging', () => {
    mainWindow.setResizable(false);

    const { x, y, width, height } = mainWindow.getBounds();
    const { minX, minY } = getVirtualScreenOffset();

    attach(mainWindow, { forwardKeyboardInput: true, forwardMouseInput: true });

    const finalBounds = {
      x: x - minX,
      y: y - minY,
      width,
      height
    };

    mainWindow.setBounds(finalBounds);
    store.set('window-bounds', finalBounds);

    return finalBounds;
  });

  ipcMain.on('set-opacity', (_, newOpacity) => {
    mainWindow.setOpacity(newOpacity);
    store.set('window-opacity', newOpacity);
  });

  ipcMain.handle('get-initial-opacity', () => store.get('window-opacity'));

  // 일정 알림 활성화
  ipcMain.handle('get-notifications-enabled', () => store.get('notifications-enabled'));
  ipcMain.on('set-notifications-enabled', (_, value) => {
    store.set('notifications-enabled', value);
  });

  // 일정 알림 선행 시간
  ipcMain.handle('get-notification-lead-minutes', () => store.get('notification-lead-minutes'));
  ipcMain.on('set-notification-lead-minutes', (_, value) => {
    store.set('notification-lead-minutes', value);
  });

  ipcMain.on('show-notification', (_, payload: { title: string; body: string }) => {
    if (!Notification.isSupported()) return;
    new Notification({ title: payload.title, body: payload.body }).show();
  });

  ipcMain.on('renderer-ready', async (event) => {
    const window = await activeWindow();
    const isExplorer = window?.title === 'Program Manager';
    event.sender.send('update-clickable', isExplorer);
  });
};
