let map; // Variable global para el mapa
let currentLayers = []; // Lista de capas actuales en el mapa

document.addEventListener('DOMContentLoaded', () => {
    const applyFiltersButton = document.getElementById('apply-filters');

    // Inicializar el mapa al cargar la página
    initializeMap();

    // Manejo del click sobre el botón "Aplicar filtro"
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
    // Elimina las capas actuales del mapa
    currentLayers.forEach(layer => map.removeLayer(layer));
    currentLayers = [];

    // URL base para obtener los datos desde la API
    const apiBaseUrl = 'https://datos-ckan.vigo.org/api/3/action/package_show?id=';

    // Cargamos los GeoJSON correspondientes a las subcategorías seleccionadas
    subcategories.forEach(subcategory => {
        // Construímos la URL completa, añadiendo el id de la subcategoría
        const datasetUrl = `${apiBaseUrl}${subcategory}`;

        // Hacemos la solicitud a la API
        fetch(datasetUrl)
            .then(response => response.json())
            .then(data => {
                // Buscamos el recurso en formato GeoJSON
                const resources = data.result.resources;
                const geojsonResource = resources.find(resource => resource.format === "GeoJSON");

                if (geojsonResource) {
                    // Obtenemos la URL del recurso
                    const geojsonUrl = geojsonResource.url;

                    // Hacemos la solicitud a la API
                    fetch(geojsonUrl)
                        .then(response => response.json())
                        .then(geojsonData => {
                            // Añadimos los puntos al mapa
                            const layer = L.geoJSON(geojsonData, {
                                onEachFeature: handleFeature // Vincula la función handleFeature
                            }).addTo(map);
                            // Guardamos la capa para poder eliminarla después
                            currentLayers.push(layer);
                        })
                        .catch(err => console.error(`Error cargando GeoJSON desde ${geojsonUrl}:`, err));
                } else {
                    console.error(`No se encontró un recurso en formato GeoJSON para ${subcategory}`);
                }
            })
            .catch(err => console.error(`Error obteniendo los datos de ${subcategory}:`, err));
    });
}

//Función para mostrar la información de cada punto
function handleFeature(feature, layer) {
    if (feature.properties) {
        // Mapeo de campos: intenta encontrar la información en diferentes claves
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

        // Función para buscar el valor de un campo en diferentes claves
        const getFieldValue = (keys) => {
            for (const key of keys) {
                if (feature.properties[key]) {
                    return feature.properties[key];
                }
            }
            return null; // Si no se encuentra, devuelve null
        };

        // Obtener los valores para cada campo
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

        // Construir el contenido del popup dinámicamente
        let popupContent = `<b>${nombre}</b>`;
        if (direccion) popupContent += `<br><b>Dirección:</b> ${direccion}`;
        if (numero) popupContent += `<br><b>Número:</b> ${numero}`;
        if (cp) popupContent += `<br><b>Código postal:</b> ${cp}`;
        if (tipo) popupContent += `<br><b>Tipo:</b> ${tipo}`;
        if (subcategoria) popupContent += `<br><b>Subcategoría:</b> ${subcategoria}`;
        if (descripcion) popupContent += `<br><b>Descripción:</b> ${descripcion}`;
        if (telefono) popupContent += `<br><b>Teléfono:</b> ${telefono}`;
        if (web) popupContent += `<br><b>Web:</b> <a href="${web}" target="_blank">${web}</a>`;
        if (imagen) popupContent += `<br><img src="${imagen}" alt="Imagen" style="max-width: 200px; margin-top: 10px;">`;
        //if (mp3) popupContent += ;

        // Añadir popup al punto
        layer.bindPopup(popupContent);
    }
}