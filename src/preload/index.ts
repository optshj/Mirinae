import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

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
  openExternal: (url: string) => void;
  getAppVersion: () => Promise<string>;
  startGoogleOauth: () => void;
  onGoogleOauthSuccess: (callback: (tokens: any) => void) => () => void;
  onGoogleOauthError: (callback: (error: any) => void) => () => void;
  refreshToken: () => Promise<any>;
  logoutGoogleOAuth: () => Promise<boolean>;

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
  onUpdateError: (callback: (info: { currentVersion: string; message: string }) => void) => () => void;
  installUpdate: () => void;
  dismissUpdate: () => void;
}

const api = {
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  startGoogleOauth: () => ipcRenderer.send('start-google-oauth'),

  onGoogleOauthSuccess: (callback) => {
    const listener = (_, ...args) => callback(...args);
    ipcRenderer.on('google-oauth-token', listener);
    return () => ipcRenderer.removeListener('google-oauth-token', listener);
  },
  onGoogleOauthError: (callback) => {
    const listener = (_, ...args) => callback(...args);
    ipcRenderer.on('google-oauth-error', listener);
    return () => ipcRenderer.removeListener('google-oauth-error', listener);
  },

  refreshToken: () => ipcRenderer.invoke('try-auto-login'),

  logoutGoogleOAuth: () => ipcRenderer.invoke('logout-google-oauth'),

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
    ipcRenderer.removeListener('update-clickable', listener);
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
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
