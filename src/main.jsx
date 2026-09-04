import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// The path must be relative to the app, not the domain root. This app is served
// from /aldebaran-notebook/, so the old absolute '/sw.js' asked for
// aldebaran87dev.github.io/sw.js -- verified 404 -- and .catch() swallowed it,
// so the worker has never registered in production and there has been no offline
// support at all. import.meta.env.BASE_URL is vite's configured base, so this
// stays correct in dev (/) and in production (/aldebaran-notebook/).
// PROD only. In dev the build assets are unhashed source modules, and the
// worker's cache-first asset rule would serve them stale straight past Vite's
// hot reload -- verified: it cached src/App.jsx on the first dev load.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(err => console.warn('sw registration failed', err));
  });
}
