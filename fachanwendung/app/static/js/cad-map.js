import './cadenza3.0.4.js';

// Flag to track initialization vs user interaction
let cadenzaInitialized = false;

// Zoom level mapping functions - TESTING PHASE
// Need to find the right conversion factor through testing

function olZoomToCadenzaZoom(olZoom) {
  // Based on precise measurements with 5 calibration points:
  // CAD 8.177032656780806 → OL 11.807070706853937
  // CAD 12.0 → OL 12.725677552260269
  // CAD 13.5 → OL 15.0
  // CAD 16.5 → OL 17.387931494506258
  // CAD 17.78592007692397 → OL 19.87510824301898
  
  // Define calibration points (OL → CAD) - sorted by OL zoom
  const calibrationPoints = [
    { ol: 11.807070706853937, cad: 8.177032656780806 },
    { ol: 12.725677552260269, cad: 12.0 },
    { ol: 15.0, cad: 13.5 },
    { ol: 17.387931494506258, cad: 16.5 },
    { ol: 19.87510824301898, cad: 17.78592007692397 }
  ];
  
  // Linear interpolation between closest points
  for (let i = 0; i < calibrationPoints.length - 1; i++) {
    const p1 = calibrationPoints[i];
    const p2 = calibrationPoints[i + 1];
    
    if (olZoom >= p1.ol && olZoom <= p2.ol) {
      // Linear interpolation
      const ratio = (olZoom - p1.ol) / (p2.ol - p1.ol);
      return p1.cad + ratio * (p2.cad - p1.cad);
    }
  }
  
  // Extrapolation for values outside calibration range
  if (olZoom < calibrationPoints[0].ol) {
    // Extrapolate below lowest point
    const p1 = calibrationPoints[0];
    const p2 = calibrationPoints[1];
    const slope = (p2.cad - p1.cad) / (p2.ol - p1.ol);
    return p1.cad + slope * (olZoom - p1.ol);
  } else {
    // Extrapolate above highest point
    const p1 = calibrationPoints[calibrationPoints.length - 2];
    const p2 = calibrationPoints[calibrationPoints.length - 1];
    const slope = (p2.cad - p1.cad) / (p2.ol - p1.ol);
    return p1.cad + slope * (olZoom - p1.ol);
  }
}

function cadenzaZoomToOlZoom(cadenzaZoom) {
  // Based on precise measurements (reverse mapping) with 5 calibration points:
  // CAD 8.177032656780806 → OL 11.807070706853937
  // CAD 12.0 → OL 12.725677552260269
  // CAD 13.5 → OL 15.0
  // CAD 16.5 → OL 17.387931494506258
  // CAD 17.78592007692397 → OL 19.87510824301898
  
  // Define calibration points (CAD → OL) - sorted by CAD zoom
  const calibrationPoints = [
    { cad: 8.177032656780806, ol: 11.807070706853937 },
    { cad: 12.0, ol: 12.725677552260269 },
    { cad: 13.5, ol: 15.0 },
    { cad: 16.5, ol: 17.387931494506258 },
    { cad: 17.78592007692397, ol: 19.87510824301898 }
  ];
  
  // Linear interpolation between closest points
  for (let i = 0; i < calibrationPoints.length - 1; i++) {
    const p1 = calibrationPoints[i];
    const p2 = calibrationPoints[i + 1];
    
    if (cadenzaZoom >= p1.cad && cadenzaZoom <= p2.cad) {
      // Linear interpolation
      const ratio = (cadenzaZoom - p1.cad) / (p2.cad - p1.cad);
      return p1.ol + ratio * (p2.ol - p1.ol);
    }
  }
  
  // Extrapolation for values outside calibration range
  if (cadenzaZoom < calibrationPoints[0].cad) {
    // Extrapolate below lowest point
    const p1 = calibrationPoints[0];
    const p2 = calibrationPoints[1];
    const slope = (p2.ol - p1.ol) / (p2.cad - p1.cad);
    return p1.ol + slope * (cadenzaZoom - p1.cad);
  } else {
    // Extrapolate above highest point
    const p1 = calibrationPoints[calibrationPoints.length - 2];
    const p2 = calibrationPoints[calibrationPoints.length - 1];
    const slope = (p2.ol - p1.ol) / (p2.cad - p1.cad);
    return p1.ol + slope * (cadenzaZoom - p1.cad);
  }
}

// Testing function to help determine the right zoom mapping
window.testZoomMapping = function(testOffset) {
  console.log(`Testing zoom offset: ${testOffset}`);
  
  // Temporarily override the functions for testing
  window.olZoomToCadenzaZoom = function(olZoom) {
    return olZoom + testOffset;
  };
  
  window.cadenzaZoomToOlZoom = function(cadenzaZoom) {
    return cadenzaZoom - testOffset;
  };
  
  console.log('Zoom mapping updated. Switch between maps to test harbor size comparison.');
  console.log('Call testZoomMapping(X) with different values like 0.1, 0.3, 0.7, 1.0, etc.');
};

