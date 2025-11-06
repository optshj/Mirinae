import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'
import 'sonner/dist/styles.css'

window.api.onUpdateClickable((isExplorer) => {
    document.documentElement.classList.toggle('disable-click', !isExplorer)
})
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />)
