let map; // Variable global para el mapa
let layers = []; // Lista de capas en el mapa
let layerCounter = 0; // Contador para el ID de las
let pointCounter = 0; // Contador para el ID de los puntos

// Código que se ejecuta al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Inicializamos el mapa
    initializeMap();

    // Añadimos un listener al botón "Aplicar filtro"
    const applyFiltersButton = document.getElementById('apply-filters');
    applyFiltersButton.addEventListener('click', () => {
        // Obtenemos las categorías seleccionadas y las cargamos en el mapa
        const selectedSubcategories = getSelectedSubcategories();

        if (selectedSubcategories.length === 0) {
            alert('Por favor, selecciona al menos una subcategoría');
            return;
        }

        loadSelectedSubcategories(selectedSubcategories);
    });

    // Añadimos un listener al botón "Descargar datos"
    const downloadButton = document.getElementById('download-data');
    downloadButton.addEventListener('click', () => downloadData());

    // Obtenemos los elementos de la ventana de ayuda
    const modal = document.getElementById('import-modal');
    const openLink = document.getElementById('open-import-info');
    const closeBtn = document.getElementById('close-modal');

    // Añadimos un listener al enlace de ayuda
    openLink.addEventListener('click', () => {
        // Mostramos la ventana de ayuda
        modal.style.display = 'block';
    });

    // Añadimos un listener al botón de cerrar
    closeBtn.addEventListener('click', () => {
        // Ocultamos la ventana de ayuda
        modal.style.display = 'none';
    });

    // Añadimos un listener a la ventana de ayuda
    modal.addEventListener('click', (event) => {
        // Ocultamos la ventana de ayuda si se hace el click fuera
        if (event.target === modal) {
            modal.style.display = 'none';
        }
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
    // Eliminamos las capas del mapa
    layers.forEach(layer => map.removeLayer(layer));
    layers = [];

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

// Función para eliminar un punto del mapa
function removePoint(pointId) {
    // Recorremos todas las capas
    for (const layer of layers) {
        // Filtramos los puntos para eliminar el que corresponda con el seleccionado
        const updatedFeatures = layer.geoJsonData.features.filter(feature => feature.id !== pointId);

        if (updatedFeatures.length < layer.geoJsonData.features.length) {
            // Si el punto estaba en esa capa, la actualizamos
            layer.geoJsonData.features = updatedFeatures;

            // Eliminamos la capa antigua del mapa
            map.removeLayer(layer);

            // Si no quedan más puntos en la capa, la eliminamos de la lista
            if (updatedFeatures.length === 0) {
                layers = layers.filter(l => l.layerId !== layer.layerId);
                break;
            }

            // Creamos una nueva capa con los datos filtrados y la volvemos a añadir
            const updatedLayer = L.geoJSON(layer.geoJsonData, {
                onEachFeature: handleFeature
            }).addTo(map);

            // Mantenemos el ID de la capa antigua
            updatedLayer.layerId = layer.layerId;
            updatedLayer.geoJsonData = layer.geoJsonData;

            // Reemplazamos la capa en la lista de capas
            layers = layers.map(l => l.layerId === layer.layerId ? updatedLayer : l);

            break;
        }
    }
}