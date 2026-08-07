import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'sonner/dist/styles.css';
import { posthog } from '@/shared/lib/posthog';
import { DEFAULT_PALETTE_SET, PALETTE_SET_STORAGE_KEY } from '@/shared/const/color';

if (localStorage.getItem('flipFooter') === 'true') {
  document.documentElement.classList.add('flip-footer');
}

const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
if (isDark) {
  document.documentElement.classList.add('dark');
}
posthog.capture('app_launched_theme', { theme: isDark ? 'dark' : 'light' });

const paletteSet = localStorage.getItem(PALETTE_SET_STORAGE_KEY) ?? DEFAULT_PALETTE_SET;
document.documentElement.classList.add(`palette-${paletteSet}`);
posthog.capture('app_launched_palette_set', { palette_set: paletteSet });

if (localStorage.getItem('miniView') === 'true') {
  document.documentElement.classList.add('mini-view');
}

window.api.onUpdateClickable((isExplorer: boolean) => {
  document.documentElement.classList.toggle('disable-click', !isExplorer);
});
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
