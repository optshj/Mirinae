import Store from 'electron-store';

export const store = new (Store as any).default({
  defaults: {
    'window-bounds': { width: 1280, height: 800, x: 0, y: 0 },
    'window-opacity': 1,
    'last-version': '0.0.1',
    'max-lanes': 3
  }
});
