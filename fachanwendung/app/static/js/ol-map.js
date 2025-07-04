// Using the bundled version of OpenLayers

// Import all vector layers from dedicated module
import {
  getAllVectorLayersArray,
  allVectorLayers
} from './vector-layers.js';
import { toggleLayerSwitcher } from './vector-functions.js';

// Import all base layers from dedicated module
import {
  baseLayers,
  getAllBaseLayersArray,
  switchBaseLayer,
} from './base-layers.js';

// Import geometry utilities
import { addRectangleToLayer } from './geometry-utils.js';

// ===========================================
// CURRENT EXTENT MANAGEMENT
// ===========================================

// Initialize global current extent variable with default center
window.currentExtent = {
  center: [927319.695213, 6277180.746092],
  zoom: 15,
  extent: null // Will store the actual map extent
};

// ===========================================
// MAP INITIALIZATION
// ===========================================

// Create map with base layers, GeoJSON layer, and vector layers
window.map = new ol.Map({
  layers: [
    // Add all base layers from the dedicated module
    ...getAllBaseLayersArray(),
    // Add GeoJSON layer for geographic boundaries
    new ol.layer.Vector({
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: '/static/geodata/deutschlandGeoJSON/4_kreise/2_hoch.geo.json',
      }),
      style: new ol.style.Style({
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
    center: window.currentExtent.center,
    zoom: window.currentExtent.zoom,
    projection: 'EPSG:3857'
  }),
  target: 'OL-map',
});

// ===========================================
// WINDOW OBJECT EXPOSURES FOR BACKWARD COMPATIBILITY
// ===========================================

// Expose all vector layers to window for backward compatibility
Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
  window[layerName] = layer;
});

// Expose base layers and utilities to window for backward compatibility
window.baseLayers = baseLayers;
window.switchBaseLayer = switchBaseLayer;

// Expose geometry utilities to window for backward compatibility
window.addRectangleToLayer = addRectangleToLayer;

// ===========================================
// LAYER SWITCHING CONTROL
// ===========================================

// Expose layer switcher function to window for backward compatibility
window.toggleLayerSwitcher = toggleLayerSwitcher;

console.log('Layer switcher control initialized in HTML template');

// ===========================================
// EXTENT SYNCHRONIZATION
// ===========================================

// Function to update currentExtent with all relevant information
function updateCurrentExtent() {
  const center = window.map.getView().getCenter();
  const zoom = window.map.getView().getZoom();
  const resolution = window.map.getView().getResolution();
  const extent = window.map.getView().calculateExtent();
  
  window.currentExtent.center = center;
  window.currentExtent.zoom = zoom;
  window.currentExtent.resolution = resolution;
  window.currentExtent.extent = extent; // Store the actual extent
  window.currentExtent.source = 'openlayers'; // Track that this comes from OpenLayers
  
  console.log('OpenLayers extent updated:', {
    center: window.currentExtent.center,
    zoom: window.currentExtent.zoom,
    resolution: window.currentExtent.resolution,
    extent: window.currentExtent.extent,
    source: window.currentExtent.source
  });
}

// Listen for map extent changes and update window.currentExtent
window.map.getView().on('change:center', updateCurrentExtent);
window.map.getView().on('change:zoom', updateCurrentExtent);
window.map.getView().on('change:resolution', updateCurrentExtent);

// Expose function to update OpenLayers view from window.currentExtent
window.updateOpenLayersFromCurrentExtent = function() {
  if (window.map && window.currentExtent) {
    let targetZoom = window.currentExtent.zoom;
    
    // If the current extent comes from Cadenza, convert the zoom level
    if (window.currentExtent.source === 'cadenza' && window.cadenzaZoomToOlZoom) {
      targetZoom = window.cadenzaZoomToOlZoom(window.currentExtent.zoom);
      console.log('Converting Cadenza zoom to OpenLayers zoom:', {
        cadenzaZoom: window.currentExtent.zoom,
        convertedOlZoom: targetZoom
      });
    }
    
    // Set center and converted zoom
    window.map.getView().setCenter(window.currentExtent.center);
    window.map.getView().setZoom(targetZoom);
    
    console.log('OpenLayers view updated with mapped zoom:', {
      center: window.currentExtent.center,
      originalZoom: window.currentExtent.zoom,
      targetZoom: targetZoom,
      source: window.currentExtent.source
    });
  }
};