import activeWindow from 'active-win';
import type { BrowserWindow } from 'electron';

let windowCheckInterval: NodeJS.Timeout | undefined;
let lastIsExplorer: boolean | undefined;

export function startActiveWindowWatcher(mainWindow: BrowserWindow) {
    if (windowCheckInterval) {
        return;
    }

    windowCheckInterval = setInterval(async () => {
        try {
            const window = await activeWindow();

            const isExplorer = process.platform === 'win32' ? window?.title === 'Program Manager' : process.platform === 'darwin' ? window?.owner?.name === 'Finder' : false;

            if (isExplorer !== lastIsExplorer) {
                lastIsExplorer = isExplorer;
                mainWindow.webContents.send('update-clickable', isExplorer);
            }
        } catch (error) {
            console.error('Failed to get active window:', error);
        }
    }, 1000);
}

export function stopActiveWindowWatcher() {
    if (windowCheckInterval) {
        clearInterval(windowCheckInterval);
        windowCheckInterval = undefined;
        lastIsExplorer = undefined;
    }
}
