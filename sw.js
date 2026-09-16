const CACHE = 'sundae-v16';
const ASSETS = [
  '/sundae-run-web/',
  '/sundae-run-web/index.html',
  '/sundae-run-web/manifest.json',
  '/sundae-run-web/icon.png',
  '/sundae-run-web/sw.js',
  '/sundae-run-web/data/socal-ice-cream.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Keep map tiles, fonts, and other third-party responses out of the private
  // journal's app-shell cache.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || (e.request.mode === 'navigate'
          ? caches.match('/sundae-run-web/index.html')
          : Response.error())))
  );
});
