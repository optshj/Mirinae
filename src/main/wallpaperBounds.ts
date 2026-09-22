import { screen, type Rectangle } from 'electron';

const shiftByVirtualOrigin = (bounds: Rectangle, sign: 1 | -1): Rectangle => {
  const origins = screen.getAllDisplays().map((display) => screen.dipToScreenRect(null, display.bounds));
  const minX = Math.min(...origins.map((origin) => origin.x));
  const minY = Math.min(...origins.map((origin) => origin.y));
  const physical = screen.dipToScreenRect(null, bounds);

  return screen.screenToDipRect(null, { ...physical, x: physical.x + sign * minX, y: physical.y + sign * minY });
};

/** 부착 해제 직후: 가상 화면 원점 기준 좌표 -> 화면 절대 좌표 */
export const toScreenBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, 1);
/** 부착 직후: 화면 절대 좌표 -> 가상 화면 원점 기준 좌표 */
export const toWallpaperBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, -1);