// Function to convert extent to center/zoom format
function extentToCenter(extent) {
  if (!extent || extent.length < 4) return null;
  
  const centerX = (extent[0] + extent[2]) / 2;
  const centerY = (extent[1] + extent[3]) / 2;
  
  return [centerX, centerY];
}

// Function to calculate zoom level and resolution from extent
function extentToZoomAndResolution(extent) {
  if (!extent || extent.length < 4) return { zoom: 15, resolution: 156543.03392804097 / Math.pow(2, 15) }; // Default values
  
  const width = extent[2] - extent[0];
  const height = extent[3] - extent[1];
  
  // Use the larger dimension to calculate resolution
  const maxDimension = Math.max(width, height);
  
  // Calculate resolution based on standard viewport
  const resolution = maxDimension / 512; // Standard viewport calculation
  
  // Calculate zoom based on resolution (no artificial adjustments)
  // Resolution at zoom 0 is approximately 156543.03392804097 meters per pixel
  const zoom = Math.log2(156543.03392804097 / resolution);
  
  // Clamp zoom to reasonable bounds without artificial offsets
  const clampedZoom = Math.max(1, Math.min(20, Math.round(zoom)));
  
  return {
    zoom: clampedZoom,
    resolution: 156543.03392804097 / Math.pow(2, clampedZoom)
  };
}

// Function to convert center/zoom to extent
function centerToExtent(center, zoom) {
  if (!center || center.length < 2 || !zoom) return null;
  
  // Calculate extent based on zoom level
  const resolution = 156543.03392804097 / Math.pow(2, zoom);
  // Use standard viewport size - zoom mapping handles scale differences
  const halfWidth = resolution * 512 / 2;   // Standard 512px viewport
  const halfHeight = resolution * 512 / 2;  // Standard 512px viewport
  
  return [
    center[0] - halfWidth,
    center[1] - halfHeight,
    center[0] + halfWidth,
    center[1] + halfHeight
  ];
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {
    window.cadenzaClient = cadenza({
      baseUrl: 'http://localhost:8080/cadenza/',
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "_DS4kjgAp5On-lHnEgIi",
        externalLinkId: "mgsctVdrerBV8101oFtX"
      },
    });

    // Show map with current extent if available
    const showMapOptions = {
      useMapSrs: true,
    };
    
    // If window.currentExtent is available, use extent strategy for initial view
    if (window.currentExtent && window.currentExtent.center) {
      // Convert OpenLayers zoom to Cadenza zoom and round to whole number
      const cadenzaZoomFloat = olZoomToCadenzaZoom(window.currentExtent.zoom);
      const cadenzaZoom = Math.round(cadenzaZoomFloat);
      const calculatedExtent = centerToExtent(window.currentExtent.center, cadenzaZoom);
      
      showMapOptions.extentStrategy = {
        type: 'static',
        extent: calculatedExtent
      };
      
      console.log('Cadenza initialized with extent strategy:', {
        center: window.currentExtent.center,
        originalOlZoom: parseFloat(window.currentExtent.zoom.toFixed(6)),
        mappedCadenzaZoomFloat: parseFloat(cadenzaZoomFloat.toFixed(6)),
        roundedCadenzaZoom: cadenzaZoom,
        calculatedExtent: calculatedExtent
      });
      console.log(`CADENZA ZOOM ROUNDED: ${cadenzaZoom}`);
    }

    window.cadenzaClient.showMap('satellitenkarte', showMapOptions);

    // Listen for extent changes and update window.currentExtent
    window.cadenzaClient.on('change:extent', (event) => {
      console.log('Cadenza extent changed:', event);
      if (event.detail && event.detail.extent) {
        const extent = event.detail.extent;
        const center = extentToCenter(extent);
        const { zoom, resolution } = extentToZoomAndResolution(extent);
        
        if (center && window.currentExtent) {
          if (!cadenzaInitialized) {
            // First extent change - this is initialization, force correct zoom
            cadenzaInitialized = true;
            
            // Force the zoom to be the correctly mapped value, rounded to whole number
            const correctCadZoomFloat = olZoomToCadenzaZoom(window.currentExtent.zoom);
            const correctCadZoom = Math.round(correctCadZoomFloat);
            const correctOlZoom = cadenzaZoomToOlZoom(correctCadZoom);
            
            window.currentExtent.center = center;
            window.currentExtent.zoom = correctOlZoom; // Force correct mapped zoom
            window.currentExtent.extent = extent;
            window.currentExtent.source = 'cadenza';
            
            console.log('Cadenza initialization - forcing correct zoom:', {
              originalOlZoom: parseFloat(window.currentExtent.zoom.toFixed(6)),
              correctCadZoomFloat: parseFloat(correctCadZoomFloat.toFixed(6)),
              roundedCadZoom: correctCadZoom,
              finalOlZoom: parseFloat(correctOlZoom.toFixed(6)),
              extentBasedZoom: parseFloat(zoom.toFixed(6)) // This was wrong (12.73)
            });
            console.log(`CADENZA ZOOM ROUNDED (initialization): ${correctCadZoom}`);
          } else {
            // Subsequent changes - allow zoom updates for user interaction, rounded to whole number
            const extentBasedZoomFloat = zoom;
            const extentBasedZoom = Math.round(extentBasedZoomFloat);
            const equivalentOlZoom = cadenzaZoomToOlZoom(extentBasedZoom);
            
            window.currentExtent.center = center;
            window.currentExtent.zoom = equivalentOlZoom; // Allow zoom updates
            window.currentExtent.extent = extent;
            window.currentExtent.source = 'cadenza';
            
            console.log('Cadenza user interaction - updating zoom:', {
              cadenzaZoomFloat: parseFloat(extentBasedZoomFloat.toFixed(6)),
              roundedCadenzaZoom: extentBasedZoom,
              equivalentOlZoom: parseFloat(equivalentOlZoom.toFixed(6))
            });
            console.log(`CADENZA ZOOM ROUNDED (user interaction): ${extentBasedZoom}`);
          }
        }
      }
    });
  }
});

