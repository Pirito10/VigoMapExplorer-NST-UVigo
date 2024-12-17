// Función para consolidar datos y descargarlos en formato KML
function downloadData() {
    // Comprobamos si hay puntos cargados en el mapa
    if (layers.length > 0) {
        // Consolidamos los puntos de todas las capas en formato GeoJSON
        const consolidatedFeatures = layers.flatMap(layer => layer.geoJsonData.features);

        // Generamos el fichero KML
        const consolidatedKML = generateKML(consolidatedFeatures);

        // Descargamos el fichero
        exportToFile(consolidatedKML, 'datos.kml', 'application/vnd.google-earth.kml+xml');
        return;
    }

    // Si no hay puntos cargados en el mapa, obtenemos las categorías seleccionadas
    const selectedSubcategories = getSelectedSubcategories();
    if (selectedSubcategories.length === 0) {
        alert('Por favor, selecciona al menos una subcategoría');
        return;
    }

    // URL base para obtener los datos desde la API
    const apiBaseUrl = 'https://datos-ckan.vigo.org/api/3/action/package_show?id=';

    // Procesamos cada subcategoría seleccionada
    const fetchPromises = selectedSubcategories.map(subcategory => {
        // Construímos la URL completa, añadiendo el ID de la subcategoría
        const datasetUrl = `${apiBaseUrl}${subcategory}`;

        // Hacemos la solicitud a la API
        return fetch(datasetUrl)
            .then(response => response.json())
            .then(data => {
                // Buscamos el recurso en formato KML
                const resources = data.result.resources;
                const selectedResource = resources.find(resource => resource.format === 'KML');

                // Obtenemos la URL del recurso
                if (selectedResource) {
                    // Hacemos la solicitud a la API y obtenemos el texto en bruto
                    return fetch(selectedResource.url).then(response => response.text());
                } else {
                    console.error(`No se encontró un recurso en formato KML para ${subcategory}`);
                    return null;
                }
            });
    });

    // Esperamos a que finalicen todas las solicitudes
    Promise.all(fetchPromises).then(results => {
        // Array para consolidar todas las características
        const consolidatedFeatures = [];

        results.forEach(kmlText => {
            if (kmlText) {
                // Convertimos el texto KML a un documento XML
                const parser = new DOMParser();
                const kmlDoc = parser.parseFromString(kmlText, 'application/xml');

                // Usamos la librería toGeoJSON para convertir el documento XML a un objeto GeoJSON
                const geoJsonData = toGeoJSON.kml(kmlDoc);

                // Consolidamos las propiedades en un único array
                if (geoJsonData.features) {
                    consolidatedFeatures.push(...geoJsonData.features);
                }
            }
        });

        // Generamos el fichero KML
        const consolidatedKML = generateKML(consolidatedFeatures);

        // Descargamos el fichero
        exportToFile(consolidatedKML, 'datos.kml', 'application/vnd.google-earth.kml+xml');
    });
}

// Función para generar un fichero KML a partir de un GeoJSON
function generateKML(features) {
    // Mapeo de campos: un campo puede estar referenciada por diferentes claves, dependiendo de cada fichero
    const fields = {
        nombre: ['nombre', 'name', 'title', 'nombre_completo'],
        descripcion: ['description', 'descripcion', 'detalles'],
        direccion: ['address', 'direccion', 'calle'],
        numero: ['numero'],
        cp: ['postcode', 'codigo_postal'],
        tipo: ['tipo', 'tipo_es'],
        subcategoria: ['subcategoria'],
        telefono: ['telefono', 'phone', 'numero_telefono'],
        web: ['web', 'website', 'url'],
        imagen: ['imagen', 'image', 'image_uri'],
        mp3: ['mp3_uri']
    };

    // Diccionario para personalizar los nombres de los campos
    const fieldNames = {
        nombre: "nombre",
        descripcion: "descripción",
        direccion: "Dirección",
        numero: "Número",
        cp: "Código Postal",
        tipo: "Tipo",
        subcategoria: "Subcategoría",
        telefono: "Teléfono",
        web: "Web",
        imagen: "Imagen",
        mp3: "MP3"
    };

    // Función para buscar el valor de un campo por diferentes claves
    const getFieldValue = (properties, keys) => {
        for (const key of keys) {
            if (properties[key]) {
                return properties[key];
            }
        }
        // Si no se encuentra, devuelve 'N/A'
        return 'N/A';
    };

    // Generamos los campos del Schema
    const schemaFields = Object.keys(fieldNames).map(key => {
        return `      <SimpleField name="${fieldNames[key]}" type="string"></SimpleField>`;
    }).join('\n');

    // Generamos el KML
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
  <name>NST Data</name>
    <Schema name="CustomSchema" id="CustomSchema">
${schemaFields}
    </Schema>
${features.map(feature => {
        const properties = feature.properties || {};

        // Obtenemos los valores para cada campo
        const homogeneizedFields = {
            nombre: getFieldValue(properties, fields.nombre),
            descripcion: getFieldValue(properties, fields.descripcion),
            direccion: getFieldValue(properties, fields.direccion),
            numero: getFieldValue(properties, fields.numero),
            cp: getFieldValue(properties, fields.cp),
            tipo: getFieldValue(properties, fields.tipo),
            subcategoria: getFieldValue(properties, fields.subcategoria),
            telefono: getFieldValue(properties, fields.telefono),
            web: getFieldValue(properties, fields.web),
            imagen: getFieldValue(properties, fields.imagen),
            mp3: getFieldValue(properties, fields.mp3)
        };

        // Mapeamos cada campo con su valor
        const schemaData = Object.entries(homogeneizedFields)
            .map(([key, value]) => {
                const fieldName = fieldNames[key] || key;
                return `          <SimpleData name="${fieldName}">${value}</SimpleData>`;
            }).join('\n');

        // Extraemos las coordenadas
        const coordinates = feature.geometry && feature.geometry.coordinates
            ? `${feature.geometry.coordinates[0]},${feature.geometry.coordinates[1]}`
            : '';

        // Creamos la estructura del elemento
        return `    <Placemark>
      <ExtendedData>
        <SchemaData schemaUrl="#CustomSchema">
${schemaData}
        </SchemaData>
      </ExtendedData>
      <Point>
        <coordinates>${coordinates}</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n')}
  </Document>
</kml>`;

    return kml;
}

// Función para exportar un archivo
function exportToFile(content, filename, mimeType) {
    // Creamos un Blob (Binary Large Object) con el contenido
    const blob = new Blob([content], { type: mimeType });
    // Creamos una URL de objeto para el Blob
    const url = URL.createObjectURL(blob);

    // Creamos un enlace temporal y lo configuramos
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Simulamos un click en el enlace para iniciar la descarga
    link.click();

    // Limpiamos la URL del objeto para liberar memoria
    URL.revokeObjectURL(url);
}

// TODO personalizacion