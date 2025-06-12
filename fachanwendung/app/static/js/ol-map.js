// Using the bundled version of OpenLayers

// Import all vector layers from dedicated module
import { getAllVectorLayersArray, allVectorLayers } from './vector-layers.js';

// ===========================================
// BASE LAYER DEFINITIONS
// ===========================================

// Google Satellite Layer
const googleSatelliteLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    maxZoom: 19,
    crossOrigin: 'anonymous'
  }),
  visible: true,
  name: 'Google Satellite'
});

// ArcGIS Wayback XYZ Layers - Using consistent Wayback service URLs
const waybackLayers = {
 '2025': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/25285/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2025 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2025'
  }),
  '2024': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/39767/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2024 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2024'
  }),
  '2023': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/47963/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2023 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'October 2023'
  }),
  '2022': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/13851/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2022 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'June 2022'
  }),
  '2021': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/8432/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2021 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'October 2021'
  }),
  '2020': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/9549/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2020 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'December 2020'
  }),
  '2018': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/14829/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2018 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2018'
  }),
  '2014': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3026/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2014 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2014'
  }),
  '2019': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/16681/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2019 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2019'
  }),
  '2017': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3319/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2017 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2017'
  }),
  '2016': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/5097/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2016 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2016'
  }),
  '2015': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/24007/{z}/{y}/{x}',
      maxZoom: 19,
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2015 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2015'
  })
};

// Store all base layers for easy access
window.baseLayers = {
  'google': googleSatelliteLayer,
  ...waybackLayers
};

// Layer switching function with enhanced debugging
window.switchBaseLayer = function (layerKey) {
  console.log(`🔄 Switching to layer: ${layerKey}`);

  // Hide all base layers
  Object.values(window.baseLayers).forEach(layer => {
    layer.setVisible(false);
  });

  // Show selected layer
  if (window.baseLayers[layerKey]) {
    const selectedLayer = window.baseLayers[layerKey];
    selectedLayer.setVisible(true);

    // Get layer details for debugging
    const layerName = selectedLayer.get('name');
    const source = selectedLayer.getSource();
    const urls = source.getUrls ? source.getUrls() : [source.getUrl && source.getUrl()];

    console.log(`✅ Switched to base layer: ${layerName}`);
    console.log(`📍 Layer source URLs:`, urls);

    // Force refresh of tiles to ensure new layer loads
    source.refresh();

    // Add tile load event listeners for debugging
    source.on('tileloadstart', function (event) {
      console.log(`📥 ${layerKey}: Tile load started:`, event.tile.getTileCoord());
    });

    source.on('tileloadend', function (event) {
      console.log(`📦 ${layerKey}: Tile loaded successfully:`, event.tile.getTileCoord());
    });

    source.on('tileloaderror', function (event) {
      console.error(`❌ ${layerKey}: Tile load error:`, event.tile.getTileCoord(), event);
    });

  } else {
    console.error(`❌ Base layer '${layerKey}' not found`);
    console.log('Available layers:', Object.keys(window.baseLayers));
  }
};

// Function to test a sample tile URL manually
window.testWaybackURL = function (year) {
  const testCoords = { z: 10, x: 512, y: 512 }; // Example coordinates
  const baseUrl = 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile';

  // Use actual wayback release dates
  const waybackDates = {
    '2023': '2023-10-25',
    '2022': '2022-06-22',
    '2021': '2021-10-13',
    '2020': '2020-12-04',
    '2018': '2018-02-05',
    '2014': '2014-02-20'
  };

  const date = waybackDates[year] || `${year}-12-31`;
  const testUrl = `${baseUrl}/${testCoords.z}/${testCoords.y}/${testCoords.x}?time=${date}`;

  console.log(`🧪 Testing Wayback URL for ${year} (${date}):`, testUrl);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    console.log(`✅ ${year}: Tile loaded successfully - ${this.width}x${this.height}`);
  };
  img.onerror = function (e) {
    console.error(`❌ ${year}: Tile failed to load:`, e);
  };
  img.src = testUrl;
};

// Function to compare tile URLs between layers
window.compareLayers = function () {
  console.log('🔍 Comparing layer configurations:');
  Object.entries(waybackLayers).forEach(([key, layer]) => {
    const source = layer.getSource();
    const url = source.getUrl && source.getUrl();
    console.log(`${key}: ${url}`);
  });
};

// Create base layers array for map initialization
const allBaseLayers = [googleSatelliteLayer, ...Object.values(waybackLayers)];

// Create map with base layers and GeoJSON layer
window.map = new ol.Map({
  layers: [
    ...allBaseLayers,
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
    }),
    // Add all vector layers from the dedicated module
    ...getAllVectorLayersArray()
  ],
  view: new ol.View({
    center: [927319.695213, 6277180.746092],
    zoom: 15,
    projection: 'EPSG:3857'
  }),
  target: 'OL-map',
});

// Expose all vector layers to window for backward compatibility
Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
  window[layerName] = layer;
});


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

// ===========================================
// LAYER SWITCHING CONTROL
// ===========================================

// Toggle function for layer switcher (called from HTML)
window.toggleLayerSwitcher = function () {
  const content = document.getElementById('layer-switcher-content');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    console.log('Layer switcher toggled:', !isVisible ? 'opened' : 'closed');
  }
};

console.log('Layer switcher control initialized in HTML template');

// ===========================================
// ADDITIONAL HELPER FUNCTIONS
// ===========================================

// Function to get current active base layer
window.getCurrentBaseLayer = function () {
  const activeLayer = Object.entries(window.baseLayers).find(([key, layer]) => layer.getVisible());
  return activeLayer ? { key: activeLayer[0], layer: activeLayer[1], name: activeLayer[1].get('name') } : null;
};

// Function to set layer opacity
window.setBaseLayerOpacity = function (opacity) {
  Object.values(window.baseLayers).forEach(layer => {
    layer.setOpacity(opacity);
  });
};

// Function to switch to a specific Wayback time period
window.switchToWaybackTime = function (timeString) {
  const yearMatch = timeString.match(/\d{4}/);
  if (yearMatch) {
    const year = yearMatch[0];
    if (window.baseLayers[year]) {
      window.switchBaseLayer(year);
    } else {
      console.warn(`No Wayback layer available for year: ${year}`);
    }
  }
};
