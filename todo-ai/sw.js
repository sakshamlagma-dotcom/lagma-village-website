const CACHE = 'todo-ai-v11';
const CORE = [
  './',
  './index.html',
  './home.html',
  './service-detail.html',
  './services.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './assets/icons/logo.svg',
  './assets/icons/logo-192.png',
  './assets/icons/logo-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok && response.type !== 'opaque' && isSafeToCache(request, response)) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }

        return response;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match('./service-detail.html') || caches.match('./index.html'))),
  );
});

function isSafeToCache(request, response) {
  const type = response.headers.get('content-type') || '';

  if (request.destination === 'document' || request.mode === 'navigate') {
    return type.includes('text/html');
  }

  return !type.includes('text/html');
}
