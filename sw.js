const CACHE = "lagma-village-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./services.html",
  "./online-services.html",
  "./gallery.html",
  "./notification.html",
  "./style.css?v=7",
  "./web.js?v=5",
  "./analytics.js?v=1",
  "./manifest.webmanifest?v=4",
  "./sj-logo.svg",
  "./mithila-pattern.svg",
  "./icons/lagma-icon-192.png",
  "./icons/lagma-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
