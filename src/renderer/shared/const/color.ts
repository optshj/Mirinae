export const COLOR_STORAGE_KEY = 'color-id';
export const COLORPALLETTE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export const PALETTE_SET_STORAGE_KEY = 'event-palette-set';
export const PALETTE_SETS = [
  { id: 'pastel', label: '파스텔' },
  { id: 'vivid', label: '비비드' },
  { id: 'muted', label: '톤다운' },
  { id: 'lavender', label: '라벤더' },
  { id: 'nebula', label: '갤럭시' },
  { id: 'jewel', label: '오페라' },
  { id: 'sakura', label: '사쿠라' },
  { id: 'deepsea', label: '바다' },
  { id: 'lemonade', label: '레모네이드' },
  { id: 'cyberpunk', label: '네온사인' }
] as const;

export type PaletteSetId = (typeof PALETTE_SETS)[number]['id'];
export const DEFAULT_PALETTE_SET: PaletteSetId = 'pastel';
