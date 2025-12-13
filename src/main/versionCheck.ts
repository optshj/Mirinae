import { app } from 'electron';
import { store } from './store';
import semver from 'semver';
import { mainWindow } from '.';

export const checkVersionAndShowPatchNotes = () => {
    const currentVersion = app.getVersion();
    const lastVersion = store.get('last-version');

    if (!lastVersion) {
        store.set('last-version', currentVersion);
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
