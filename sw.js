const CACHE = 'sundae-v1';
const ASSETS = [
  '/sundae-run-web/',
  '/sundae-run-web/index.html',
  '/sundae-run-web/manifest.json',
  '/sundae-run-web/icon.png',
  '/sundae-run-web/sw.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached ?? fetch(e.request))
  );
});
