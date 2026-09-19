import { app, BrowserWindow, screen } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { attach } from 'electron-as-wallpaper';
import AutoLaunch from 'auto-launch';
import { join } from 'path';
import { initTray } from './tray';
import { initAutoUpdater } from './autoUpdate';
import { registerIPCHandlers } from './ipcHandler';
import { store } from './store';
import { startActiveWindowWatcher, stopActiveWindowWatcher } from './activeWindow';
import { handleRendererProtocol, loadRenderer, registerRendererScheme } from './bundleUpdate';
import * as Sentry from '@sentry/electron/main';

const SERVICE_NAME = 'Mirinae';

if (!app.requestSingleInstanceLock()) process.exit(0);
registerRendererScheme();

export let mainWindow: BrowserWindow;
let isWindowAttached = false;

// Enable auto launch on system startup
new AutoLaunch({
  name: SERVICE_NAME,
  path: process.execPath
}).enable();

Sentry.init({
  dsn: 'https://e14a01e7695b60bc88127406d382c174@o4511528205615104.ingest.us.sentry.io/4511528463630336',
  enableLogs: true
});

export const getVirtualScreenOffset = () => {
  const displays = screen.getAllDisplays();
  const minX = Math.min(...displays.map((d) => d.bounds.x));
  const minY = Math.min(...displays.map((d) => d.bounds.y));
  return { minX, minY };
};

function createWindow(): void {
  const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const savedBounds = store.get('window-bounds');

  mainWindow = new BrowserWindow({
    x: savedBounds.x,
    y: savedBounds.y,
    width: savedBounds.width,
    height: savedBounds.height ? savedBounds.height : screenHeight,
    show: false,
    frame: false,
    focusable: true,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false,
      plugins: false,
      webgl: false,
      images: false,
      experimentalFeatures: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.setMenu(null);
    mainWindow.show();
    if (!isWindowAttached) {
      attach(mainWindow, {
        forwardMouseInput: true,
        forwardKeyboardInput: true
      });
      // v0.3.1 이전 버전에서 창 위치가 null로 지정되어있어 실행 시 js setBounds에서 오류가 발생하는 문제 해결
      mainWindow.setBounds({
        x: savedBounds.x || 0,
        y: savedBounds.y || 0,
        width: savedBounds.width,
        height: savedBounds.height
      });
      isWindowAttached = true;
    }
  });

  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mirinae');
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));

  handleRendererProtocol();
  createWindow();
  initTray();
  registerIPCHandlers();
  loadRenderer(mainWindow);
  initAutoUpdater();
  startActiveWindowWatcher(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      loadRenderer(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  stopActiveWindowWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
