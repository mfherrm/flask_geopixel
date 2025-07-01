import './cadenza3.0.4.js';

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
        [852513.341856, 6511017.966314, 916327.095083, 7336950.728974]
      ]

    });

    window.cadenzaClient.on('change:extent', (event) => {
      console.log(event)
    });
  }
});