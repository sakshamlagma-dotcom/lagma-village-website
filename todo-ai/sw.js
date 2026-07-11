const CACHE = 'todo-ai-v8';
const APP_SHELL = './service-detail.html?id=chat';
const FALLBACK_PAGE = './service-detail.html';
const CORE = [
  './',
  './index.html',
  './home.html',
  './service-detail.html',
  './service-detail.html?id=chat',
  './services.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './assets/icons/logo.svg',
  './assets/icons/logo-192.png',
  './assets/icons/logo-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(serveCachedPage(request));
    return;
  }

  event.respondWith(serveCachedAsset(request));
});

async function serveCachedPage(request) {
  const cached = await caches.match(request) || await caches.match(APP_SHELL) || await caches.match(FALLBACK_PAGE) || await caches.match('./index.html');

  if (cached) {
    refreshPageCache(request);
    return cached;
  }

  const response = await fetch(request);
  await putIfTodoPage(request, response.clone());
  return response;
}

async function serveCachedAsset(request) {
  const cache = await caches.open(CACHE);
  const cached = await caches.match(request);

  if (cached) {
    refreshAssetCache(request);
    return cached;
  }

  const response = await fetch(request);
  if (isCacheableAsset(request, response)) cache.put(request, response.clone());
  return response;
}

function refreshPageCache(request) {
  fetch(request)
    .then(response => putIfTodoPage(request, response))
    .catch(() => {});
}

function refreshAssetCache(request) {
  fetch(request)
    .then(response => {
      if (!isCacheableAsset(request, response)) return;
      return caches.open(CACHE).then(cache => cache.put(request, response.clone()));
    })
    .catch(() => {});
}

async function putIfTodoPage(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return;

  const html = await response.clone().text().catch(() => '');
  if (!html.includes('TODO AI') || !html.includes('data-page=')) return;

  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
}

function isCacheableAsset(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return false;
  const type = response.headers.get('content-type') || '';
  const destination = request.destination;

  if (destination === 'style') return type.includes('text/css');
  if (destination === 'script') return type.includes('javascript') || type.includes('ecmascript');
  if (destination === 'image') return type.startsWith('image/');
  if (destination === 'manifest') return type.includes('manifest') || type.includes('json');
  if (destination === 'font') return type.includes('font');

  return !type.includes('text/html');
}