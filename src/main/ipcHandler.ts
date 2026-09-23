import { ipcMain, app, shell, Notification, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { mainWindow } from '.';
import { toScreenBounds, toWallpaperBounds } from './wallpaperBounds';
import { restoreSession, logoutGoogleOAuth, loginGoogleOAuth, googleRequest } from './oauth';
import { RENDERER_URL_PREFIX } from './bundleUpdate';
import { store } from './store';
import { attachWallpaper, detachWallpaper } from './wallpaper';

export const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent) => {
  const frame = event.senderFrame;
  return event.sender === mainWindow?.webContents && frame !== null && frame.parent === null && frame.url.startsWith(RENDERER_URL_PREFIX);
};

export const registerIPCHandlers = () => {
  ipcMain.on('open-external', (event, url: unknown) => {
    if (!isTrustedSender(event) || typeof url !== 'string' || !URL.canParse(url) || new URL(url).protocol !== 'https:') return;
    shell.openExternal(url).catch((error) => log.warn('[IPC] openExternal 실패', url, error));
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('restore-session', restoreSession);
  ipcMain.handle('logout-google-oauth', logoutGoogleOAuth);
  ipcMain.handle('login-google-oauth', loginGoogleOAuth);
  ipcMain.handle('google-request', (event, url: string, init?: { method?: string; body?: string }) => {
    if (!isTrustedSender(event)) throw new Error('허용되지 않은 발신자입니다');
    return googleRequest(event, url, init);
  });

  ipcMain.on('quit-app', () => app.quit());

  ipcMain.on('start-dragging', (_, options?: { resizable?: boolean }) => {
    detachWallpaper(mainWindow);
    mainWindow.setBounds(toScreenBounds(mainWindow.getBounds()));
    mainWindow.setResizable(options?.resizable ?? true);
  });

  // 렌더러가 window_moved 애널리틱스를 남길 수 있도록 최종 bounds를 돌려준다
  ipcMain.handle('stop-dragging', () => {
    mainWindow.setResizable(false);

    const bounds = mainWindow.getBounds();

    attachWallpaper(mainWindow);
    mainWindow.setBounds(toWallpaperBounds(bounds));
    store.set('window-bounds', bounds);

    return bounds;
  });

  // 일정 알림 활성화
  ipcMain.handle('get-notifications-enabled', () => store.get('notifications-enabled'));
  ipcMain.on('set-notifications-enabled', (_, value) => store.set('notifications-enabled', value));

  // 일정 알림 선행 시간
  ipcMain.handle('get-notification-lead-minutes', () => store.get('notification-lead-minutes'));
  ipcMain.on('set-notification-lead-minutes', (_, value) => store.set('notification-lead-minutes', value));

  ipcMain.on('show-notification', (_, payload: { title: string; body: string }) => {
    if (!Notification.isSupported()) return;
    new Notification({ title: payload.title, body: payload.body }).show();
  });
};
