import { app } from 'electron';
import { store } from './store';
import semver from 'semver';
import { mainWindow } from '.';

export const checkVersionAndShowPatchNotes = () => {
    const currentVersion = app.getVersion();
    const lastVersion = store.get('last-version');

    if (!lastVersion || (semver.valid(currentVersion) && semver.valid(lastVersion) && semver.gt(currentVersion, lastVersion))) {
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('show-patch-notes');
        });

        store.set('last-version', currentVersion);
    }
};
