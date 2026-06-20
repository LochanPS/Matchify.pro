// Kill-switch service worker.
// A previous service worker intercepted fetches and trapped clients on stale
// cached builds, so new deploys never reached returning users. This worker
// takes over, deletes every cache, unregisters itself, and reloads open pages
// so each client recovers to fresh network content. No fetch handler -> all
// requests go straight to the network. The app no longer registers any worker
// (see main.jsx); the browser auto-updates existing registrations to this one,
// which then removes itself for good.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Delete all caches this origin holds
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    // Remove this service worker registration
    await self.registration.unregister();
    // Reload open tabs so they load fresh from the network (now uncontrolled)
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url).catch(() => {}));
  })());
});
