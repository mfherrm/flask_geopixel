// Using the bundled version of OpenLayers

// Import all vector layers from dedicated module
import {
  getAllVectorLayersArray,
  allVectorLayers,
  showLayerStatsModal,
  hideLayerStatsModal
} from './vector-layers.js';

// Import all base layers from dedicated module
import {
  baseLayers,
  getAllBaseLayersArray,
  switchBaseLayer,
  testWaybackURL,
  compareLayers,
  getCurrentBaseLayer,
  setBaseLayerOpacity,
  switchToWaybackTime
} from './base-layers.js';

// Import geometry utilities
import { addRectangleToLayer } from './geometry-utils.js';

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
window.testWaybackURL = testWaybackURL;
window.compareLayers = compareLayers;
window.getCurrentBaseLayer = getCurrentBaseLayer;
window.setBaseLayerOpacity = setBaseLayerOpacity;
window.switchToWaybackTime = switchToWaybackTime;


// Expose geometry utilities to window for backward compatibility
window.addRectangleToLayer = addRectangleToLayer;

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