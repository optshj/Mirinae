import { contextBridge, ipcRenderer } from 'electron';

// 설정 이관(docs/renderer-ota-plan.md 2.2). 앱 코드보다 먼저 실행돼야 하므로 최상단에 둔다.
// 재시도할 때 사용자가 새 origin에서 바꾼 값을 덮지 않도록 없는 키만 넣는다.
try {
  const legacyStorage: Array<[string, string]> | null = ipcRenderer.sendSync('take-legacy-storage');
  if (legacyStorage) {
    for (const [key, value] of legacyStorage) if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    ipcRenderer.send('legacy-storage-applied');
  }
} catch (error) {
  console.error('설정 이관 실패', error);
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UpdateInfo {
  currentVersion: string;
  newVersion: string;
}

export interface Api {
  platform: string;
  rendererReady: () => void;

  openExternal: (url: string) => void;
  getAppVersion: () => Promise<string>;

  loginGoogleOAuth: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  logoutGoogleOAuth: () => Promise<boolean>;
  googleRequest: (url: string, init?: { method?: string; body?: string }) => Promise<{ status: number; body: unknown }>;
  onAuthExpired: (callback: () => void) => () => void;

  startDragging: (options?: { resizable?: boolean }) => void;
  stopDragging: () => Promise<WindowBounds>;

  getNotificationsEnabled: () => Promise<boolean>;
  setNotificationsEnabled: (value: boolean) => void;
  getNotificationLeadMinutes: () => Promise<number>;
  setNotificationLeadMinutes: (value: number) => void;
  showNotification: (payload: { title: string; body: string }) => void;

  quitApp: () => void;

  setOpacity: (opacity: number) => void;
  getInitialOpacity: () => Promise<number>;

  onUpdateClickable: (callback: (isExplorer: boolean) => void) => () => void;

  onShowPatchNotes: (callback: () => void) => () => void;

  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
  installUpdate: () => void;
  dismissUpdate: () => void;
}

const api = {
  platform: process.platform,
  rendererReady: () => ipcRenderer.send('renderer-ready'),

  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  loginGoogleOAuth: () => ipcRenderer.invoke('login-google-oauth'),
  logoutGoogleOAuth: () => ipcRenderer.invoke('logout-google-oauth'),
  restoreSession: () => ipcRenderer.invoke('restore-session'),
  googleRequest: (url: string, init?: { method?: string; body?: string }) => ipcRenderer.invoke('google-request', url, init),
  onAuthExpired: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('auth-expired', listener);
    return () => ipcRenderer.removeListener('auth-expired', listener);
  },

  startDragging: (options) => ipcRenderer.send('start-dragging', options),
  stopDragging: () => ipcRenderer.invoke('stop-dragging'),

  quitApp: () => ipcRenderer.send('quit-app'),

  setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
  getInitialOpacity: () => ipcRenderer.invoke('get-initial-opacity'),

  getNotificationsEnabled: () => ipcRenderer.invoke('get-notifications-enabled'),
  setNotificationsEnabled: (value: boolean) => ipcRenderer.send('set-notifications-enabled', value),
  getNotificationLeadMinutes: () => ipcRenderer.invoke('get-notification-lead-minutes'),
  setNotificationLeadMinutes: (value: number) => ipcRenderer.send('set-notification-lead-minutes', value),
  showNotification: (payload: { title: string; body: string }) => ipcRenderer.send('show-notification', payload),

  onShowPatchNotes: (callback) => {
    const listener = (_, ...args) => callback(...args);
    ipcRenderer.on('show-patch-notes', listener);
    return () => ipcRenderer.removeListener('show-patch-notes', listener);
  },

  onUpdateClickable: (callback: (isExplorer: boolean) => void) => {
    const listener = (_, isExplorer: boolean) => callback(isExplorer);
    ipcRenderer.on('update-clickable', listener);
    return () => ipcRenderer.removeListener('update-clickable', listener);
  },

  onUpdateAvailable: (callback) => {
    const listener = (_, info) => callback(info);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (_, info) => callback(info);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
  installUpdate: () => ipcRenderer.send('install-update'),
  dismissUpdate: () => ipcRenderer.send('dismiss-update')
};

// Use `contextBridge` to expose Electron APIs to the renderer only if
// context isolation is enabled, otherwise just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
