// Using the bundled version of OpenLayers
window.map = new ol.Map({
  layers: [
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            maxZoom: 19,
            crossOrigin: 'anonymous'
          })
        }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        
        url: '/static/geodata/deutschlandGeoJSON/4_kreise/2_hoch.geo.json',
      }),
      style: new ol.style.Style({
        //fill: new ol.style.Fill({
          //color: 'rgba(255, 0, 0, 0.05)'  // Semi-transparent red fill
        //}),
        stroke: new ol.style.Stroke({
          color: '#ff0000',  // Red outline
          width: 2
        })
      })
    })
  ],
  view: new ol.View({
    center: [927021.39753, 6277297.0567],
    zoom: 14
  }),
  target: 'OL-map',
});

map.addInteraction(new ol.interaction.Link());
