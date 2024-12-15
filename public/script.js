let map; // Variable global para el mapa
let currentLayers = []; // Lista de capas actuales en el mapa

// Código que se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos el mapa
    initializeMap();

    // Añadimos un listener al botón "Aplicar filtro"
    const applyFiltersButton = document.getElementById('apply-filters');
    applyFiltersButton.addEventListener('click', () => {
        // Obtenemos las categorías seleccionadas
        const selectedSubcategories = getSelectedSubcategories();
        // Las cargamos
        loadSelectedSubcategories(selectedSubcategories);
    });
});

// Función para inicializar el mapa
function initializeMap() {
    map = L.map('map').setView([42.2405, -8.7119], 13); // Coordenadas de Vigo
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);
}

// Función para obtener las subcategorías seleccionadas
function getSelectedSubcategories() {
    const checkboxes = document.querySelectorAll('#menu input[type="checkbox"]:checked');
    const selectedSubcategories = Array.from(checkboxes).map(checkbox => checkbox.value);
    console.log('Subcategorías seleccionadas:', selectedSubcategories); // Depuración
    return selectedSubcategories;
}

// Función para cargar los puntos de interés seleccionados
function loadSelectedSubcategories(subcategories) {
    // Eliminamos las capas actuales del mapa
    currentLayers.forEach(layer => map.removeLayer(layer));
    currentLayers = [];

    // URL base para obtener los datos desde la API
    const apiBaseUrl = 'https://datos-ckan.vigo.org/api/3/action/package_show?id=';

    // Obtenemos el formato seleccionado
    const selectedFormat = document.getElementById('format').value;
    console.log('Formato seleccionado:', selectedFormat); // Depuración

    // Cargamos en el mapa los puntos correspondientes a las subcategorías seleccionadas
    subcategories.forEach(subcategory => {
        // Construímos la URL completa, añadiendo el ID de la subcategoría
        const datasetUrl = `${apiBaseUrl}${subcategory}`;

        // Hacemos la solicitud a la API
        fetch(datasetUrl)
            .then(response => response.json())
            .then(data => {
                // Buscamos el recurso en el formato seleccionado
                const resources = data.result.resources;
                const selectedResource = resources.find(resource => resource.format === selectedFormat);

                if (selectedResource) {
                    // Obtenemos la URL del recurso
                    const resourceUrl = selectedResource.url;

                    // Hacemos la solicitud a la API
                    fetch(resourceUrl)
                        .then(response => {
                            // Si el formato seleccionado es KML o CSV, obtenemos el texto en bruto
                            if (selectedFormat === 'KML' || selectedFormat === 'CSV') {
                                return response.text();
                            } else {
                                // Si el formato seleccionado es GeoJSON o JSON, parseamos el texto
                                return response.json();
                            }
                        })
                        .then(data => {
                            // Procesamos los datos según el formato seleccionado, y añadimos los puntos al mapa
                            if (selectedFormat === 'GeoJSON') {
                                processGeoJSON(data);
                            } else if (selectedFormat === 'JSON') {
                                processJSON(data);
                            } else if (selectedFormat === 'KML') {
                                processKML(data);
                            } else if (selectedFormat === 'CSV') {
                                processCSV(data);
                            }
                        })
                        .catch(err => console.error(`Error cargando el recurso desde ${resourceUrl}:`, err));
                } else {
                    console.error(`No se encontró un recurso en formato ${selectedFormat} para ${subcategory}`);
                }
            })
            .catch(err => console.error(`Error obteniendo los datos de ${subcategory}:`, err));
    });
}

// Función para agregar los puntos GeoJSON al mapa
function processGeoJSON(geoJsonData) {
    const layer = L.geoJSON(geoJsonData, {
        // Añadimos un popup con la información de cada punto
        onEachFeature: handleFeature
    }).addTo(map);
    // Guardamos la capa para poder eliminarla después
    currentLayers.push(layer);
}

// Función para procesar y mostrar datos en formato JSON
function processJSON(jsonData) {
    // Array para almacenar los puntos del mapa en formato GeoJSON
    const geoJsonFeatures = [];

    // Convertimos cada objeto del JSON a un Feature de GeoJSON
    jsonData.forEach(item => {
        // Validamos que existan las coordenadas
        if (item.lat && item.lon) {
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
                },
                // Añadimos las propiedades
                properties: { ...item }
            };
            geoJsonFeatures.push(feature);
        }
    });

    // Creamos el objeto GeoJSON
    const geoJsonData = {
        type: 'FeatureCollection',
        features: geoJsonFeatures
    };

    // Añadimos los puntos al mapa
    processGeoJSON(geoJsonData);
}

