import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'sonner/dist/styles.css';
import { posthog } from '@/shared/lib/posthog';
import { applyPreferencesToHtml, getPreference } from '@/shared/lib/preferences';

applyPreferencesToHtml();
posthog.capture('app_launched_theme', { theme: getPreference('theme') });
posthog.capture('app_launched_palette_set', { palette_set: getPreference('paletteSet') });
posthog.capture('app_launched_bg_opacity', { bg_opacity: String(getPreference('bgOpacity')) });

window.api.getAppVersion().then((appVersion) => {
  posthog.capture('app_launched', { app_version: appVersion, platform: window.api.platform });
});
window.api.onUpdateAvailable(({ currentVersion, newVersion }) => {
  posthog.capture('update_available', { current_version: currentVersion, new_version: newVersion });
});
window.api.onUpdateClickable((isExplorer: boolean) => {
  document.documentElement.classList.toggle('disable-click', !isExplorer);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
