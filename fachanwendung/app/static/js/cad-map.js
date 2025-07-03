import './cadenza3.0.4.js';

// Global variable to store current Cadenza extent
window.cadenzaCurrentExtent = [];

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {

    window.cadenzaClient = cadenza({
      baseUrl: 'http://localhost:8080/cadenza/',
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "_DS4kjgAp5On-lHnEgIi",
        externalLinkId: "mgsctVdrerBV8101oFtX"
      },
    });

    window.cadenzaClient.showMap('satellitenkarte', {
      useMapSrs: true,
      // extent is minx, miny, maxx, maxy
    });

    // Listen for extent changes and store the current extent
    window.cadenzaClient.on('change:extent', (event) => {
      console.log('Cadenza extent changed:', event);
      if (event.detail && event.detail.extent) {
        window.cadenzaCurrentExtent = event.detail.extent;
        console.log('Updated Cadenza current extent:', window.cadenzaCurrentExtent);
      }
    });
  }
});