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
// SERVICE WORKER REGISTRATION IS OFF, and this is a live experiment.
//
// Every measurement of the window on the phone, in order:
//
//   8:19  manifest fullscreen, FIRST launch after install, no SW yet -> 874
//   8:40  manifest fullscreen, later launch, SW active               -> 812
//   8:48  no manifest at all,  later launch, SW active               -> 812
//   8:58  manifest fullscreen, launch 4,     SW active               -> 812
//
// The only 874 is the one launch where no service worker existed yet. The
// manifest was fullscreen for both 874 and 812, and removing the manifest
// changed nothing -- so display is not what decides this. What separates the
// single good reading from every bad one is whether a service worker was
// controlling the navigation.
//
// So: do not register, and actively unregister anything already installed,
// because a registered worker keeps controlling launches until it is removed.
// If 874 then holds across several launches, the worker was the cost and this
// stays off. If it still reads 812, the worker is cleared and the next theory
// gets tested without it in the way.
//
// Cost while off: no offline support. Updates are unaffected -- they were
// network-first anyway.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => Promise.all(regs.map(r => r.unregister())))
    .then(() => caches?.keys?.().then(ks => Promise.all(ks.map(k => caches.delete(k)))))
    .catch(() => {});
}
