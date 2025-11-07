import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

export const initAutoUpdater = () => {
    let shouldInstallOnDownload = false;

    autoUpdater.logger = log;
    log.info('[Updater] 자동 업데이트 초기화 시작');

    autoUpdater.autoInstallOnAppQuit = false;

    // 업데이트 체크 시작
    log.info('[Updater] 업데이트 체크 시작 (현재 버전:', app.getVersion(), ')');
    autoUpdater.checkForUpdatesAndNotify();

    // 업데이트 발견 시
    autoUpdater.on('update-available', (info) => {
        log.info('[Updater] 업데이트 발견! 현재 버전:', app.getVersion(), '→ 새 버전:', info.version);
        log.debug('[Updater] 업데이트 정보:', info);

        const message = ['업데이트 발견!', `${app.getVersion()} → ${info.version}`, '', '최신 버전이 나왔습니다. 지금 업데이트할까요?'].join('\n');

        dialog
            .showMessageBox({
                type: 'info',
                title: '업데이트 알림',
                message,
                buttons: ['지금 설치', '나중에'],
                defaultId: 0,
                cancelId: 1
            })
            .then((result) => {
                log.info('[Updater] 사용자 선택 결과:', result.response === 0 ? '지금 설치' : '나중에');
                if (result.response === 0) {
                    shouldInstallOnDownload = true;
                    log.info('[Updater] 업데이트 다운로드 시작');
                    autoUpdater.downloadUpdate();
                } else {
                    shouldInstallOnDownload = false;
                }
            });
    });

    // 다운로드 진행 상황 로그
    autoUpdater.on('download-progress', (progressObj) => {
        log.info(`[Updater] 다운로드 진행률: ${Math.floor(progressObj.percent)}%`, `(${(progressObj.transferred / 1024 / 1024).toFixed(2)}MB / ${(progressObj.total / 1024 / 1024).toFixed(2)}MB)`);
    });

    // 업데이트 다운로드 완료
    autoUpdater.on('update-downloaded', (info) => {
        log.info('[Updater] 업데이트 다운로드 완료', info);
        if (shouldInstallOnDownload) {
            log.info('[Updater] 앱 종료 후 업데이트 설치 시작');
            autoUpdater.quitAndInstall();
        }
    });

    // 업데이트 없음
    autoUpdater.on('update-not-available', () => {
        log.info('[Updater] 업데이트 없음 (현재 최신 버전)');
    });

    // 에러 처리
    autoUpdater.on('error', (err) => {
        log.error('[Updater] 업데이트 오류 발생:', err);
        console.error('업데이트 오류:', err);
    });
};
