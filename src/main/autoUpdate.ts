import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { posthog, getDistinctId } from './posthog';
import { mainWindow } from '.';

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

    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_available',
      properties: { current_version: app.getVersion(), new_version: info.version }
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`[Updater] 다운로드 진행률: ${Math.floor(progressObj.percent)}%`, `(${(progressObj.transferred / 1024 / 1024).toFixed(2)}MB / ${(progressObj.total / 1024 / 1024).toFixed(2)}MB)`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('[Updater] 업데이트 다운로드 완료', info);
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_downloaded',
      properties: { new_version: info.version }
    });

    const sendUpdateReady = () => {
      mainWindow?.webContents.send('update-downloaded', {
        currentVersion: app.getVersion(),
        newVersion: info.version
      });
    };

    if (mainWindow?.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', sendUpdateReady);
    } else {
      sendUpdateReady();
    }
  });

  ipcMain.on('install-update', () => {
    log.info('[Updater] 사용자 설치 승인 → 앱 종료 후 설치 시작');
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_accepted',
      properties: { current_version: app.getVersion() }
    });
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('dismiss-update', () => {
    log.info('[Updater] 사용자가 설치를 나중으로 미룸');
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_declined',
      properties: { current_version: app.getVersion() }
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[Updater] 업데이트 없음 (현재 최신 버전)');
  });

  autoUpdater.on('error', (err) => {
    log.error('[Updater] 업데이트 오류 발생:', err);
    posthog.captureException(err, getDistinctId(), { context: 'auto_updater' });
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_error',
      properties: { error: err.message }
    });
  });
};
