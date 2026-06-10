import { app, BrowserWindow, screen } from 'electron';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { attach } from 'electron-as-wallpaper';
import AutoLaunch from 'auto-launch';
import { join } from 'path';
import { initTray } from './tray';
import { initAutoUpdater } from './autoUpdate';
import { registerIPCHandlers } from './ipcHandler';
import { store } from './store';
import { checkVersionAndShowPatchNotes } from './versionCheck';
import { startActiveWindowWatcher, stopActiveWindowWatcher } from './activeWindow';
import * as Sentry from '@sentry/electron/main';
import { posthog, getDistinctId, shutdownPostHog } from './posthog';

const SERVICE_NAME = 'Mirinae';

export let mainWindow: BrowserWindow;
let isWindowAttached = false;

// Enable auto launch on system startup
new AutoLaunch({
  name: SERVICE_NAME,
  path: process.execPath
}).enable();

// Initialize Sentry for error tracking
Sentry.init({
  dsn: 'https://e14a01e7695b60bc88127406d382c174@o4511528205615104.ingest.us.sentry.io/4511528463630336',
  tracesSampleRate: 1.0,
  integrations: [Sentry.startupTracingIntegration()],
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
  const savedOpacity = store.get('window-opacity');

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
    mainWindow.setOpacity(savedOpacity);
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mirinae');
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));

  createWindow();
  initTray();
  initAutoUpdater();
  registerIPCHandlers();
  checkVersionAndShowPatchNotes();
  startActiveWindowWatcher(mainWindow);

  posthog.capture({
    distinctId: getDistinctId(),
    event: 'app_launched',
    properties: {
      app_version: app.getVersion(),
      platform: process.platform
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopActiveWindowWatcher();
  if (process.platform !== 'darwin') {
    shutdownPostHog().finally(() => app.quit());
  }
});
