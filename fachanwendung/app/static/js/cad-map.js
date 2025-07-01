import './cadenza3.0.4.js';

// Global variable to store current Cadenza extent
window.cadenzaCurrentExtent = [852513.341856, 6511017.966314, 916327.095083, 7336950.728974];

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {

    window.cadenzaClient = cadenza({
      baseUrl: 'http://localhost:8080/cadenza/',
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "Pc8YJDtHybIR3hDILuOJ",
        externalLinkId: "PqxAWkK1CLmiBkkjWAEI"
      },
    });

    window.cadenzaClient.showMap('messstellenkarte', {
      useMapSrs: true,
      // extent is minx, miny, maxx, maxy
      mapExtent: [
        852513.341856, 6511017.966314, 916327.095083, 7336950.728974
      ]
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