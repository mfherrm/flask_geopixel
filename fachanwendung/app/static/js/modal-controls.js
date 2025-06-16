/**
 * Modal Controls Functionality
 * Handles all modal interactions and controls
 */

// Import modal functions from vector-functions module
import {
  showLayerStatsModal,
  hideLayerStatsModal
} from './vector-functions.js';

// Initialize modal functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Stats button event listener
  const statsButton = document.getElementById('layer-stats-btn');
  if (statsButton) {
    statsButton.addEventListener('click', function() {
      showLayerStatsModal();
    });
  }

  // Modal close button event listener
  const closeButton = document.getElementById('stats-modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      hideLayerStatsModal();
    });
  }

  // Close modal when clicking outside of it
  const modal = document.getElementById('layer-stats-modal');
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        hideLayerStatsModal();
      }
    });
  }
});

// Expose stats functions to window for debugging/external access
window.showLayerStatsModal = showLayerStatsModal;
window.hideLayerStatsModal = hideLayerStatsModal;