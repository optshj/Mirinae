import { ipcMain, app, shell } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import { mainWindow, getVirtualScreenOffset } from '.';
import { tryAutoLogin, logoutGoogleOAuth, startGoogleOAuth } from './oauth';
import { store } from './store';
import activeWindow from 'active-win';
import { posthog, getDistinctId } from './posthog';

export const registerIPCHandlers = () => {
  ipcMain.on('open-external', (_, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('try-auto-login', tryAutoLogin);
  ipcMain.handle('logout-google-oauth', logoutGoogleOAuth);
  ipcMain.on('start-google-oauth', startGoogleOAuth);

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('start-dragging', () => {
    detach(mainWindow);
    const { x, y, width, height } = mainWindow.getBounds();
    const { minX, minY } = getVirtualScreenOffset();

    mainWindow.setBounds({
      x: x + minX,
      y: y + minY,
      width,
      height
    });
    mainWindow.setResizable(true);
  });

  ipcMain.on('stop-dragging', () => {
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

    posthog.capture({
      distinctId: getDistinctId(),
      event: 'window_moved',
      properties: { x: finalBounds.x, y: finalBounds.y, width: finalBounds.width, height: finalBounds.height }
    });
  });

  ipcMain.on('set-opacity', (_, newOpacity) => {
    mainWindow.setOpacity(newOpacity);
    store.set('window-opacity', newOpacity);
    posthog.capture({ distinctId: getDistinctId(), event: 'opacity_changed', properties: { opacity: newOpacity } });
  });

  ipcMain.handle('get-initial-opacity', () => store.get('window-opacity'));

  ipcMain.handle('get-max-lanes', () => store.get('max-lanes'));
  ipcMain.on('set-max-lanes', (_, value) => {
    store.set('max-lanes', value);
    posthog.capture({ distinctId: getDistinctId(), event: 'max_lanes_changed', properties: { max_lanes: value } });
  });

  ipcMain.on('renderer-ready', async (event) => {
    const window = await activeWindow();
    const isExplorer = window?.title === 'Program Manager';
    event.sender.send('update-clickable', isExplorer);
  });
};
