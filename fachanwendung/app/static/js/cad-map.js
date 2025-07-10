import './cadenza3.0.4.js';

// Flag to track initialization vs user interaction
let cadenzaInitialized = false;

// Optimized zoom level mapping functions for accurate scale synchronization
function olZoomToCadenzaZoom(olZoom) {
  // This works perfectly - keep as is
  return olZoom - 0.7;
}

function cadenzaZoomToOlZoom(cadenzaZoom) {
  // OL scales improved from 2.0x to 1.5x, need more zoom in to reach 1.0x
  return cadenzaZoom + 1.3;
}

// Expose zoom mapping functions for testing
window.olZoomToCadenzaZoom = olZoomToCadenzaZoom;
window.cadenzaZoomToOlZoom = cadenzaZoomToOlZoom;

// Testing function to fine-tune the asymmetric zoom mapping
window.testZoomMapping = function(testOffset) {
  console.log(`Testing CAD→OL offset from base +1.3: ${testOffset}`);
  
  // Keep OL→CAD fixed (working perfectly), adjust CAD→OL
  window.olZoomToCadenzaZoom = function(olZoom) {
    return olZoom - 0.7; // Keep this fixed - works perfectly
  };
  
  window.cadenzaZoomToOlZoom = function(cadenzaZoom) {
    return cadenzaZoom + 1.3 + testOffset; // Base +1.3 plus fine-tuning
  };
  
  console.log('Zoom mapping updated. OL→CAD fixed, adjusting CAD→OL.');
  console.log('Progress: OL scales improved from 2.0x to 1.5x CAD scales');
  console.log('Target: Get OL scales to match CAD scales (1.0x ratio)');
  console.log('Call testZoomMapping(X) with values like -0.2, -0.1, 0, 0.1, 0.2');
  console.log('Positive values = OL zooms in more (lower scale numbers)');
};

// Function to convert extent to center/zoom format
function extentToCenter(extent) {
  if (!extent || extent.length < 4) return null;
  
  const centerX = (extent[0] + extent[2]) / 2;
  const centerY = (extent[1] + extent[3]) / 2;
  
  return [centerX, centerY];
}

// Function to calculate zoom level from extent
function extentToZoom(extent) {
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

// Function to convert center/zoom to extent
function centerToExtent(center, zoom) {
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
      // Convert OpenLayers zoom to Cadenza zoom
      const cadenzaZoom = Math.round(olZoomToCadenzaZoom(window.currentExtent.zoom));
      const calculatedExtent = centerToExtent(window.currentExtent.center, cadenzaZoom);
      
      showMapOptions.extentStrategy = {
        type: 'static',
        extent: calculatedExtent
      };
      
      console.log('Cadenza initialized with extent strategy:', {
        center: window.currentExtent.center,
        originalOlZoom: window.currentExtent.zoom,
        mappedCadenzaZoom: cadenzaZoom,
        calculatedExtent: calculatedExtent
      });
    }

    window.cadenzaClient.showMap('satellitenkarte', showMapOptions);

    // Flag to prevent updating stored values during programmatic changes
    let isUpdatingCadenzaFromSync = false;
    
    // Listen for extent changes and update window.currentExtent
    window.cadenzaClient.on('change:extent', (event) => {
      // Don't update stored values if we're syncing from another map
      if (isUpdatingCadenzaFromSync) {
        return;
      }
      
      if (event.detail && event.detail.extent) {
        const extent = event.detail.extent;
        const center = extentToCenter(extent);
        const zoom = extentToZoom(extent);
        
        // Calculate resolution and scale
        const resolution = 156543.03392804097 / Math.pow(2, zoom);
        const scale = Math.round(resolution * 96 * 39.37);
        
        if (center && window.currentExtent) {
          // Store the extent information for synchronization
          window.currentExtent.extent = extent;
          window.currentExtent.center = center;
          window.currentExtent.zoom = zoom;
          window.currentExtent.resolution = resolution;
          window.currentExtent.currentScale = scale;
          window.currentExtent.currentCenter = center;
          window.currentExtent.source = 'cadenza';
          
        }
      }
    });
    
    // Expose the sync flag for the update function
    window.setUpdatingCadenzaFromSync = function(flag) {
      isUpdatingCadenzaFromSync = flag;
    };
  }
});

// Simple function to update Cadenza view from window.currentExtent
window.updateCadenzaFromCurrentExtent = function() {
  if (window.cadenzaClient && window.currentExtent) {
    // Set flag to prevent extent change listener from overriding our values
    if (window.setUpdatingCadenzaFromSync) {
      window.setUpdatingCadenzaFromSync(true);
    }
    
    const targetCenter = window.currentExtent.currentCenter || window.currentExtent.center;
    let cadenzaZoom;
    
    // Convert from OpenLayers zoom to Cadenza zoom
    if (window.currentExtent.source === 'openlayers' || !window.currentExtent.source) {
      cadenzaZoom = Math.round(olZoomToCadenzaZoom(window.currentExtent.zoom));
    } else {
      cadenzaZoom = Math.round(window.currentExtent.zoom);
    }
    
    // Calculate extent based on center and Cadenza zoom
    const calculatedExtent = centerToExtent(targetCenter, cadenzaZoom);
    
    // Use extent strategy with calculated extent
    window.cadenzaClient.showMap('satellitenkarte', {
      useMapSrs: true,
      extentStrategy: {
        type: 'static',
        extent: calculatedExtent
      }
    });
    
    console.log('Cadenza view updated:', {
      center: targetCenter,
      cadenzaZoom: cadenzaZoom,
      calculatedExtent: calculatedExtent
    });
    
    // Reset flag after a short delay
    setTimeout(() => {
      if (window.setUpdatingCadenzaFromSync) {
        window.setUpdatingCadenzaFromSync(false);
      }
    }, 500);
  }
};

// Testing helper - CONVERGING ON PERFECT SYNCHRONIZATION
console.log('=== SCALE SYNCHRONIZATION - ALMOST THERE ===');
console.log('✅ OL→CAD: PERFECT (olZoom - 0.7)');
console.log('🎯 CAD→OL: IMPROVING (cadZoom + 1.3)');
console.log('');
console.log('PROGRESS: OL scales improved from 2.0x → 1.5x CAD scales');
console.log('TARGET: Reach 1.0x (equal scales) for perfect sync');
console.log('');
console.log('Current: OL→CAD (-0.7), CAD→OL (+1.3)');
console.log('Fine-tune with testZoomMapping(X) to reach 1.0x ratio');
console.log('Very close to achieving perfect bidirectional sync!');