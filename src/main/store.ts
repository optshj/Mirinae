import Store from 'electron-store';

export const store = new (Store as any).default({
  defaults: {
    'window-bounds': { width: 1280, height: 800, x: null, y: null },
    'window-opacity': 1,
    'last-version': '0.0.1'
  }
});
