/**
 * Scale Synchronization Module for GeoPixel Application
 * 
 * This module contains all zoom level mapping and extent conversion functions
 * for synchronizing between OpenLayers and Cadenza maps.
 */

// ===========================================
// ZOOM LEVEL MAPPING FUNCTIONS
// ===========================================

/**
 * Convert OpenLayers zoom to Cadenza zoom level
 * @param {number} olZoom - OpenLayers zoom level
 * @returns {number} Cadenza zoom level
 */
export function olZoomToCadenzaZoom(olZoom) {
  // This works perfectly - keep as is
  return olZoom - 0.7;
}

/**
 * Convert Cadenza zoom to OpenLayers zoom level
 * @param {number} cadenzaZoom - Cadenza zoom level
 * @returns {number} OpenLayers zoom level
 */
export function cadenzaZoomToOlZoom(cadenzaZoom) {
  // OL scales improved from 2.0x to 1.5x, need more zoom in to reach 1.0x
  return cadenzaZoom + 1.3;
}

// ===========================================
// EXTENT CONVERSION FUNCTIONS
// ===========================================

/**
 * Convert extent to center point
 * @param {Array} extent - [minX, minY, maxX, maxY]
 * @returns {Array|null} Center point [x, y] or null if invalid
 */
export function extentToCenter(extent) {
  if (!extent || extent.length < 4) return null;
  
  const centerX = (extent[0] + extent[2]) / 2;
  const centerY = (extent[1] + extent[3]) / 2;
  
  return [centerX, centerY];
}

/**
 * Calculate zoom level from extent
 * @param {Array} extent - [minX, minY, maxX, maxY]
 * @returns {number} Zoom level (defaults to 15 if invalid)
 */
export function extentToZoom(extent) {
  if (!extent || extent.length < 4) return 15; // Default zoom
  
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  
  // Use the larger dimension to calculate zoom
  const maxDimension = Math.max(width, height);
  
  // Calculate resolution and then zoom
  const resolution = maxDimension / 512; // Standard viewport calculation
  const zoom = Math.log2(156543.03392804097 / resolution);
  
  // Clamp zoom to reasonable bounds
  return Math.max(1, Math.min(20, Math.round(zoom)));
}

/**
 * Convert center point and zoom to extent
 * @param {Array} center - Center point [x, y]
 * @param {number} zoom - Zoom level
 * @returns {Array|null} Extent [minX, minY, maxX, maxY] or null if invalid
 */
export function centerToExtent(center, zoom) {
  if (!center || center.length < 2 || !zoom) return null;
  
  // Calculate extent based on zoom level
  const resolution = 156543.03392804097 / Math.pow(2, zoom);
  const halfWidth = resolution * 512 / 2;   // Standard 512px viewport
  const halfHeight = resolution * 512 / 2;  // Standard 512px viewport
  
  return [
    center[0] - halfWidth,
    center[1] - halfHeight,
    center[0] + halfWidth,
    center[1] + halfHeight
  ];
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Calculate map resolution from zoom level
 * @param {number} zoom - Zoom level
 * @returns {number} Resolution in map units per pixel
 */
export function zoomToResolution(zoom) {
  return 156543.03392804097 / Math.pow(2, zoom);
}

/**
 * Calculate map scale from zoom level
 * @param {number} zoom - Zoom level
 * @returns {number} Scale denominator
 */
export function zoomToScale(zoom) {
  const resolution = zoomToResolution(zoom);
  return Math.round(resolution * 96 * 39.37);
}