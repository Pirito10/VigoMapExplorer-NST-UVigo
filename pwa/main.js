// Configurar y registrar el Service Worker

let swLocation = "serviceWorker.js";

// Si se está ejecutando localmente, ajustar la ubicación del SW
if (navigator.serviceWorker) {
    if (window.location.href.includes("localhost")) {
        swLocation = "/serviceWorker.js";
    }

    // Registrar el Service Worker
    navigator.serviceWorker.register(swLocation).then(() => {
        console.log("Service Worker registrado correctamente.");
    }).catch(err => {
        console.error("Error al registrar el Service Worker:", err);
    });
}

// Mensaje de prueba en consola
console.log("Hello world!");
