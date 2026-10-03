import { describe, it, expect, beforeEach, vi } from 'vitest';

// 모듈 로드 시점에 localStorage를 읽으므로 매번 새로 불러온다
const load = async () => {
  vi.resetModules();
  return import('./preferences');
};

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('기존 저장 형식을 그대로 읽는다', async () => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('event-palette-set', 'vivid');
    localStorage.setItem('color-id', '3');
    localStorage.setItem('miniView', 'true');
    localStorage.setItem('holiday', 'false');
    localStorage.setItem('max-lanes', '5');
    localStorage.setItem('bgOpacity', '0.45');
    localStorage.setItem('color-filter', '["1","4"]');
    localStorage.setItem('visible-calendars', '["a@group"]');
    localStorage.setItem('color-label', '{"1":"운동"}');

    const { getPreference } = await load();
    expect(getPreference('theme')).toBe('dark');
    expect(getPreference('paletteSet')).toBe('vivid');
    expect(getPreference('footerColor')).toBe('3');
    expect(getPreference('miniView')).toBe(true);
    expect(getPreference('showHoliday')).toBe(false);
    expect(getPreference('maxLanes')).toBe(5);
    expect(getPreference('bgOpacity')).toBe(0.45);
    expect(getPreference('colorFilter')).toEqual(['1', '4']);
    expect(getPreference('visibleCalendars')).toEqual(['a@group']);
    expect(getPreference('colorLabels')).toEqual({ '1': '운동' });
  });

  it('없거나 깨진 값은 기본값으로', async () => {
    localStorage.setItem('event-palette-set', 'removed-palette');
    localStorage.setItem('max-lanes', '0');
    localStorage.setItem('color-filter', '{broken');

    const { getPreference } = await load();
    expect(getPreference('paletteSet')).toBe('pastel');
    expect(getPreference('maxLanes')).toBe(3);
    expect(getPreference('colorFilter')).toEqual([]);
    expect(getPreference('showHoliday')).toBe(true);
    expect(getPreference('visibleCalendars')).toBeNull();
  });

  it('저장 시 같은 형식으로 쓰고 <html>에 반영한다', async () => {
    const { setPreference } = await load();
    setPreference('theme', 'dark');
    setPreference('miniView', true);
    setPreference('paletteSet', 'nebula');
    setPreference('colorFilter', ['2']);

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('miniView')).toBe('true');
    expect(localStorage.getItem('event-palette-set')).toBe('nebula');
    expect(localStorage.getItem('color-filter')).toBe('["2"]');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('mini-view')).toBe(true);
    expect(document.documentElement.classList.contains('palette-nebula')).toBe(true);
  });
});
