import { ipcMain, app } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import { mainWindow } from '.';
import { tryAutoLogin, logoutGoogleOAuth, startGoogleOAuth } from './oauth';
import { store } from './store';
import activeWindow from 'active-win';

export const registerIPCHandlers = () => {
  ipcMain.handle('try-auto-login', tryAutoLogin);
  ipcMain.handle('logout-google-oauth', logoutGoogleOAuth);
  ipcMain.on('start-google-oauth', startGoogleOAuth);

  ipcMain.on('quit-app', () => {
    app.quit();
  });

  ipcMain.on('start-dragging', () => {
    detach(mainWindow);
    mainWindow.setResizable(true);
  });
  ipcMain.on('stop-dragging', () => {
    mainWindow.setResizable(false);
    const bound = mainWindow.getBounds();
    attach(mainWindow, { forwardKeyboardInput: true, forwardMouseInput: true });
    mainWindow.setBounds(bound);
    store.set('window-bounds', bound);
  });

  ipcMain.on('set-opacity', (_, newOpacity) => {
    mainWindow.setOpacity(newOpacity);
    store.set('window-opacity', newOpacity);
  });

  ipcMain.handle('get-initial-opacity', () => store.get('window-opacity'));

  ipcMain.on('renderer-ready', async (event) => {
    const window = await activeWindow();
    const isExplorer = window?.title === 'Program Manager';
    event.sender.send('update-clickable', isExplorer);
  });
};
