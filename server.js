const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Sirve los archivos estáticos del directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Sirve los archivos de 'data'
app.use('/data', express.static(path.join(__dirname, 'data')));

// Manejar rutas no encontradas
app.use((req, res, next) => {
    res.status(404).send('Ruta no encontrada.');
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});