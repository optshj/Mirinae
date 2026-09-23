import { app, BrowserWindow, screen } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import AutoLaunch from 'auto-launch';
import { join } from 'path';
import { initTray } from './tray';
import { initAutoUpdater } from './autoUpdate';
import { registerIPCHandlers } from './ipcHandler';
import { store } from './store';
import { toWallpaperBounds } from './wallpaperBounds';
import { startActiveWindowWatcher, stopActiveWindowWatcher } from './activeWindow';
import { attachWallpaper } from './wallpaper';
import { dropDuplicateKeyInput } from './keyInput';
import { handleRendererProtocol, loadRenderer, registerRendererScheme } from './bundleUpdate';
import * as Sentry from '@sentry/electron/main';

const SERVICE_NAME = 'Mirinae';

if (!app.requestSingleInstanceLock()) process.exit(0);
registerRendererScheme();

export let mainWindow: BrowserWindow;

// Enable auto launch on system startup
new AutoLaunch({
  name: SERVICE_NAME,
  path: process.execPath
}).enable();

Sentry.init({
  dsn: 'https://e14a01e7695b60bc88127406d382c174@o4511528205615104.ingest.us.sentry.io/4511528463630336',
  enableLogs: true
});

function createWindow(): void {
  const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const saved = store.get('window-bounds');
  const savedBounds = {
    x: saved.x || 0,
    y: saved.y || 0,
    width: saved.width,
    height: saved.height || screenHeight
  };

  mainWindow = new BrowserWindow({
    ...savedBounds,
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
    attachWallpaper(mainWindow);
    mainWindow.setBounds(toWallpaperBounds(savedBounds));
  });

  dropDuplicateKeyInput(mainWindow);
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
