import { app } from 'electron';
import { store } from './store';
import semver from 'semver';
import { mainWindow } from '.';

export const checkVersionAndShowPatchNotes = () => {
    const currentVersion = app.getVersion();
    const lastVersion = store.get('last-version');

    if (!lastVersion) {
        store.set('last-version', currentVersion);
        console.log('최초 실행입니다. 패치 노트 없이 현재 버전 저장.');
        return;
    }

    const isNewVersion = semver.valid(currentVersion) && semver.valid(lastVersion) && semver.gt(currentVersion, lastVersion);

    if (isNewVersion) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('show-patch-notes');
        });

        store.set('last-version', currentVersion);
    }
};
