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
// Service worker restored for offline support, Ted's call, after the real
// window fix landed.
//
// IT WAS BRIEFLY SUSPECTED AND IT WAS INNOCENT. The one 874 reading came from
// the single launch where no worker had registered yet, so the worker looked
// like the difference. Unregistering it and re-testing gave 812 on launch 5
// with "service worker: none" in the panel -- falsified. The window shortfall
// was iOS under-reporting its own viewport height, and it is handled in App.jsx
// by --vh-extra. Do not re-suspect the worker for a layout symptom.
//
// PROD only: in dev the modules are unhashed source files and the cache-first
// asset rule serves them straight past Vite's hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(err => console.warn('sw registration failed', err));
  });
}
