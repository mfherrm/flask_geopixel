import './cadenza3.0.4.js';
import {
  checkCadenzaServerConnectivity,
  waitForCadenzaServer,
  retryWithBackoff,
  networkMonitor,
  showNetworkErrorMessage
} from './network-utils.js';

// Global variable to store current Cadenza extent
window.cadenzaCurrentExtent = [];

window.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('cadenza-iframe')) {
    
    // Check server connectivity before initializing Cadenza
    console.log('Checking Cadenza server availability...');
    const serverAvailable = await waitForCadenzaServer('http://localhost:8080/cadenza/', 5, 1000);
    
    if (!serverAvailable) {
      console.warn('Cadenza server is not available, but proceeding with initialization...');
      // Still proceed as the server might become available later
    }

    window.cadenzaClient = cadenza({
      baseUrl: 'http://localhost:8080/cadenza/',
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "_DS4kjgAp5On-lHnEgIi",
        externalLinkId: "mgsctVdrerBV8101oFtX"
      },
    });

    // Add error event listener with network-aware handling
    window.cadenzaClient.on('error', (event) => {
      console.error('Cadenza error event:', event.detail);
      if (event.detail.type === 'loading-error') {
        console.log('Received loading error, checking network and retrying...');
        
        // Check network status before retrying
        if (!networkMonitor.getStatus()) {
          console.warn('Network is offline, waiting for connection...');
          const onlineHandler = () => {
            console.log('Network restored, retrying map load...');
            loadMapWithNetworkAwareness();
            networkMonitor.removeListener(onlineHandler);
          };
          networkMonitor.addListener(onlineHandler);
        } else {
          setTimeout(() => {
            loadMapWithNetworkAwareness();
          }, 1000);
        }
      }
    });

    // Network-aware map loading function
    const loadMapWithNetworkAwareness = async () => {
      try {
        // Check network connectivity first
        if (!networkMonitor.getStatus()) {
          console.warn('Network is offline, cannot load map');
          return;
        }

        // Check server connectivity
        const serverAvailable = await checkCadenzaServerConnectivity();
        if (!serverAvailable) {
          console.warn('Cadenza server not reachable, retrying in 5 seconds...');
          setTimeout(loadMapWithNetworkAwareness, 5000);
          return;
        }

        // Use retry with backoff for map loading
        await retryWithBackoff(async () => {
          return window.cadenzaClient.showMap('satellitenkarte', {
            useMapSrs: true,
            // extent is minx, miny, maxx, maxy
          });
        }, 3, 1000, 8000);
        
        console.log('Cadenza map loaded successfully');
      } catch (error) {
        console.error('Failed to load Cadenza map:', error);
        showNetworkErrorMessage(error, 'map loading');
      }
    };

    // Initial map load with network awareness
    loadMapWithNetworkAwareness();

    // Listen for extent changes and store the current extent
    window.cadenzaClient.on('change:extent', (event) => {
      console.log('Cadenza extent changed:', event);
      if (event.detail && event.detail.extent) {
        window.cadenzaCurrentExtent = event.detail.extent;
        console.log('Updated Cadenza current extent:', window.cadenzaCurrentExtent);
      }
    });
  }
});