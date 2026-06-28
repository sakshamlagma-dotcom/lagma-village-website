const CACHE = "lagma-village-v33";
const ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./services.html",
  "./online-services.html",
  "./gallery.html",
  "./upload.html",
  "./notification.html",
  "./kissan-help/",
  "./kissan-help/index.html",
  "./kissan-help/mausam.html",
  "./kissan-help/styles.css?v=4",
  "./kissan-help/app.js?v=3",
  "./kissan-help/mausam.css?v=1",
  "./kissan-help/mausam.js?v=2",
  "./style.css?v=14",
  "./gallery.css?v=6",
  "./upload.css?v=1",
  "./web.js?v=23",
  "./gallery.js?v=7",
  "./upload.js?v=1",
  "./firebase-config.js?v=8",
  "./analytics.js?v=3",
  "./manifest.webmanifest?v=6",
  "./sj-logo.webp",
  "./a.webp",
  "./b.webp",
  "./c.webp",
  "./school-service.webp",
  "./temple.webp",
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

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok || response.type === "opaque") {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
