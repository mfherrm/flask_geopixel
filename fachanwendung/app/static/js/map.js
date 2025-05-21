import { cadenza } from './cadenza3.0.4.js';

const config = document.body.dataset;


window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {

    window.cadenzaClient = cadenza('http://localhost:8080/cadenza/', {
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "Pc8YJDtHybIR3hDILuOJ",
        externalLinkId: "aDnoKxgW86U3nWUqn4ms"
      },
    });

    cadenzaClient.showMap('messstellenkarte', {
      useMapSrs: true,
      mapExtent: [
        852513.341856, 6511017.966314, 916327.095083, 7336950.728974
      ],

    });
  }
});