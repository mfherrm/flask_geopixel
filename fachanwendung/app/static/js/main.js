/**
 * Main JavaScript Module for GeoPixel Application
 *
 * This module handles:
 * - Application initialization
 * - Module loading and coordination
 * - Stats panel setup
 * - Event listeners for UI components
 * - Cadenza geometry tracking layer
 *
 * CADENZA TRACKING LAYER:
 * When using Cadenza mode, all newly added geometries are automatically
 * tracked in a single dedicated layer. Use these console commands:
 *
 * - cadenzaTracking.count()  // Get number of tracked objects
 * - cadenzaTracking.show()   // Show tracking layer
 * - cadenzaTracking.hide()   // Hide tracking layer
 * - cadenzaTracking.clear()  // Clear all tracked objects
 * - cadenzaTracking.info()   // Get detailed information
 * - cadenzaTracking.toggle() // Toggle layer visibility
 */

// Import core modules in dependency order
import './ol-map.js';                    // Map initialization (creates window.map)
import './cad-map.js';                   // Cadenza map functionality
import './funcs.js';                     // GeoPixel functionality
import './chat-functions.js';            // Chat functionality
import './dropup-controls.js';           // Dropdown menus
import './runpod-manager.js';            // RunPod management
import './runpod-toggle.js';             // RunPod toggle
import './modal-controls.js';            // Modal dialogs
import './tile-processing.js';           // Tile processing

// Import required functions from vector-functions module
import {
  initializeStatsPanel,
  updateStatsTable,
  refreshStatsTable,
  showLayerStatsModal,
  hideLayerStatsModal,
  showLayerOverlapAnalysis,
  toggleLayerSwitcher
} from './vector-functions.js';

// Import base layer functions
import {
  switchBaseLayer
} from './base-layers.js';

console.log('All modules loaded successfully');

// ===========================================
// APPLICATION INITIALIZATION
// ===========================================

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('GeoPixel application initializing...');
  
  // Wait for the map and all modules to be fully initialized
  const checkMapInterval = setInterval(() => {
    if (window.map && window.map.getLayers) {
      clearInterval(checkMapInterval);
      // Additional delay to ensure all layers are properly loaded
      setTimeout(() => {
        initializeApplication();
      }, 500);
    }
  }, 200);
  
  // Fallback timeout to initialize gracefully even without map
  setTimeout(() => {
    clearInterval(checkMapInterval);
    if (window.map) {
      console.log('Map found after timeout, initializing stats panel');
      initializeApplication();
    } else {
      console.warn('Map not found after timeout, initializing basic functionality only');
      initializeBasicFunctionality();
    }
  }, 10000); // Increased timeout to 10 seconds
});

/**
 * Initialize basic functionality when map is not available
 */
function initializeBasicFunctionality() {
  // Setup modal event listeners without map dependency
  setupModalEventListeners();
  
  // Show empty state in stats panel
  const container = document.getElementById('layer-stats-table-container');
  if (container) {
    container.innerHTML = `
      <div class="stats-empty-state">
        <p>Map not loaded</p>
        <p>Please refresh the page to reload the map.</p>
      </div>
    `;
  }
  
  // Expose functions to window for manual use
  if (typeof initializeStatsPanel !== 'undefined') {
    window.initializeStatsPanel = initializeStatsPanel;
  }
  
  console.log('Basic functionality initialized without map');
}

/**
 * Main application initialization function
 */
function initializeApplication() {
  console.log('Map detected, initializing stats panel...');
  
  // Initialize the stats panel
  initializeStatsPanel();
  
  // Setup event listeners for modal controls
  setupModalEventListeners();
  
  console.log('GeoPixel application initialized successfully');
}

// ===========================================
// EVENT LISTENERS SETUP
// ===========================================

/**
 * Setup event listeners for modal controls
 */
function setupModalEventListeners() {
  // Close modal when clicking the X button
  const closeBtn = document.getElementById('stats-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideLayerStatsModal);
  }
  
  // Close modal when clicking outside of it
  const modal = document.getElementById('layer-stats-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideLayerStatsModal();
      }
    });
  }
  
  // Handle ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideLayerStatsModal();
    }
  });
}

// Periodic refresh removed - stats are now updated only when:
// 1. Radio button is switched to Cadenza mode
// 2. Geometry is added to the database (already implemented)

// ===========================================
// GLOBAL EXPORTS FOR BACKWARD COMPATIBILITY
// ===========================================

// Expose functions to window for HTML onclick handlers and console access
window.initializeStatsPanel = initializeStatsPanel;
window.refreshStatsTable = refreshStatsTable;
window.showLayerOverlapAnalysis = showLayerOverlapAnalysis;
window.toggleLayerSwitcher = toggleLayerSwitcher;
window.switchBaseLayer = switchBaseLayer;

// ===========================================
// DEBUG AND DEVELOPMENT HELPERS
// ===========================================

// Add some debug helpers for development
if (typeof window !== 'undefined') {
  window.geoPixelDebug = {
    refreshStats: refreshStatsTable,
    showModal: showLayerStatsModal,
    hideModal: hideLayerStatsModal,
    showOverlap: showLayerOverlapAnalysis,
    version: '2.0.0',
    // Cadenza tracking helpers
    tracking: {
      count: () => window.cadenzaTracking?.count(),
      show: () => window.cadenzaTracking?.show(),
      hide: () => window.cadenzaTracking?.hide(),
      clear: () => window.cadenzaTracking?.clear(),
      info: () => window.cadenzaTracking?.info(),
      toggle: () => window.cadenzaTracking?.toggle()
    }
  };
  
  console.log('Debug helpers available at window.geoPixelDebug');
  console.log('Cadenza tracking helpers available at window.cadenzaTracking');
}