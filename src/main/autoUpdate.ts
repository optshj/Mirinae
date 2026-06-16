import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { posthog, getDistinctId } from './posthog';
import { mainWindow } from '.';

export const initAutoUpdater = () => {
  autoUpdater.logger = log;
  log.info('[Updater] Auto Updater Initialized');

  autoUpdater.autoInstallOnAppQuit = false;
  // 업데이트 발견 시 사용자 승인 없이 즉시 다운로드 시작
  autoUpdater.autoDownload = true;

  log.info('[Updater] Current version:', app.getVersion());
  autoUpdater.checkForUpdates();

  // 업데이트 발견 시: 승인 절차 없이 백그라운드 다운로드 시작
  autoUpdater.on('update-available', (info) => {
    log.info('[Updater] 업데이트 발견! 현재 버전:', app.getVersion(), '→ 새 버전:', info.version);
    log.debug('[Updater] 업데이트 정보:', info);

    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_available',
      properties: { current_version: app.getVersion(), new_version: info.version }
    });
    // autoDownload: true 이므로 별도 호출 없이 자동으로 다운로드가 시작됨
  });

  // 다운로드 진행 상황 로그
  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`[Updater] 다운로드 진행률: ${Math.floor(progressObj.percent)}%`, `(${(progressObj.transferred / 1024 / 1024).toFixed(2)}MB / ${(progressObj.total / 1024 / 1024).toFixed(2)}MB)`);
  });

  // 업데이트 다운로드 완료: 렌더러에 설치 승인 배너 표시 요청
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

    // 렌더러가 아직 로딩 중이면 로드 완료 후 전송, 아니면 즉시 전송
    if (mainWindow?.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', sendUpdateReady);
    } else {
      sendUpdateReady();
    }
  });

  // 사용자가 렌더러 배너에서 '설치'를 누르면 설치 진행
  ipcMain.on('install-update', () => {
    log.info('[Updater] 사용자 설치 승인 → 앱 종료 후 설치 시작');
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_accepted',
      properties: { current_version: app.getVersion() }
    });
    autoUpdater.quitAndInstall();
  });

  // 사용자가 '나중에'를 누르면 설치를 보류 (다음 앱 실행 시 다시 안내)
  ipcMain.on('dismiss-update', () => {
    log.info('[Updater] 사용자가 설치를 나중으로 미룸');
    posthog.capture({
      distinctId: getDistinctId(),
      event: 'update_declined',
      properties: { current_version: app.getVersion() }
    });
  });

  // 업데이트 없음
  autoUpdater.on('update-not-available', () => {
    log.info('[Updater] 업데이트 없음 (현재 최신 버전)');
  });

  // 에러 처리
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
