import { app } from 'electron';
import Store from 'electron-store';

// OTA 스테이징 테스트(docs/renderer-ota-plan.md 6.2)는 운영 프로필과 분리한다.
// 스토어·localStorage·단일 인스턴스 잠금이 모두 이 경로를 따르도록 스토어 생성 전에 바꾼다.
if (process.env.MIRINAE_OTA_URL) app.setPath('userData', `${app.getPath('userData')}-ota-test`);

export const store = new (Store as any).default({
  defaults: {
    'window-bounds': { width: 1280, height: 800, x: 0, y: 0 },
    'window-opacity': 1,
    'last-version': '0.0.1',
    'notifications-enabled': true,
    'notification-lead-minutes': 10,
    'renderer-ota': null,
    'legacy-storage-migrated': false
  }
});
