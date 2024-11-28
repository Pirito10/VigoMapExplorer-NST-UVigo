const staticMapApp = "map-app-v1";
const assets = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/script.js",
  "/data/poi-lugares-gl.geojson"
];

// Install event - Se activa cuando se instala el service worker
self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticMapApp).then(cache => {
      console.log("Cache opened and assets cached");
      return cache.addAll(assets);
    })
  );
});

// Activate event - Limpiar cachés antiguos
self.addEventListener("activate", activateEvent => {
  const cacheWhitelist = [staticMapApp];

  activateEvent.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Estrategia "cache-first" para archivos estáticos
self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(cacheResponse => {
      return (
        cacheResponse ||
        fetch(fetchEvent.request).then(fetchResponse => {
          return caches.open(staticMapApp).then(cache => {
            // Guardamos las respuestas de la red en caché
            cache.put(fetchEvent.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    })
  );
});
