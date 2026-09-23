import { app, Menu, nativeImage, Tray, screen } from 'electron';
import { join } from 'path';
import { mainWindow } from '.';
import { toScreenBounds, toWallpaperBounds } from './wallpaperBounds';
import { store } from './store';
import { attachWallpaper, detachWallpaper } from './wallpaper';

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
        mainWindow.show();
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
          click: (): void => app.setLoginItemSettings({ openAtLogin: !autoLaunchStatus })
        }
      ]
    },
    {
      label: '위치 초기화',
      click: (): void => {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight, x: screenX, y: screenY } = primaryDisplay.workArea;
        const width = 1200;
        const height = 800;
        const x = screenX + (screenWidth - width) / 2;
        const y = screenY + (screenHeight - height) / 2;
        const bounds = {
          width,
          height,
          x: Math.round(x),
          y: Math.round(y)
        };

        mainWindow.setBounds(bounds);
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
    detachWallpaper(mainWindow);
    mainWindow.setBounds(toScreenBounds(mainWindow.getBounds()));
  });
  contextMenu.on('menu-will-close', () => {
    const bounds = mainWindow.getBounds();
    attachWallpaper(mainWindow);
    mainWindow.setBounds(toWallpaperBounds(bounds));
    store.set('window-bounds', bounds);
  });
}
