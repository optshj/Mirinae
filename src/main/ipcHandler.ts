import { ipcMain, app, shell, Notification, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import log from 'electron-log';
import { mainWindow, getVirtualScreenOffset } from '.';
import { restoreSession, logoutGoogleOAuth, loginGoogleOAuth, googleRequest } from './oauth';
import { RENDERER_URL_PREFIX } from './bundleUpdate';
import { store } from './store';

// 앱 렌더러의 메인 프레임에서 온 요청만 믿는다. 커스텀 스킴은 URL.origin이 "null"이라 접두사로 비교한다
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
  ipcMain.on('set-notifications-enabled', (_, value) => store.set('notifications-enabled', value));

  // 일정 알림 선행 시간
  ipcMain.handle('get-notification-lead-minutes', () => store.get('notification-lead-minutes'));
  ipcMain.on('set-notification-lead-minutes', (_, value) => store.set('notification-lead-minutes', value));

  ipcMain.on('show-notification', (_, payload: { title: string; body: string }) => {
    if (!Notification.isSupported()) return;
    new Notification({ title: payload.title, body: payload.body }).show();
  });
};