// Función para procesar y mostrar datos en formato KML
function processKML(kmlText) {
    // Convertimos el texto KML a un documento XML
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'application/xml');

    // Usamos la librería toGeoJSON para convertir el documento XML a un objeto GeoJSON
    const geoJsonData = toGeoJSON.kml(kmlDoc);

    // Añadimos los puntos al mapa
    processGeoJSON(geoJsonData);
}

// Función para procesar y mostrar datos en formato CSV
function processCSV(csvText) {
    // Array para almacenar los puntos del mapa en formato GeoJSON
    const geoJsonFeatures = [];

    // Usamos la librería PapaParse para procesar el CSV
    Papa.parse(csvText, {
        // Consideramos la primera fila como encabezados
        header: true,
        // Saltamos líneas vacías
        skipEmptyLines: true,
        complete: (results) => {
            results.data.forEach(row => {
                // Validamos que haya coordenadas
                if (row.lat && row.lon) {
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(row.lon), parseFloat(row.lat)]
                        },
                        // Añadimos las demás columnas como propiedades
                        properties: { ...row }
                    };
                    geoJsonFeatures.push(feature);
                }
            });

            // Creamos el objeto GeoJSON
            const geoJsonData = {
                type: 'FeatureCollection',
                features: geoJsonFeatures
            };

            // Añadimos los puntos al mapa
            processGeoJSON(geoJsonData);
        }
    });
}

// Función para crear un popup con la información de cada punto
function handleFeature(feature, layer) {
    if (feature.properties) {
        // Mapeo de campos: un campo puede estar referenciada por diferentes claves, dependiendo de cada fichero
        const fields = {
            nombre: ['nombre', 'title', 'nombre_completo'],
            direccion: ['address', 'direccion', 'calle'],
            numero: ['numero'],
            cp: ['postcode', 'codigo_postal'],
            tipo: ['tipo', 'tipo_es'],
            subcategoria: ['subcategoria'],
            descripcion: ['description', 'descripcion', 'detalles'],
            telefono: ['telefono', 'phone', 'numero_telefono'],
            web: ['web', 'website', 'url'],
            imagen: ['imagen', 'image', 'image_uri'],
            mp3: ['mp3_uri']
        };

        // Función para buscar el valor de un campo por diferentes claves
        const getFieldValue = (keys) => {
            for (const key of keys) {
                if (feature.properties[key]) {
                    return feature.properties[key];
                }
            }
            // Si no se encuentra, devuelve null
            return null;
        };

        // Obtenemos los valores para cada campo
        const nombre = getFieldValue(fields.nombre) || 'Sin título';
        const direccion = getFieldValue(fields.direccion);
        const numero = getFieldValue(fields.numero);
        const cp = getFieldValue(fields.cp);
        const tipo = getFieldValue(fields.tipo);
        const subcategoria = getFieldValue(fields.subcategoria);
        const descripcion = getFieldValue(fields.descripcion);
        const telefono = getFieldValue(fields.telefono);
        const web = getFieldValue(fields.web);
        const imagen = getFieldValue(fields.imagen);
        const mp3 = getFieldValue(fields.mp3);

        // Construímos el contenido del popup dinámicamente
        let popupContent = `<b>${nombre}</b><br>`;
        if (direccion) popupContent += `<br><b>Dirección:</b> ${direccion}`;
        if (numero) popupContent += `<br><b>Número:</b> ${numero}`;
        if (cp) popupContent += `<br><b>Código postal:</b> ${cp}`;
        if (tipo) popupContent += `<br><b>Tipo:</b> ${tipo}`;
        if (subcategoria) popupContent += `<br><b>Subcategoría:</b> ${subcategoria}`;
        if (descripcion) popupContent += `<br><b>Descripción:</b> ${descripcion}`;
        if (telefono) popupContent += `<br><b>Teléfono:</b> ${telefono}`;
        if (web) popupContent += `<br><b>Web:</b> <a href="${web}" target="_blank">${web}</a>`;
        if (imagen) popupContent += `<br><img src="${imagen}" alt="Imagen" style="max-width: 200px; margin-top: 10px;">`;
        if (mp3) {
            popupContent += `
                <br><b>Audio:</b>
                <audio controls style="width: 100%; margin-top: 10px;">
                    <source src="${mp3}" type="audio/mpeg">
                    Tu navegador no soporta el reproductor de audio.
                </audio>`;
        }

        // Añadimos el popup al punto
        layer.bindPopup(popupContent);
    }
}