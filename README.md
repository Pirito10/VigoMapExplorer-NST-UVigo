# Vigo Map Explorer
*Vigo Map Explorer* is a **Progressive Web Application** developed as part of the course "[Nuevos Servicios Telemáticos](https://secretaria.uvigo.gal/docnet-nuevo/guia_docent/?ensenyament=V05G301V01&assignatura=V05G301V01405&any_academic=2024_25)" in the Telecommunications Engineering Degree at the Universidad de Vigo (2024 - 2025).

## About The Project
This project integrates a [PWA](https://en.wikipedia.org/wiki/Progressive_web_app) designed to navigate a map of Vigo and visualize points of interest. The applications incorporates concepts such as fetching data from an external API, visualizing spatial data from various formats, and the fundamentals of PWA development.

The project features:
- Interactive [Leaflet](leafletjs.com) map centered on Vigo.
- Multiple categories to filter points of interest.
- Real-time data fetching from the [city hall API](https://datos.vigo.org/es/reutilizadores) in multiple formats (GeoJSON, KML, Shapefile...).
- Detailed popups with information for each point of interest.
- Custom selection download for selected points of interest.
- Web-based interface, with the ability to install as a native app.

## How To Run
### Requirements
Make sure you have [NodeJS](https://nodejs.org/en/download) installed on your system. Then install the required dependencies with:
```bash
npm install
```

### Usage
Once the dependencies are installed, you can run the application with:
```bash
npm start
```
Then, open your web browser and navigate to `http://localhost:3000`.

*When running locally, API requests won't work due to CORS restrictions. This limitation can be bypassed using a browser extension like [Moesif CORS](https://chromewebstore.google.com/detail/moesif-origincors-changer/digfbfaphojjndkpccljibejjbppifbc).*

## About The Code
There is no dedicated documentation for this project. Refer to [`Presentación.pdf`](docs/Presentación.pdf) for a high-level overview and results, or inspect the code for a deeper understanding of the system and how it works.