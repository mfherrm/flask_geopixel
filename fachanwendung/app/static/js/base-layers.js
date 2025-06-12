/**
 * Base Layers Module for GeoPixel Application
 * 
 * This module contains all base layer definitions including:
 * - Google Satellite layer
 * - ArcGIS Wayback historical imagery layers
 * - Layer switching functionality
 * - Utility functions for layer management
 */

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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
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
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
        console.log('📥 Loading 2015 tile:', src);
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2015'
  })
};

// Export base layers collection
export const baseLayers = {
  'google': googleSatelliteLayer,
  ...waybackLayers
};

// Export individual layers
export { googleSatelliteLayer, waybackLayers };

// Get all base layers as array for map initialization
export const getAllBaseLayersArray = () => {
  return Object.values(baseLayers);
};

// ===========================================
// LAYER SWITCHING FUNCTIONALITY
// ===========================================

// Layer switching function with enhanced debugging
export const switchBaseLayer = function (layerKey) {
  console.log(`🔄 Switching to layer: ${layerKey}`);

  // Hide all base layers
  Object.values(baseLayers).forEach(layer => {
    layer.setVisible(false);
  });

  // Show selected layer
  if (baseLayers[layerKey]) {
    const selectedLayer = baseLayers[layerKey];
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
    console.log('Available layers:', Object.keys(baseLayers));
  }
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Function to test a sample tile URL manually
export const testWaybackURL = function (year) {
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
export const compareLayers = function () {
  console.log('🔍 Comparing layer configurations:');
  Object.entries(waybackLayers).forEach(([key, layer]) => {
    const source = layer.getSource();
    const url = source.getUrl && source.getUrl();
    console.log(`${key}: ${url}`);
  });
};

// Function to get current active base layer
export const getCurrentBaseLayer = function () {
  const activeLayer = Object.entries(baseLayers).find(([key, layer]) => layer.getVisible());
  return activeLayer ? { key: activeLayer[0], layer: activeLayer[1], name: activeLayer[1].get('name') } : null;
};

// Function to set layer opacity
export const setBaseLayerOpacity = function (opacity) {
  Object.values(baseLayers).forEach(layer => {
    layer.setOpacity(opacity);
  });
};

// Function to switch to a specific Wayback time period
export const switchToWaybackTime = function (timeString) {
  const yearMatch = timeString.match(/\d{4}/);
  if (yearMatch) {
    const year = yearMatch[0];
    if (baseLayers[year]) {
      switchBaseLayer(year);
    } else {
      console.warn(`No Wayback layer available for year: ${year}`);
    }
  }
};

// ===========================================
// INITIALIZATION AND DEBUG INFO
// ===========================================

// Initialize base layer utilities and debug information
export const initializeBaseLayers = function() {
  // Console helper for easy layer switching and debugging
  console.log('🌍 ArcGIS Wayback Integration loaded successfully!');
  console.log('📋 Available commands:');
  console.log('Layer Switching:');
  console.log('- switchBaseLayer("google") - Switch to Google Satellite');
  console.log('- switchBaseLayer("current") - Switch to current ArcGIS imagery');
  console.log('- switchBaseLayer("2025") - Switch to 2025');
  console.log('- switchBaseLayer("2024") - Switch to 2024');
  console.log('- switchBaseLayer("2023") - Switch to October 2023');
  console.log('- switchBaseLayer("2022") - Switch to June 2022');
  console.log('- switchBaseLayer("2021") - Switch to October 2021');
  console.log('- switchBaseLayer("2020") - Switch to December 2020');
  console.log('- switchBaseLayer("2019") - Switch to 2019');
  console.log('- switchBaseLayer("2018") - Switch to February 2018');
  console.log('- switchBaseLayer("2017") - Switch to 2017');
  console.log('- switchBaseLayer("2016") - Switch to 2016');
  console.log('- switchBaseLayer("2015") - Switch to 2015');
  console.log('- switchBaseLayer("2014") - Switch to February 2014');
  console.log('');
  console.log('Debugging & Verification:');
  console.log('- getCurrentBaseLayer() - Get current active base layer');
  console.log('- setBaseLayerOpacity(0.5) - Set opacity of base layers');
  console.log('- testWaybackURL("2020") - Test if a specific year\'s tiles load');
  console.log('- compareLayers() - Compare all layer configurations');
  console.log('');
  console.log('💡 To verify layers are different:');
  console.log('1. Switch to different years and check console for tile URLs');
  console.log('2. Use testWaybackURL() to verify individual years load');
  console.log('3. Look for tile load/error messages when switching layers');
};

// Automatically initialize when module is loaded
initializeBaseLayers();