import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
  // Force fresh SW check on every launch (bypasses HTTP cache) + every 30 min for long sessions
  navigator.serviceWorker.ready.then((reg) => {
    reg.update();
    setInterval(() => reg.update(), 30 * 60 * 1000);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