// Expose function to update Cadenza view from window.currentExtent
window.updateCadenzaFromCurrentExtent = function() {
  if (window.cadenzaClient && window.currentExtent && window.currentExtent.center) {
    // Reset initialization flag to allow proper zoom updates during switching
    cadenzaInitialized = true;
    
    let sourceZoom = window.currentExtent.zoom;
    let cadenzaZoom;
    
    // If the current extent comes from OpenLayers, convert the zoom level and round to whole number
    if (window.currentExtent.source === 'openlayers' || !window.currentExtent.source) {
      const cadenzaZoomFloat = (window.olZoomToCadenzaZoom || olZoomToCadenzaZoom)(sourceZoom);
      cadenzaZoom = Math.round(cadenzaZoomFloat);
      console.log('Converting OpenLayers zoom to Cadenza zoom:', {
        olZoom: parseFloat(sourceZoom.toFixed(6)),
        convertedCadenzaZoomFloat: parseFloat(cadenzaZoomFloat.toFixed(6)),
        roundedCadenzaZoom: cadenzaZoom
      });
      console.log(`CADENZA ZOOM ROUNDED (from OpenLayers): ${cadenzaZoom}`);
    } else {
      // If it comes from Cadenza, round to whole number
      cadenzaZoom = Math.round(sourceZoom);
      console.log('Using Cadenza zoom directly (rounded):', cadenzaZoom);
      console.log(`CADENZA ZOOM ROUNDED (direct): ${cadenzaZoom}`);
    }
    
    // Calculate extent based on center and rounded Cadenza zoom
    const calculatedExtent = centerToExtent(window.currentExtent.center, cadenzaZoom);
    
    // Use extent strategy with properly calculated extent
    window.cadenzaClient.showMap('satellitenkarte', {
      useMapSrs: true,
      extentStrategy: {
        type: 'static',
        extent: calculatedExtent
      }
    });
    
    // Update the currentExtent to reflect the Cadenza source
    // Convert the rounded Cadenza zoom back to OpenLayers format for consistent storage
    const equivalentOlZoom = cadenzaZoomToOlZoom(cadenzaZoom);
    
    window.currentExtent.source = 'cadenza';
    window.currentExtent.zoom = equivalentOlZoom; // Store in OpenLayers format
    window.currentExtent.extent = calculatedExtent; // Update the extent
    
    console.log('Cadenza view updated with extent strategy during switch:', {
      center: window.currentExtent.center,
      sourceZoom: parseFloat(sourceZoom.toFixed(6)),
      roundedCadenzaZoom: cadenzaZoom,
      equivalentOlZoom: parseFloat(equivalentOlZoom.toFixed(6)),
      calculatedExtent: calculatedExtent,
      source: window.currentExtent.source
    });
    console.log(`CADENZA ZOOM ROUNDED (final applied): ${cadenzaZoom}`);
  }
};

// Testing helper - expose to console for easy testing
console.log('=== ZOOM MAPPING TESTING ===');
console.log('To test different zoom mappings, use: testZoomMapping(X)');
console.log('Example: testZoomMapping(0.3) to test 0.3 zoom offset');
console.log('Compare harbor size between maps to find the right offset');
console.log('Try values like: 0.1, 0.2, 0.3, 0.5, 0.7, 1.0');