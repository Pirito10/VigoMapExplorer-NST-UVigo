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
                            if (selectedFormat === 'KML' || selectedFormat === 'CSV') {
                                // Si el formato seleccionado es KML o CSV, obtenemos el texto en bruto
                                return response.text();
                            } else if (selectedFormat === 'XLS' || selectedFormat === 'SHP') {
                                //Si el formato seleccionado es XLS o SHP, obtenemos los datos en binario
                                return response.arrayBuffer();
                            }
                            else {
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
                            } else if (selectedFormat === 'XLS') {
                                processXLS(data);
                            } else if (selectedFormat === 'CSV') {
                                processCSV(data);
                            } else if (selectedFormat === 'SHP') {
                                processSHP(data);
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