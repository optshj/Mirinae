import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { mainWindow } from '.';

// 업데이터는 앱 시작 직후 동작하므로 렌더러가 아직 로딩 중일 수 있다 — 로드 완료까지 전송을 미룬다
const sendToRenderer = (channel: string, payload: unknown) => {
  const send = () => mainWindow?.webContents.send(channel, payload);
  if (mainWindow?.webContents.isLoading()) {
    mainWindow.webContents.once('did-finish-load', send);
  } else {
    send();
  }
};

export const initAutoUpdater = () => {
  autoUpdater.logger = log;
  log.info('[Updater] Auto Updater Initialized');

  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoDownload = true;

  log.info('[Updater] Current version:', app.getVersion());
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', (info) => {
    log.info('[Updater] 업데이트 발견! 현재 버전:', app.getVersion(), '→ 새 버전:', info.version);
    log.debug('[Updater] 업데이트 정보:', info);

    sendToRenderer('update-available', { currentVersion: app.getVersion(), newVersion: info.version });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`[Updater] 다운로드 진행률: ${Math.floor(progressObj.percent)}%`, `(${(progressObj.transferred / 1024 / 1024).toFixed(2)}MB / ${(progressObj.total / 1024 / 1024).toFixed(2)}MB)`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Updater] 업데이트 다운로드 완료', info);
    sendToRenderer('update-downloaded', { currentVersion: app.getVersion(), newVersion: info.version });
  });

  ipcMain.on('install-update', () => {
    log.info('[Updater] 사용자 설치 승인 → 앱 종료 후 설치 시작');
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('dismiss-update', () => {
    log.info('[Updater] 사용자가 설치를 나중으로 미룸');
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[Updater] 업데이트 없음 (현재 최신 버전)');
  });

  autoUpdater.on('error', (err) => {
    log.error('[Updater] 업데이트 오류 발생:', err);
    sendToRenderer('update-error', { currentVersion: app.getVersion(), message: err.message });
  });
};
