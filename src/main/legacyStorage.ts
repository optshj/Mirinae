// file:// → mirinae://app origin 변경에 따른 localStorage 이관 (docs/renderer-ota-plan.md 2.2)
// v1.0.0 미만에서 바로 올라오는 업그레이드를 지원하는 동안 유지한다.
import { app, BrowserWindow, ipcMain, net, protocol } from 'electron';
import { is } from '@electron-toolkit/utils';
import log from 'electron-log';
import { writeFile } from 'fs/promises';
import { join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { isTrustedSender } from './ipcHandler';
import { store } from './store';

// 기존 앱이 loadFile로 띄우던 페이지. 설치 경로가 같으므로 localStorage도 정확히 이 URL에 있다
const LEGACY_PAGE = join(__dirname, '../renderer/index.html');

let legacyEntries: Array<[string, string]> | null = null;

const isLegacyPage = (url: string) => {
  try {
    return normalize(fileURLToPath(url)).toLowerCase() === normalize(LEGACY_PAGE).toLowerCase();
  } catch {
    return false;
  }
};

// mainWindow를 만든 뒤, 렌더러를 로드하기 전에 호출한다 (창이 없을 때 숨김 창을 닫으면 앱이 종료된다)
export async function migrateLegacyStorage() {
  ipcMain.on('take-legacy-storage', (event) => {
    event.returnValue = isTrustedSender(event) ? legacyEntries : null;
  });
  // ACK를 받은 뒤에만 완료로 기록한다. 중간에 끊기면 다음 실행에서 처음부터 다시 한다
  ipcMain.on('legacy-storage-applied', (event) => {
    if (!isTrustedSender(event) || !legacyEntries) return;
    legacyEntries = null;
    store.set('legacy-storage-migrated', true);
    log.info('[LegacyStorage] 이관 완료');
  });

  if (store.get('legacy-storage-migrated') || (is.dev && process.env['ELECTRON_RENDERER_URL'])) return;

  let reader: BrowserWindow | undefined;
  try {
    // 그 URL만 빈 문서로 응답한다. 앱 코드·분석 이벤트·API 호출 없이 origin만 같은 문서가 뜬다
    protocol.handle('file', (request) => {
      if (isLegacyPage(request.url)) return new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } });
      return net.fetch(request, { bypassCustomProtocolHandlers: true });
    });
    reader = new BrowserWindow({ show: false });
    await reader.loadFile(LEGACY_PAGE);
    const entries: Array<[string, string]> = await reader.webContents.executeJavaScript('Object.entries(localStorage)');
    await writeFile(join(app.getPath('userData'), 'legacy-storage-backup.json'), JSON.stringify(entries));
    legacyEntries = entries;
    log.info(`[LegacyStorage] 기존 localStorage 키 ${entries.length}개를 읽음`);
  } catch (error) {
    log.error('[LegacyStorage] 읽기 실패, 다음 실행에서 재시도', error);
  } finally {
    reader?.destroy();
    if (protocol.isProtocolHandled('file')) protocol.unhandle('file');
  }
}
