const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Sirve los archivos estáticos del directorio 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Manejar rutas no encontradas
app.use((_req, res) => {
    res.status(404).send('Ruta no encontrada.');
});

// Arrancar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});