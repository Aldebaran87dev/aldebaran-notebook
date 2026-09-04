// Cache name is bumped whenever this strategy changes, so activate() below
// deletes every older cache. v1 was cache-first for EVERYTHING, which returns a
// stale index.html forever -- the page it hands back is always the previous
// deploy's. It never actually ran in production (see the registration note in
// main.jsx: it was requested from the domain root and 404'd), so nothing was
// cached by it, but do not restore that strategy.
const CACHE = 'notebook-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Writes and the GitHub API must always go to the network, untouched.
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.github.com') return;
  if (url.origin !== self.location.origin) return;

  // NAVIGATION IS NETWORK-FIRST. index.html carries the <script> tag naming the
  // current bundle, so serving it from cache pins the app to an old build. Cache
  // is the offline fallback only.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Hashed build assets are immutable -- a new build gets a new filename -- so
  // cache-first is correct and fast for them.
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
