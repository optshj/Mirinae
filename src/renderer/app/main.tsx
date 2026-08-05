import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import 'sonner/dist/styles.css';
import '@/shared/lib/posthog';

if (localStorage.getItem('flipFooter') === 'true') {
  document.documentElement.classList.add('flip-footer');
}

if (localStorage.getItem('miniView') === 'true') {
  document.documentElement.classList.add('mini-view');
}

window.api.onUpdateClickable((isExplorer: boolean) => {
  document.documentElement.classList.toggle('disable-click', !isExplorer);
});
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
