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
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'December 2020'
  }),
  '2019': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/16681/{z}/{y}/{x}',
      maxZoom: 19,
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2019'
  }),
  '2018': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/14829/{z}/{y}/{x}',
      maxZoom: 19,
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2018'
  }),
  '2017': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3319/{z}/{y}/{x}',
      maxZoom: 19,
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
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
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: '2015'
  }),
  '2014': new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: 'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/3026/{z}/{y}/{x}',
      maxZoom: 19,
      crossOrigin: 'anonymous',
      tileLoadFunction: function (imageTile, src) {
        imageTile.getImage().src = src;
      }
    }),
    visible: false,
    name: 'February 2014'
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

    source.on('tileloaderror', function (event) {
      console.error(`❌ ${layerKey}: Tile load error:`, event.tile.getTileCoord(), event);
    });

  } else {
    console.error(`❌ Base layer '${layerKey}' not found`);
    console.log('Available layers:', Object.keys(baseLayers));
  }
};

console.log('🌍 ArcGIS Wayback Integration loaded successfully!')