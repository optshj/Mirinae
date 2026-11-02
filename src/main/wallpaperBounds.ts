import { screen, type Rectangle } from 'electron';

const shiftByVirtualOrigin = (bounds: Rectangle, sign: 1 | -1): Rectangle => {
  const origins = screen.getAllDisplays().map((display) => screen.dipToScreenRect(null, display.bounds));
  const minX = Math.min(...origins.map((origin) => origin.x));
  const minY = Math.min(...origins.map((origin) => origin.y));
  const physical = screen.dipToScreenRect(null, bounds);

  return screen.screenToDipRect(null, { ...physical, x: physical.x + sign * minX, y: physical.y + sign * minY });
};

/** 저장된 좌표가 현재 모니터 밖(듀얼 → 단일)이면 가장 가까운 모니터 작업영역 안으로 당긴다 */
export const clampToDisplay = (bounds: Rectangle): Rectangle => {
  const area = screen.getDisplayMatching(bounds).bounds;
  const width = Math.min(bounds.width, area.width);
  const height = Math.min(bounds.height, area.height);
  const x = Math.min(Math.max(bounds.x, area.x), area.x + area.width - width);
  const y = Math.min(Math.max(bounds.y, area.y), area.y + area.height - height);
  return { x, y, width, height };
};

/** 부착 해제 직후: 가상 화면 원점 기준 좌표 -> 화면 절대 좌표 */
export const toScreenBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, 1);
/** 부착 직후: 화면 절대 좌표 -> 가상 화면 원점 기준 좌표 */
export const toWallpaperBounds = (bounds: Rectangle) => shiftByVirtualOrigin(bounds, -1);
