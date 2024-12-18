const CACHE_NAME = "v1";
const CACHE_ASSETS = [
    "index.html",
    "style.css",
    "script.js",
    "dataProcessor.js",
    "fileDownload.js",
    "manifest.json",
    "service-worker.js",
    "https://unpkg.com/leaflet/dist/leaflet.js",
    "https://unpkg.com/leaflet/dist/leaflet.css",
    // Solo guardamos en caché los iconos más importantes
    "icons/favicon.ico",
    "icons/android/android-launchericon-192-192.png",
    "icons/android/android-launchericon-512-512.png",
    "icons/ios/180.png",
    "icons/windows/Square150x150Logo.scale-200.png",
    "icons/windows/Square44x44Logo.scale-200.png"
];

// Guardamos los ficheros indicados en caché cuando se instala el Service Worker
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("Service Worker: cacheando archivos...");
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Mantenemos actualizados los ficheros en caché
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log("Service Worker: actualizando caché...");
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Interceptamos las solicitudes para intentar obtener el recurso de la red, y si esta falla, intentar obtenerlo de la caché
self.addEventListener("fetch", (e) => {
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                console.log("Service Worker: solicitud interceptada, recurso obtenido de la red:", e.request.url);
                return networkResponse;
            })
            .catch(() => {
                console.log("Service Worker: solicitud interceptada, recurso obtenido de la caché:", e.request.url);
                return caches.match(e.request);
            })
    );
});
