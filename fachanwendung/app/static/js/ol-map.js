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
    center: [927319.695213, 6277180.746092],
    zoom: 15,
    projection: 'EPSG:3857'
  }),
  target: 'OL-map',
});



// Create a vector source and add the rectangle feature
const rectangleSource = new ol.source.Vector({});

// Create a vector layer for the rectangle with styling
window.rectangleLayer = new ol.layer.Vector({
  source: rectangleSource,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.3)'  // Semi-transparent blue fill
    }),
    stroke: new ol.style.Stroke({
      color: '#0000ff',  // Blue outline
      width: 2
    })
  })
});
// Add the rectangle layer to the map
map.addLayer(rectangleLayer);

const carSource = new ol.source.Vector({});
window.carLayer = new ol.layer.Vector({
  source: carSource,  // Fixed: added missing source property
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.3)'
    }),
    stroke: new ol.style.Stroke({
      color: '#ff0000',
      width: 2
    })
  })
});
map.addLayer(carLayer);

const riverSource = new ol.source.Vector({
  features: []  // Fixed: should be 'features', not 'feature'
});
window.riverLayer = new ol.layer.Vector({
  source: riverSource,  // Fixed: added missing source property
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.3)'
    }),
    stroke: new ol.style.Stroke({
      color: '#0000ff',
      width: 2
    })
  })
});
map.addLayer(riverLayer);

const buildingSource = new ol.source.Vector({});
window.buildingLayer = new ol.layer.Vector({
  source: buildingSource,  // Fixed: added missing source property
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(128, 128, 128, 0.3)'
    }),
    stroke: new ol.style.Stroke({
      color: '#808080',
      width: 2
    })
  })
});
map.addLayer(buildingLayer);

// Helper functions to append features to rectangleLayer
window.addRectangleToLayer = function (features, layer) {
  // Handle both single feature and array of features
  const featureArray = Array.isArray(features) ? features : [features];
  
  featureArray.forEach(feature => {
    feature.setStyle(layer.getStyle());
    layer.getSource().addFeature(feature);
  });
  
  return features;
};

// Add another rectangle
//addRectangleToLayer(window.rectangleLayer, [[[930000, 6275000], [935000, 6275000], [935000, 6280000], [930000, 6280000], [930000, 6275000]]]);
