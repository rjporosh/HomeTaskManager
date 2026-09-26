const CACHE_NAME = 'home-task-manager-v1';

const ASSETS = [
  './',
  './index.html',
  './home-task-manager.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {})
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      // Use cached version first.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network.
      return fetch(event.request)
        .then((networkResponse) => {

          // Cache successful responses for future offline use.
          if (networkResponse && networkResponse.ok) {
            const responseClone = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            }).catch(() => {});
          }

          return networkResponse;
        })
        .catch(() => {

          // If completely offline and navigation fails,
          // return the cached application shell.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('', {
            status: 503,
            statusText: 'Offline'
          });
        });
    })
  );
});