const CACHE = "lagma-village-v58";
const ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./services.html",
  "./online-services.html",
  "./gallery.html",
  "./upload.html",
  "./notification.html",
  "./notice-data.js?v=2",
  "./notice-board.js?v=3",
  "./kissan-help/",
  "./kissan-help/index.html",
  "./kissan-help/mausam.html",
  "./kissan-help/styles.css?v=7",
  "./kissan-help/app.js?v=3",
  "./kissan-help/mausam.css?v=2",
  "./kissan-help/mausam.js?v=3",
  "./weather-utils.js?v=1",
  "./weather-home.js?v=5",
  "./style.css?v=24",
  "./gallery.css?v=8",
  "./upload.css?v=2",
  "./web.js?v=30",
  "./gallery.js?v=9",
  "./upload.js?v=1",
  "./firebase-config.js?v=8",
  "./analytics.js?v=3",
  "./assets/lucide.min.js?v=1",
  "./assets/images/lagma-logo.png",
  "./assets/weather/sunset-frames.png",
  "./assets/weather/moon-phase-0.webp",
  "./assets/weather/moon-phase-1.webp",
  "./assets/weather/moon-phase-2.webp",
  "./assets/weather/moon-phase-3.webp",
  "./assets/weather/moon-phase-4.webp",
  "./lagma-icons.js?v=1",
  "./manifest.webmanifest?v=8",
  "./favicon.ico?v=1",
  "./icons/lagma-icon-192.png?v=2",
  "./icons/lagma-icon-512.png?v=2",
  "./sj-logo.webp",
  "./todo-ai-face.webp",
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
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("lagma-village-") && key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

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
