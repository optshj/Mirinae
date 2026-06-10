import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'sonner/dist/styles.css';
import '@/shared/lib/posthog';
import * as Sentry from '@sentry/electron/renderer';

Sentry.init({
  dsn: 'https://9bb1d0296eb0c053e64c5aaca6ef314f@o4511528205615104.ingest.us.sentry.io/4511528207122432',
  integrations: [
    Sentry.browserTracingIntegration(), // 성능 모니터링
    Sentry.replayIntegration() // 세션 리플레이
  ],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0
});

if (localStorage.getItem('flipFooter') === 'true') {
  document.documentElement.classList.add('flip-footer');
}

window.api.onUpdateClickable((isExplorer: boolean) => {
  document.documentElement.classList.toggle('disable-click', !isExplorer);
});
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
