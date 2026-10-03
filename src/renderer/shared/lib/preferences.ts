import { useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE_SET, PALETTE_SETS, PaletteSetId } from '@/shared/const/color';

interface Def<T> {
  key: string;
  default: T;
  /** 문자열을 JSON이 아니라 그대로 저장하던 키 (기존 사용자 저장값과 형식을 맞춘다) */
  raw?: true;
  valid?: (value: unknown) => boolean;
  /** 값이 정해질 때마다 <html>에 반영할 것 — CSS가 `[html.mini-view_&]` 식으로 읽는다 */
  html?: (value: T) => void;
}
const def = <T>(d: Def<T>) => d;

const root = document.documentElement;
const isBool = (v: unknown) => typeof v === 'boolean';
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

/** 렌더러 환경설정 전부. 키·기본값·<html> 반영을 여기서만 정의한다. (알림 설정은 main도 읽어야 해서 electron-store에 따로 있다) */
const defs = {
  theme: def<'dark' | 'light'>({
    key: 'theme',
    raw: true,
    default: prefersDark ? 'dark' : 'light',
    valid: (v) => v === 'dark' || v === 'light',
    html: (v) => root.classList.toggle('dark', v === 'dark')
  }),
  paletteSet: def<PaletteSetId>({
    key: 'event-palette-set',
    raw: true,
    default: DEFAULT_PALETTE_SET,
    valid: (v) => PALETTE_SETS.some((set) => set.id === v),
    html: (v) => PALETTE_SETS.forEach((set) => root.classList.toggle(`palette-${set.id}`, set.id === v))
  }),
  miniView: def({ key: 'miniView', default: false, valid: isBool, html: (v) => root.classList.toggle('mini-view', v) }),
  flipFooter: def({ key: 'flipFooter', default: false, valid: isBool, html: (v) => root.classList.toggle('flip-footer', v) }),
  bgOpacity: def({
    key: 'bgOpacity',
    default: 1,
    valid: (v) => typeof v === 'number' && v >= 0 && v <= 1,
    html: (v) => root.style.setProperty('--bg-opacity', String(v))
  }),
  showHoliday: def({ key: 'holiday', default: true, valid: isBool }),
  maxLanes: def({ key: 'max-lanes', default: 3, valid: (v) => Number.isInteger(v) && (v as number) >= 1 }),
  colorFilter: def<string[]>({ key: 'color-filter', default: [], valid: Array.isArray }),
  /** null이면 아직 미리내에서 바꾼 적이 없어 Google의 selected를 따른다 */
  visibleCalendars: def<string[] | null>({ key: 'visible-calendars', default: null, valid: Array.isArray }),
  colorLabels: def<Record<string, string>>({ key: 'color-label', default: {}, valid: (v) => typeof v === 'object' && v !== null }),
  footerColor: def({ key: 'color-id', raw: true, default: '11' })
};

type Defs = typeof defs;
export type PreferenceName = keyof Defs;
type State = { [K in PreferenceName]: Defs[K]['default'] };
type Value<K extends PreferenceName> = State[K];

function read<T>(d: Def<T>): T {
  try {
    const raw = localStorage.getItem(d.key);
    if (raw === null) return d.default;
    const value = d.raw ? raw : JSON.parse(raw);
    return !d.valid || d.valid(value) ? value : d.default;
  } catch {
    return d.default;
  }
}

const state = Object.fromEntries(Object.entries(defs).map(([name, d]) => [name, read(d as Def<unknown>)])) as State;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPreference = <K extends PreferenceName>(name: K): Value<K> => state[name];

export function setPreference<K extends PreferenceName>(name: K, value: Value<K>) {
  const d = defs[name] as Def<Value<K>>;
  state[name] = value;
  try {
    localStorage.setItem(d.key, d.raw ? String(value) : JSON.stringify(value));
  } catch {
    // 저장 실패해도 이번 실행 동안은 메모리 값으로 동작한다
  }
  d.html?.(value);
  listeners.forEach((listener) => listener());
}

export function usePreference<K extends PreferenceName>(name: K) {
  const value = useSyncExternalStore(subscribe, () => state[name]);
  return [value, (next: Value<K>) => setPreference(name, next)] as const;
}

/** 첫 렌더 전에 1회 — 저장된 설정을 <html>에 반영해 깜빡임 없이 시작한다 */
export function applyPreferencesToHtml() {
  (Object.keys(defs) as PreferenceName[]).forEach((name) => (defs[name] as Def<unknown>).html?.(state[name]));
}
