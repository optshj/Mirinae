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
    // once: OTA 부팅 실패 후 내장 렌더러로 다시 로드할 때 패치노트가 또 뜨지 않게 한다
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('show-patch-notes');
    });

    store.set('last-version', currentVersion);
  }
};
