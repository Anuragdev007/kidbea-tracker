// Kidbea Tracker — Service Worker
// Caches the app shell for offline / fast reload

const CACHE = 'kidbea-v3';
const SHELL = [
  '/kidbea-tracker/',
  '/kidbea-tracker/index.html',
  '/kidbea-tracker/icon-192.png',
  '/kidbea-tracker/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for Supabase API calls; cache-first for app shell
  if (e.request.url.includes('supabase.co')) return; // always live for DB
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      // Cache CDN assets
      if (e.request.url.includes('cdn.jsdelivr') || e.request.url.includes('unpkg') || e.request.url.includes('cdnjs')) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
