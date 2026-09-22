import { app, Menu, nativeImage, Tray, screen } from 'electron';
import { attach, detach } from 'electron-as-wallpaper';
import { join } from 'path';
import { mainWindow } from '.';
import { toScreenBounds, toWallpaperBounds } from './wallpaperBounds';
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
    detach(mainWindow);
    mainWindow.setBounds(toScreenBounds(mainWindow.getBounds()));
  });
  contextMenu.on('menu-will-close', () => {
    // 메뉴가 열린 동안은 분리 상태 = 절대 좌표다('위치 초기화'도 여기서 절대 좌표로 들어온다).
    const bounds = mainWindow.getBounds();

    attach(mainWindow, { forwardKeyboardInput: true, forwardMouseInput: true, transparent: true });
    mainWindow.setBounds(toWallpaperBounds(bounds));
    store.set('window-bounds', bounds);
  });
}
