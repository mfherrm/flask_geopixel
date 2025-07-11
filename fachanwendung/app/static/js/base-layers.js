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
    maxZoom: 21,
    crossOrigin: 'anonymous'
  }),
  visible: true,
  name: 'Google Satellite'
});

// MapTiler Satellite Layer (High Resolution)
const mapTilerSatelliteLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}@2x.jpg?key=9VPg0nTfKLIPtIfMnJlk',
    maxZoom: 21,
    crossOrigin: null, // Remove crossOrigin to avoid CORS issues
    tilePixelRatio: 2, // Enable high DPI/retina support
    tileLoadFunction: function (imageTile, src) {
      const image = imageTile.getImage();
      
      // Handle CORS errors gracefully
      image.onerror = function() {
        console.warn(`⚠️  CORS error loading MapTiler tile: ${src}`);
        // Try loading without CORS
        const fallbackImage = new Image();
        fallbackImage.onload = function() {
          image.src = fallbackImage.src;
        };
        fallbackImage.onerror = function() {
          console.error(`❌ Failed to load MapTiler tile: ${src}`);
        };
        fallbackImage.src = src;
      };
      
      image.src = src;
    }
  }),
  visible: false,
  name: 'MapTiler Satellite (High Resolution)'
});

// ArcGIS Wayback XYZ Layers - Using year:tile_id dictionary and for loop
const waybackYearTileIds = {
  '2025': 25285,
  '2024': 39767,
  '2023': 47963,
  '2022': 13851,
  '2021': 8432,
  '2020': 9549,
  '2019': 16681,
  '2018': 14829,
  '2017': 3319,
  '2016': 11509,
  '2015': 11952,
  '2014': 31144
};

// Create wayback layers using for loop
const waybackLayers = {};
for (const [year, tileId] of Object.entries(waybackYearTileIds)) {
  waybackLayers[year] = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${tileId}/{z}/{y}/{x}`,
      maxZoom: 19,
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: year
  });
}

// Bing Aerial Layer (High Resolution)
const bingAerialLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://gis.sinica.edu.tw/worldmap/file-exists.php?img=BingA-jpg-{z}-{x}-{y}',
    maxZoom: 21,
    crossOrigin: 'anonymous'
  }),
  visible: false,
  name: 'Bing Aerial'
});

// Bing Aerial with Labels Layer (High Resolution)
const bingAerialLabelsLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://gis.sinica.edu.tw/worldmap/file-exists.php?img=BingH-jpg-{z}-{x}-{y}',
    maxZoom: 21,
    crossOrigin: 'anonymous'
  }),
  visible: false,
  name: 'Bing Aerial with Labels'
});

// Academia Sinica WMTS Layers (now empty, but keeping structure for potential future additions)
const academiaLayers = {};

// Export base layers collection
export const baseLayers = {
  'google': googleSatelliteLayer,
  'maptiler': mapTilerSatelliteLayer,
  'bing-aerial': bingAerialLayer,
  'bing-aerial-labels': bingAerialLabelsLayer,
  ...academiaLayers,
  // Add wayback layers with prefixed keys
  'wayback-2025': waybackLayers['2025'],
  'wayback-2024': waybackLayers['2024'],
  'wayback-2023': waybackLayers['2023'],
  'wayback-2022': waybackLayers['2022'],
  'wayback-2021': waybackLayers['2021'],
  'wayback-2020': waybackLayers['2020'],
  'wayback-2019': waybackLayers['2019'],
  'wayback-2018': waybackLayers['2018'],
  'wayback-2017': waybackLayers['2017'],
  'wayback-2016': waybackLayers['2016'],
  'wayback-2015': waybackLayers['2015'],
  'wayback-2014': waybackLayers['2014']
};

// Export individual layers
export { mapTilerSatelliteLayer, googleSatelliteLayer, bingAerialLayer, bingAerialLabelsLayer, waybackLayers, academiaLayers };

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

    source.on('tileloaderror', function (event) {
      console.error(`❌ ${layerKey}: Tile load error:`, event.tile.getTileCoord(), event);
    });

  } else {
    console.error(`❌ Base layer '${layerKey}' not found`);
    console.log('Available layers:', Object.keys(baseLayers));
  }
};

// ===========================================
// INITIALIZATION FUNCTION
// ===========================================

// Initialize layer switcher UI to match actual layer visibility
export const initializeLayerSwitcher = function() {
  console.log('🎯 Initializing layer switcher UI...');
  
  // Find which layer is currently visible
  let visibleLayerKey = null;
  for (const [key, layer] of Object.entries(baseLayers)) {
    if (layer.getVisible()) {
      visibleLayerKey = key;
      console.log(`✅ Found visible layer: ${key} (${layer.get('name')})`);
      break;
    }
  }
  
  // If no layer is visible, default to Google
  if (!visibleLayerKey) {
    visibleLayerKey = 'google';
    baseLayers['google'].setVisible(true);
    console.log('🔄 No visible layer found, defaulting to Google Satellite');
  }
  
  // Update radio button state to match visible layer
  const radioButtons = document.querySelectorAll('input[name="baseLayer"]');
  radioButtons.forEach(radio => {
    radio.checked = (radio.value === visibleLayerKey);
  });
  
  console.log(`🎛️  Updated UI: ${visibleLayerKey} layer selected`);
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLayerSwitcher);
} else {
  // DOM is already loaded
  initializeLayerSwitcher();
}