// Minimal service worker — satisfies PWA installability on all Chrome versions.
// Pass-through fetch: no caching, all requests go to network as normal.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));
