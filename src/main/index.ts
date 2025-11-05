import { app, BrowserWindow, screen } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { attach } from 'electron-as-wallpaper'
import AutoLaunch from 'auto-launch'
import { join } from 'path'
import { initTray } from './tray'
import { initAutoUpdater } from './autoUpdate'
import { registerIPCHandlers } from './ipcHandler'
import { store } from './store'
import { checkVersionAndShowPatchNotes } from './versionCheck'
import { initialize } from '@aptabase/electron/main'
import activeWindow from 'active-win'

const SERVICE_NAME = 'Mirinae'

export let mainWindow: BrowserWindow

const myAppLauncher = new AutoLaunch({
    name: SERVICE_NAME,
    path: process.execPath
})
myAppLauncher.enable()
initialize('A-US-3842104393')

function createWindow(): void {
    const { height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
    const savedBounds = store.get('window-bounds')
    const savedOpacity = store.get('window-opacity')

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
            sandbox: false,
            backgroundThrottling: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        if (!(mainWindow as any)._isAttached) {
            attach(mainWindow, {
                forwardMouseInput: true,
                forwardKeyboardInput: true
            })
            ;(mainWindow as any)._isAttached = true
        }

        mainWindow.setOpacity(savedOpacity)
        mainWindow.setMenu(null)
        mainWindow.show()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.mirinae')
    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

    createWindow()
    initTray()
    initAutoUpdater()
    registerIPCHandlers()
    checkVersionAndShowPatchNotes()
    setInterval(async () => {
        const window = await activeWindow()
        const isExplorer = window?.title === 'Program Manager'
        mainWindow.webContents.send('update-clickable', isExplorer)
    }, 500)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
