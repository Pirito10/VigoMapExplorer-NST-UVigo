// Función para agregar los puntos GeoJSON al mapa
function processGeoJSON(geoJsonData) {
    // Asignamos un ID único a cada punto
    geoJsonData.features = geoJsonData.features.map(feature => {
        if (!feature.id) {
            feature.id = `point-${pointCounter++}`;
        }
        return feature;
    });

    // Creamos una capa y la añadimos al mapa
    const layer = L.geoJSON(geoJsonData, {
        // Añadimos un popup con la información de cada punto
        onEachFeature: handleFeature
    }).addTo(map);

    // Asignamos un ID único a la capa
    layer.layerID = `layer-${layerCounter++}`;

    // Asociamos los puntos a la capa
    layer.geoJsonData = geoJsonData;

    // Guardamos la capa para poder eliminarla después
    layers.push(layer);
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

// Función para procesar y mostrar datos en formato XLS
function processXLS(xlsData) {
    // Array para almacenar los puntos del mapa en formato GeoJSON
    const geoJsonFeatures = [];

    // Leemos los datos en binario
    const workbook = XLSX.read(xlsData, { type: 'binary' });
    // Obtenemos el nombre de la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    // Obtenemos los datos de la primera hoja
    const worksheet = workbook.Sheets[firstSheetName];

    // Convertimos los datos de la hoja en un objeto JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

    // Convertimos cada fila en un Feature de GeoJSON
    jsonData.forEach(row => {
        // Validamos que existan coordenadas
        if (row.lat && row.lon) {
            const feature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(row.lon), parseFloat(row.lat)]
                },
                // Añadimos las propiedades
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

// Función para procesar y mostrar datos en formato SHAPEFILE
function processSHP(arrayBuffer) {
    // Usamos la librería Shapefile.js para procesar los datos del shapefile
    shp(arrayBuffer)
        .then(geoJsonData => {
            // Añadimos los puntos al mapa
            processGeoJSON(geoJsonData);
        })
        .catch(err => {
            console.error('Error procesando el shapefile:', err);
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
            popupContent += `<audio controls style="width: 100%; margin-top: 10px;">
                    <source src="${mp3}" type="audio/mpeg">
                    Tu navegador no soporta el reproductor de audio.
                </audio>`;
        }
        // Añadimos el botón para borrar
        popupContent += `<button onclick="removePoint('${feature.id}')">
                <i class="fas fa-trash"></i>
            </button>`;

        // Añadimos el popup al punto
        layer.bindPopup(popupContent);
    }
}