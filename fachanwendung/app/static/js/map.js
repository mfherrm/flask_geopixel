import { cadenza } from './cadenza2.2.4.js';

const config = document.body.dataset;


window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {

    window.cadenzaClient = cadenza('http://localhost:8080/cadenza/', {
      iframe: 'cadenza-iframe',
    });

    cadenzaClient.showMap('messstellenkarte', {
      useMapSrs: false,
      mapExtent: [
        4.0, 50.0, 15.0, 55.0,
      ]
    });
  }
});




