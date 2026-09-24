import { attach, detach } from 'electron-as-wallpaper';
import type { BrowserWindow } from 'electron';

let isAttached = false;

export function attachWallpaper(window: BrowserWindow) {
  if (isAttached) return;
  attach(window, { forwardMouseInput: true, forwardKeyboardInput: true, transparent: true });
  isAttached = true;
}

export function detachWallpaper(window: BrowserWindow) {
  if (!isAttached) return;
  detach(window);
  isAttached = false;
}
