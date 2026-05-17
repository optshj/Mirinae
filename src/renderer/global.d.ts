import type { ElectronAPI } from '@electron-toolkit/preload';
import type { Api } from '../../preload';

declare global {
  interface Window {
    api: Api;
    electron: ElectronAPI;
  }
}
