import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

export interface Api {
    startGoogleOauth: () => void;
    onGoogleOauthSuccess: (callback: (tokens: any) => void) => () => void;
    onGoogleOauthError: (callback: (error: any) => void) => () => void;
    tryAutoLogin: () => Promise<any>;
    logoutGoogleOAuth: () => Promise<boolean>;

    safeReload: () => void;
    startDragging: () => void;
    stopDragging: () => void;
    quitApp: () => void;
    setOpacity: (opacity: number) => void;
    getInitialOpacity: () => Promise<number>;

    setColorId: (color: string) => void;
    getInitialColorId: () => Promise<string>;
    onColorIdChange: (callback: (colorId: string) => void) => void;

    onUpdateClickable: (callback: (isExplorer: boolean) => void) => () => void;

    onShowPatchNotes: (callback: () => void) => () => void;
}

const api = {
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
    safeReload: () => ipcRenderer.send('safe-reload'),
    startDragging: () => ipcRenderer.send('start-dragging'),
    stopDragging: () => ipcRenderer.send('stop-dragging'),

    quitApp: () => ipcRenderer.send('quit-app'),

    setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
    getInitialOpacity: () => ipcRenderer.invoke('get-initial-opacity'),

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
    }
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
    // @ts-expect-error (define in dts)
    window.electron = electronAPI;

    window.api = api;
}
