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
  extent: null,
  currentScale: null,
  currentCenter: [927319.695213, 6277180.746092]
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
// SCALE CONTROL SETUP
// ===========================================

// Create custom scale control class
class CustomScaleControl extends ol.control.Control {
  constructor(opt_options) {
    const options = opt_options || {};
    
    const element = document.createElement('div');
    element.className = 'ol-scale-control ol-unselectable ol-control';
    element.innerHTML = '<div class="scale-text">1 / 1.000</div>';
    
    super({
      element: element,
      target: options.target,
    });
    
    this.scaleText = element.querySelector('.scale-text');
  }
  
  updateScale(scale) {
    if (this.scaleText) {
      this.scaleText.textContent = `1 / ${scale.toLocaleString()}`;
    }
  }
}

// Add custom scale control
const scaleControl = new CustomScaleControl();
window.map.addControl(scaleControl);

// Store reference to scale control for access
window.scaleControl = scaleControl;

// Initialize scale control with current map scale and capture initial values
window.map.once('rendercomplete', () => {
  const resolution = window.map.getView().getResolution();
  const initialScale = Math.round(resolution * 96 * 39.37);
  const center = window.map.getView().getCenter();
  
  // Update scale control display
  scaleControl.updateScale(initialScale);
  
  // Capture initial scale, resolution, and center values
  window.currentExtent.currentScale = initialScale;
  window.currentExtent.currentResolution = resolution;
  window.currentExtent.currentCenter = center;
  
  console.log('Initial OpenLayers state captured:', {
    initialScale: initialScale,
    resolution: resolution,
    center: center
  });
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
// SIMPLE EXTENT SYNCHRONIZATION
// ===========================================

// Flag to prevent updating stored values during programmatic changes
let isUpdatingFromSync = false;

// Function to update currentExtent with all relevant information
function updateCurrentExtent() {
  // Don't update stored values if we're syncing from another map
  if (isUpdatingFromSync) {
    return;
  }
  
  const center = window.map.getView().getCenter();
  const zoom = window.map.getView().getZoom();
  const resolution = window.map.getView().getResolution();
  const extent = window.map.getView().calculateExtent();
  
  // Calculate scale from resolution for display
  const scale = Math.round(resolution * 96 * 39.37);
  
  // Store all relevant information for synchronization
  window.currentExtent.extent = extent;
  window.currentExtent.center = center;
  window.currentExtent.zoom = zoom;
  window.currentExtent.resolution = resolution;
  window.currentExtent.currentScale = scale;
  window.currentExtent.currentCenter = center;
  window.currentExtent.source = 'openlayers';
  
  // Update scale control display
  if (window.scaleControl) {
    window.scaleControl.updateScale(scale);
  }
}

// Listen for map extent changes and update window.currentExtent
window.map.getView().on('change:center', updateCurrentExtent);
window.map.getView().on('change:zoom', updateCurrentExtent);
window.map.getView().on('change:resolution', updateCurrentExtent);

// Simple function to update OpenLayers view from window.currentExtent
window.updateOpenLayersFromCurrentExtent = function() {
  if (window.map && window.currentExtent) {
    // Set flag to prevent updateCurrentExtent from overriding our values
    isUpdatingFromSync = true;
    
    // Use the stored center and zoom
    const targetCenter = window.currentExtent.currentCenter || window.currentExtent.center;
    let targetZoom = window.currentExtent.zoom || 15;
    
    // If coming from Cadenza, convert zoom level
    if (window.currentExtent.source === 'cadenza' && window.cadenzaZoomToOlZoom) {
      targetZoom = window.cadenzaZoomToOlZoom(targetZoom);
      console.log('Converting Cadenza zoom to OL zoom:', {
        cadenzaZoom: window.currentExtent.zoom,
        convertedOlZoom: targetZoom
      });
    }
    
    window.map.getView().setCenter(targetCenter);
    window.map.getView().setZoom(targetZoom);
    
    console.log('OpenLayers view updated:', {
      center: targetCenter,
      zoom: targetZoom,
      source: window.currentExtent.source
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromSync = false;
    }, 100);
  }
};