import { app, Menu, nativeImage, Tray } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import { join } from 'path';
import { mainWindow } from '.';
import { store } from './store';

export function initTray() {
    const iconPath = app.isPackaged ? join(process.resourcesPath, 'resources/icon.png') : join(__dirname, '../../resources/icon.png');
    const image = nativeImage.createFromPath(iconPath);
    const tray = new Tray(image);
    const autoLaunchStatus = app.getLoginItemSettings().openAtLogin;
    const contextMenu = Menu.buildFromTemplate([
        { label: `현재버전 : ${app.getVersion()}` },
        { type: 'separator' },
        {
            label: '열기',
            click: (): void => {
                mainWindow?.show();
            }
        },
        { type: 'separator' },
        {
            label: '시작 설정',
            submenu: [
                {
                    label: '로그인 시 미리내 실행',
                    type: 'checkbox',
                    checked: autoLaunchStatus,
                    click: (): void => {
                        app.setLoginItemSettings({ openAtLogin: !autoLaunchStatus });
                    }
                }
            ]
        },
        {
            label: '위치 초기화',
            click: (): void => {
                store.set('window-bounds', { width: 1200, height: 800, x: 0, y: 0 });
                mainWindow.setBounds({ width: 1200, height: 800, x: 0, y: 0 });
                store.set('window-opacity', 1);
                mainWindow.setOpacity(1);
            }
        },
        { type: 'separator' },
        {
            label: '미리내 종료',
            role: 'quit'
        }
    ]);

    tray.setToolTip('미리내');
    tray.setContextMenu(contextMenu);

    contextMenu.on('menu-will-show', () => {
        detach(mainWindow);
    });
    contextMenu.on('menu-will-close', () => {
        attach(mainWindow, {
            forwardKeyboardInput: true,
            forwardMouseInput: true
        });
    });
}
