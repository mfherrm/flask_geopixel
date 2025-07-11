import './cadenza3.0.4.js';
import {
  olZoomToCadenzaZoom,
  cadenzaZoomToOlZoom,
  extentToCenter,
  extentToZoom,
  centerToExtent,
  zoomToResolution,
  zoomToScale
} from './scale-sync.js';

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
        
        // Calculate resolution and scale using utility functions
        const resolution = zoomToResolution(zoom);
        const scale = zoomToScale(zoom);
        
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
