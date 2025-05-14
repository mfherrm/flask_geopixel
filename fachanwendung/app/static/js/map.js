import { cadenza } from './cadenza2.2.4.js';

const config = document.body.dataset;


window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cadenza-iframe')) {

    const cadenzaClient = cadenza('http://localhost:8080/cadenza/', {
      iframe: 'cadenza-iframe',
    });

    cadenzaClient.showMap('messstellenkarte', {
        useMapSrs: true,
        mapExtent: [
          -572_513.341856, 5_211_017.966314, 916_327.095083, 6_636_950.728974,
        ],
        geometry: {
          type: 'Point',
          coordinates: [328_627.563458, 5_921_296.662223],
        },
      });
  }
});




