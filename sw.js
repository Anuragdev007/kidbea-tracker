// Kidbea Tracker — Service Worker
// Network-first for app pages, cache-first for CDN assets

const CACHE = 'kidbea-v4';
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
  // Always go live for Supabase API calls
  if (e.request.url.includes('supabase.co')) return;

  // Network-first for app pages (index.html etc) — always serve latest version
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for CDN/static assets
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (e.request.url.includes('cdn.jsdelivr') || e.request.url.includes('unpkg') || e.request.url.includes('cdnjs')) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
