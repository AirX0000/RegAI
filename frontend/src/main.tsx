import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import ErrorBoundary from './components/ErrorBoundary'
import { initClientCodeProtection } from './lib/codeProtection'

// Initialize client-side anti-inspection guard (blocks F10, F12, Ctrl+U, right-click inspect)
initClientCodeProtection();

// Auto-reload if Vite chunk preload fails due to new deployment
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error (stale chunk after deploy). Auto-reloading...', event);
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
