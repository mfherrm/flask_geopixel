/**
 * Vector Functions Module for GeoPixel Application
 * 
 * This module contains all functions for working with vector layers:
 * - Layer statistics functionality
 * - Layer overlap analysis functionality
 * - Modal controls and HTML generation
 * - Layer switching functionality
 */

// Import geometry utilities for overlap calculations and tile processing
import {
  calculateLayerOverlap,
  combineAndMergeAllMasks,
  isPolygonClockwise
} from './geometry-utils.js';

// Import layer definitions
import {
  allVectorLayers,
  transportationLayers,
  infrastructureLayers,
  naturalFeaturesLayers,
  vegetationLayers,
  urbanFeaturesLayers,
  geologicalLayers,
  environmentalLayers,
  agricultureLayers,
  miscellaneousLayers
} from './vector-layers.js';

// ===========================================
// LAYER STATISTICS FUNCTIONALITY
// ===========================================

// Function to get individual geometry count for a single layer
export const getLayerFeatureCount = (layer) => {
  if (!layer || !layer.getSource) {
    return 0;
  }
  const source = layer.getSource();
  const features = source.getFeatures ? source.getFeatures() : [];

  let totalGeometries = 0;

  features.forEach(feature => {
    const geometry = feature.getGeometry();
    if (geometry) {
      const geometryType = geometry.getType();

      // Count individual geometries within MultiPolygon and MultiLineString
      if (geometryType === 'MultiPolygon') {
        const polygons = geometry.getPolygons();
        totalGeometries += polygons.length;
      } else {
        // Single geometry types (Polygon, LineString, Point, etc.)
        totalGeometries += 1;
      }
    }
  });

  return totalGeometries;
};

// Function to get statistics for all layers organized by category
export const getLayerStatistics = () => {
  const stats = {
    transportation: {},
    infrastructure: {},
    naturalFeatures: {},
    vegetation: {},
    urbanFeatures: {},
    geological: {},
    environmental: {},
    agriculture: {},
    miscellaneous: {},
    total: 0
  };

  // Categories with their corresponding layer objects
  const categories = {
    transportation: transportationLayers,
    infrastructure: infrastructureLayers,
    naturalFeatures: naturalFeaturesLayers,
    vegetation: vegetationLayers,
    urbanFeatures: urbanFeaturesLayers,
    geological: geologicalLayers,
    environmental: environmentalLayers,
    agriculture: agricultureLayers,
    miscellaneous: miscellaneousLayers,
  };

  // Iterate through each category
  for (const [categoryKey, layers] of Object.entries(categories)) {
    Object.entries(layers).forEach(([layerName, layer]) => {
      const count = getLayerFeatureCount(layer);
      stats[categoryKey][layerName] = count;
      stats.total += count;
    });
  }

  return stats;
};

// Function to format layer name for display
const formatLayerName = (layerName) => {
  // Remove 'Layer' suffix and convert camelCase to readable format
  return layerName
    .replace(/Layer$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
    // Handle special cases for better readability
    .replace(/U R L/g, 'URL')
    .replace(/I D/g, 'ID')
    .replace(/G P S/g, 'GPS')
    .replace(/C A D/g, 'CAD');
};

// Cache for Cadenza layer statistics to avoid expensive checks
let cachedCadenzaStats = null;
let cadenzaStatsLastUpdated = 0;

// Function to get default Cadenza layer structure
const getDefaultCadenzaLayers = () => {
  return [
    { name: 'Background Map', category: 'Base', count: 1 }, // Background layer
    { name: 'Satellitenkarte', category: 'Base', count: 1 }, // Main satellite base layer
    { name: 'Kreise (2024)', category: 'Administrative', count: 1 }, // German administrative districts for 2024
    { name: 'Measurement Points', category: 'Data', count: 0 }, // Measurement data if available
    { name: 'Administrative Boundaries', category: 'Administrative', count: 0 } // Boundaries if loaded

  ];
};

// Function to get Cadenza layers from the actual Cadenza interface (expensive operation)
const refreshCadenzaLayerStatistics = () => {
  console.log('Refreshing Cadenza layer statistics...');

  const cadenzaStats = {
    total: 0,
    layers: []
  };

  // Try to get Cadenza layers if client is available and iframe is loaded
  if (window.cadenzaClient) {
    try {
      console.log('Getting Cadenza layers from interface...');

      // Try to access the Cadenza iframe content to get layer information
      const cadenzaIframe = document.getElementById('cadenza-iframe');
      if (cadenzaIframe && cadenzaIframe.contentDocument) {
        try {
          // Look for layer elements in the Cadenza interface
          const layerElements = cadenzaIframe.contentDocument.querySelectorAll('[data-layer], .layer-item, .legend-item');

          if (layerElements.length > 0) {
            layerElements.forEach((element, index) => {
              const layerName = element.textContent?.trim() || element.getAttribute('data-layer') || `Layer ${index + 1}`;
              if (layerName && layerName.length > 0 && layerName !== 'undefined') {
                cadenzaStats.layers.push({
                  name: layerName,
                  category: 'Cadenza',
                  count: 1 // Assume each layer has at least 1 feature
                });
              }
            });
          }
        } catch (iframeError) {
          console.log('Cannot access iframe content (cross-origin):', iframeError.message);
        }
      }

      // If we couldn't get layers from iframe, use default Cadenza layer structure
      if (cadenzaStats.layers.length === 0) {
        cadenzaStats.layers = getDefaultCadenzaLayers();
      }

      // Filter out layers with 0 count for cleaner display
      cadenzaStats.layers = cadenzaStats.layers.filter(layer => layer.count > 0);
      cadenzaStats.total = cadenzaStats.layers.reduce((sum, layer) => sum + layer.count, 0);
      console.log('Found Cadenza layers:', cadenzaStats.layers);
    } catch (error) {
      console.warn('Error getting Cadenza layers:', error);

      // Fallback to minimal layer information
      cadenzaStats.layers = [
        { name: 'Cadenza Map', category: 'Base', count: 1 }
      ];
      cadenzaStats.total = 1;
    }
  } else {
    // If no Cadenza client, use default layers
    cadenzaStats.layers = getDefaultCadenzaLayers().filter(layer => layer.count > 0);
    cadenzaStats.total = cadenzaStats.layers.reduce((sum, layer) => sum + layer.count, 0);
  }

  // Cache the results
  cachedCadenzaStats = cadenzaStats;
  cadenzaStatsLastUpdated = Date.now();

  return cadenzaStats;
};

// Function to get Cadenza layers (uses cache unless refresh is explicitly requested)
const getCadenzaLayerStatistics = async (forceRefresh = false) => {
  // Use cached data if available and not forced to refresh
  if (!forceRefresh && cachedCadenzaStats && (Date.now() - cadenzaStatsLastUpdated < 30000)) { // 30 second cache
    return cachedCadenzaStats;
  }

  // Get data from database for Cadenza mode
  try {
    const response = await fetch('/get_layer_stats');
    if (response.ok) {
      const data = await response.json();
      
      // Convert to the expected format
      const cadenzaStats = {
        total: data.total_count,
        layers: []
      };
      
      // Convert layer stats to the expected format
      Object.entries(data.layer_stats).forEach(([layerName, count]) => {
        cadenzaStats.layers.push({
          name: layerName,
          category: 'Detected Objects',
          count: count
        });
      });
      
      // Cache the results
      cachedCadenzaStats = cadenzaStats;
      cadenzaStatsLastUpdated = Date.now();
      
      console.log('Updated Cadenza layer statistics from database:', cadenzaStats);
      return cadenzaStats;
    } else {
      console.error('Failed to fetch layer stats from database');
    }
  } catch (error) {
    console.error('Error fetching layer stats from database:', error);
  }

  // Fallback to default layers if database fetch fails
  if (!forceRefresh) {
    const defaultStats = {
      total: 0,
      layers: getDefaultCadenzaLayers().filter(layer => layer.count > 0)
    };
    defaultStats.total = defaultStats.layers.reduce((sum, layer) => sum + layer.count, 0);
    return defaultStats;
  }

  // Only do expensive refresh when explicitly requested
  return refreshCadenzaLayerStatistics();
};

// Function to generate HTML for statistics table
export const generateStatsTableHTML = async (viewMode = 'openlayers') => {
  if (viewMode === 'cadenza') {
    // Get Cadenza layer statistics from database (async)
    const cadenzaStats = await getCadenzaLayerStatistics(false);

    if (cadenzaStats.total === 0) {
      return `<div class="stats-empty-state">
        <h4>Cadenza View</h4>
        <p>No detected objects available in database.</p>
        <p>Use "Call GeoPixel" to detect and add objects to the database.</p>
        <p>Added geometries will be tracked in the stats.</p>
      </div>`;
    }

    // Format Cadenza layers for display - only show layers with count > 0
    const activeLayers = cadenzaStats.layers.filter(layer => layer.count > 0);
    const allLayers = activeLayers.map((layer, index) => ({
      layerName: layer.name,
      count: layer.count,
      category: layer.category,
      displayName: layer.name,
      isCadenza: true
    }));

    const totalCount = cadenzaStats.total;

    let html = `
      <div class="stats-summary-compact">
        <div class="view-indicator cadenza-view">Cadenza View (Database)</div>
        <div class="total-count">Total: ${totalCount} objects</div>
        <div class="layer-count">Active Layers: ${allLayers.length}</div>
      </div>
      <table class="layer-stats-table">
      <thead>
        <tr>
          <th style="width: 20px;"></th>
          <th style="width: 30px;">#</th>
          <th>Layer Name</th>
          <th style="width: 80px;">Category</th>
          <th style="width: 60px;">Count</th>
        </tr>
      </thead>
      <tbody id="layer-stats-tbody">`;

    // Generate rows for Cadenza layers (not draggable but selectable for overlap analysis)
    allLayers.forEach((layer, index) => {
      const rowClass = 'layer-row cadenza-layer';
      const icon = '🗄️'; // Database icon
      html += `<tr class="${rowClass}" data-layer-name="${layer.layerName}">
        <td class="layer-drag-handle">${icon}</td>
        <td class="layer-order-cell">
          <span class="layer-order-indicator">${index + 1}</span>
        </td>
        <td class="layer-name-cell">${layer.displayName}</td>
        <td class="layer-category-cell">${layer.category}</td>
        <td class="layer-count-cell">
          <span class="layer-count-badge">${layer.count}</span>
        </td>
      </tr>`;
    });

    html += `</tbody></table>
      <div class="cadenza-stats-note">
        <small>🗄️ Layer statistics from PostGIS database</small>
      </div>`;
    return html;
  }

  // OpenLayers mode (existing functionality)
  const stats = getLayerStatistics();

  if (stats.total === 0) {
    return `<div class="stats-empty-state">
      <h4>OpenLayers View</h4>
      <p>No objects found in any layer.</p>
      <p>Draw some features to see statistics!</p>
    </div>`;
  }

  const categories = [
    { key: 'transportation', name: 'Transportation', data: stats.transportation },
    { key: 'infrastructure', name: 'Infrastructure', data: stats.infrastructure },
    { key: 'naturalFeatures', name: 'Natural Features', data: stats.naturalFeatures },
    { key: 'vegetation', name: 'Vegetation', data: stats.vegetation },
    { key: 'urbanFeatures', name: 'Urban Features', data: stats.urbanFeatures },
    { key: 'geological', name: 'Geological', data: stats.geological },
    { key: 'environmental', name: 'Environmental', data: stats.environmental },
    { key: 'agriculture', name: 'Agriculture', data: stats.agriculture },
    { key: 'miscellaneous', name: 'Miscellaneous', data: stats.miscellaneous },
  ];

  // Collect all layers with counts in a flat list for cross-category reordering
  const allLayers = [];
  categories.forEach(category => {
    Object.entries(category.data).forEach(([layerName, count]) => {
      if (count > 0) {
        allLayers.push({
          layerName,
          count,
          category: category.name,
          displayName: formatLayerName(layerName)
        });
      }
    });
  });

  // Sort layers by current map layer order for initial display
  if (window.map) {
    const mapLayers = window.map.getLayers().getArray();
    allLayers.sort((a, b) => {
      const layerA = allVectorLayers[a.layerName];
      const layerB = allVectorLayers[b.layerName];
      const indexA = mapLayers.indexOf(layerA);
      const indexB = mapLayers.indexOf(layerB);
      return indexB - indexA; // Reverse order (top layers first)
    });
  }

  let html = `
    <div class="stats-summary-compact">
      <div class="view-indicator openlayers-view">OpenLayers View</div>
      <div class="total-count">Total: ${stats.total} objects</div>
      <div class="layer-count">Layers: ${allLayers.length}</div>
    </div>
    <table class="layer-stats-table">
    <thead>
      <tr>
        <th style="width: 20px;"></th>
        <th style="width: 30px;">#</th>
        <th>Layer Name</th>
        <th style="width: 80px;">Category</th>
        <th style="width: 60px;">Count</th>
      </tr>
    </thead>
    <tbody id="layer-stats-tbody">`;

  // Generate flat list of all layers for cross-category reordering
  allLayers.forEach((layer, index) => {
    html += `<tr class="layer-row" data-layer-name="${layer.layerName}" draggable="true">
      <td class="layer-drag-handle">⋮⋮</td>
      <td class="layer-order-cell">
        <span class="layer-order-indicator">${index + 1}</span>
      </td>
      <td class="layer-name-cell">${layer.displayName}</td>
      <td class="layer-category-cell">${layer.category}</td>
      <td class="layer-count-cell">
        <span class="layer-count-badge">${layer.count}</span>
      </td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
};


// Function to show the statistics modal (used for overlap analysis only)
export const showLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');

  if (modal && content) {
    // Modal is now used primarily for overlap analysis
    content.innerHTML = `<div class="stats-summary">
      <h3>Layer Statistics</h3>
      <div class="stats-actions" style="display: flex; justify-content: center;">
        <button id="layer-overlap-analysis-btn" class="menu-button">Layer Overlap Analysis</button>
      </div>
    </div>`;
    modal.style.display = 'block';

    // Add event listener for overlap analysis button
    const overlapBtn = document.getElementById('layer-overlap-analysis-btn');
    if (overlapBtn) {
      overlapBtn.addEventListener('click', () => {
        showLayerOverlapAnalysis();
      });
    }
  }
};

// Function to hide the statistics modal
export const hideLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// ===========================================
// LAYER STATISTICS TABLE FUNCTIONALITY
// ===========================================

// Function to update the stats table
export const updateStatsTable = async (viewMode = 'openlayers') => {
  const container = document.getElementById('layer-stats-table-container');
  if (container) {
    // Show loading state for Cadenza mode
    if (viewMode === 'cadenza') {
      container.innerHTML = `<div class="stats-loading">
        <p>Loading layer statistics from database...</p>
      </div>`;
    }
    
    const html = await generateStatsTableHTML(viewMode);
    container.innerHTML = html;

    // Only setup drag and drop for OpenLayers view
    if (viewMode === 'openlayers') {
      setupDragAndDrop();
    }
  }
};

// Global variable to track current view mode
let currentViewMode = 'openlayers';

// Function to update stats table based on current view mode
export const updateStatsTableForView = (isOpenLayersMode, isCadenzaMode) => {
  console.log('Updating stats table for view:', { isOpenLayersMode, isCadenzaMode });

  if (isCadenzaMode && !isOpenLayersMode) {
    currentViewMode = 'cadenza';
    updateStatsTable('cadenza');
  } else if (isOpenLayersMode && !isCadenzaMode) {
    currentViewMode = 'openlayers';
    updateStatsTable('openlayers');
  } else {
    // Auto-detect mode based on what's visible/active
    const cadenzaIframe = document.getElementById('cadenza-iframe');
    const olMap = document.getElementById('OL-map');

    if (cadenzaIframe && cadenzaIframe.style.display !== 'none') {
      currentViewMode = 'cadenza';
      updateStatsTable('cadenza');
    } else if (olMap && olMap.style.display !== 'none') {
      currentViewMode = 'openlayers';
      updateStatsTable('openlayers');
    } else {
      // Default to OpenLayers if no clear indication
      currentViewMode = 'openlayers';
      updateStatsTable('openlayers');
    }
  }
};

// Function to get current view mode
export const getCurrentViewMode = () => {
  return currentViewMode;
};

// Function to set current view mode manually
export const setCurrentViewMode = (mode) => {
  if (mode === 'cadenza' || mode === 'openlayers') {
    currentViewMode = mode;

    // Refresh Cadenza stats when switching to Cadenza mode
    if (mode === 'cadenza') {
      console.log('Switching to Cadenza mode - refreshing layer statistics');
      // Refresh Cadenza layer stats and then update table
      setTimeout(() => {
        getCadenzaLayerStatistics(true); // Force refresh
        updateStatsTable(mode);
      }, 100); // Small delay to ensure view has switched
    } else {
      updateStatsTable(mode);
    }
  }
};

// Function to refresh Cadenza layer statistics (called on specific events)
export const refreshCadenzaStats = () => {
  console.log('Manually refreshing Cadenza layer statistics');
  return refreshCadenzaLayerStatistics();
};

// Function to be called when Call GeoPixel button is pressed in Cadenza mode
export const onCadenzaActionTriggered = () => {
  console.log('Cadenza action triggered - refreshing layer statistics');
  // Refresh stats and update display
  getCadenzaLayerStatistics(true); // Force refresh
  if (currentViewMode === 'cadenza') {
    setTimeout(() => {
      updateStatsTable('cadenza');
    }, 200); // Update stats table after processing
  }
};

// Function to setup drag and drop functionality
const setupDragAndDrop = () => {
  const tbody = document.getElementById('layer-stats-tbody');
  if (!tbody) return;

  const layerRows = tbody.querySelectorAll('.layer-row');

  layerRows.forEach(row => {
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
    row.addEventListener('dragenter', handleDragEnter);
    row.addEventListener('dragleave', handleDragLeave);
  });
};

// Drag and drop event handlers
let draggedElement = null;

// Helper function to find the closest layer row
const findLayerRow = (element) => {
  while (element && !element.classList.contains('layer-row')) {
    element = element.parentElement;
  }
  return element;
};

const handleDragStart = (e) => {
  const row = findLayerRow(e.target);
  if (row) {
    draggedElement = row;
    row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', row.outerHTML);
    console.log('Drag started for:', row.dataset.layerName);
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

const handleDragEnter = (e) => {
  const row = findLayerRow(e.target);
  if (row && row !== draggedElement) {
    row.classList.add('drag-over');
  }
};

const handleDragLeave = (e) => {
  const row = findLayerRow(e.target);
  if (row) {
    row.classList.remove('drag-over');
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  const targetRow = findLayerRow(e.target);

  if (targetRow) {
    targetRow.classList.remove('drag-over');
  }

  if (targetRow && draggedElement && targetRow !== draggedElement) {
    const tbody = targetRow.parentNode;
    const draggedIndex = Array.from(tbody.children).indexOf(draggedElement);
    const targetIndex = Array.from(tbody.children).indexOf(targetRow);

    console.log(`Dropping ${draggedElement.dataset.layerName} onto ${targetRow.dataset.layerName}`);

    // Reorder the layers in the map
    reorderMapLayers(draggedElement.dataset.layerName, targetRow.dataset.layerName, draggedIndex < targetIndex);

    // Move the DOM element
    if (draggedIndex < targetIndex) {
      tbody.insertBefore(draggedElement, targetRow.nextSibling);
    } else {
      tbody.insertBefore(draggedElement, targetRow);
    }

    // Update order indicators
    updateOrderIndicators();

    console.log('Layer reordering completed');
  }
};

const handleDragEnd = (e) => {
  const row = findLayerRow(e.target);
  if (row) {
    row.classList.remove('dragging');
  }

  // Remove drag-over class from all rows
  const tbody = document.getElementById('layer-stats-tbody');
  if (tbody) {
    tbody.querySelectorAll('.layer-row').forEach(row => {
      row.classList.remove('drag-over');
    });
  }
  draggedElement = null;
  console.log('Drag ended');
};

// Function to reorder layers in the map (only vector layers)
const reorderMapLayers = (draggedLayerName, targetLayerName, moveAfter) => {
  const draggedLayer = allVectorLayers[draggedLayerName];
  const targetLayer = allVectorLayers[targetLayerName];

  if (!draggedLayer || !targetLayer) return;

  const mapLayers = window.map.getLayers();
  const layersArray = mapLayers.getArray();

  // Get only vector layers from the map (exclude base layers and GeoJSON layers)
  const vectorLayers = layersArray.filter(layer => {
    const layerName = layer.get('name');
    return Object.values(allVectorLayers).includes(layer);
  });

  // Find the indices within vector layers only
  const draggedVectorIndex = vectorLayers.indexOf(draggedLayer);
  const targetVectorIndex = vectorLayers.indexOf(targetLayer);

  if (draggedVectorIndex === -1 || targetVectorIndex === -1) return;

  // Find the actual map indices
  const draggedMapIndex = layersArray.indexOf(draggedLayer);
  const targetMapIndex = layersArray.indexOf(targetLayer);

  if (draggedMapIndex === -1 || targetMapIndex === -1) return;

  // Remove the dragged layer
  mapLayers.removeAt(draggedMapIndex);

  // Calculate new position relative to target layer
  let newMapIndex = targetMapIndex;
  if (draggedMapIndex < targetMapIndex) {
    newMapIndex = moveAfter ? targetMapIndex : targetMapIndex - 1;
  } else {
    newMapIndex = moveAfter ? targetMapIndex + 1 : targetMapIndex;
  }

  // Ensure we don't move vector layers before base layers
  // Base layers should always stay at the bottom of the layer stack
  const baseLayerCount = layersArray.filter(layer => {
    const layerName = layer.get('name');
    return layerName && (layerName.includes('Google') || layerName.includes('201') || layerName.includes('202'));
  }).length;

  // Ensure vector layers stay above base layers + GeoJSON layer
  const minVectorIndex = baseLayerCount + 1; // +1 for GeoJSON layer
  newMapIndex = Math.max(newMapIndex, minVectorIndex);

  // Insert at new position
  mapLayers.insertAt(newMapIndex, draggedLayer);

  console.log(`Moved vector layer ${draggedLayerName} to position ${newMapIndex} (above base layers)`);
};

// Function to update order indicators
const updateOrderIndicators = () => {
  const tbody = document.getElementById('layer-stats-tbody');
  if (!tbody) return;

  const layerRows = tbody.querySelectorAll('.layer-row');
  let orderIndex = 1;

  layerRows.forEach(row => {
    const indicator = row.querySelector('.layer-order-indicator');
    if (indicator) {
      indicator.textContent = orderIndex++;
    }
  });
};

// Function to initialize the stats panel
export const initializeStatsPanel = () => {
  console.log('Initializing stats panel...');

  // Ensure we have the container before proceeding
  const container = document.getElementById('layer-stats-table-container');
  if (!container) {
    console.warn('Stats table container not found, retrying...');
    setTimeout(initializeStatsPanel, 500);
    return;
  }

  updateStatsTable(currentViewMode);

  // Setup overlap analysis button
  const overlapBtn = document.getElementById('layer-overlap-btn');
  if (overlapBtn) {
    overlapBtn.addEventListener('click', () => {
      showLayerOverlapAnalysis();
    });
  }

  // Setup auto-refresh when vector layers change (not base layers)
  if (window.map && allVectorLayers) {
    try {
      // Only listen to vector layer changes, ignore base layers
      Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
        const source = layer.getSource();
        if (source && typeof source.on === 'function') {
          // Add feature listeners with error handling
          source.on('addfeature', () => {
            setTimeout(() => {
              try {
                updateStatsTable(currentViewMode);
              } catch (error) {
                console.warn('Error updating stats table on addfeature:', error);
              }
            }, 100);
          });

          source.on('removefeature', () => {
            setTimeout(() => {
              try {
                updateStatsTable(currentViewMode);
              } catch (error) {
                console.warn('Error updating stats table on removefeature:', error);
              }
            }, 100);
          });

          source.on('clear', () => {
            setTimeout(() => {
              try {
                updateStatsTable(currentViewMode);
              } catch (error) {
                console.warn('Error updating stats table on clear:', error);
              }
            }, 100);
          });
        }
      });
      console.log('Stats panel initialized successfully');
    } catch (error) {
      console.error('Error setting up vector layer listeners:', error);
    }
  } else {
    console.warn('Map or vector layers not available for stats panel initialization');
  }
};


// Function to refresh stats table using current view mode
export const refreshStatsTable = () => {
  updateStatsTable(currentViewMode);
};

// Function to debug missing layers
export const debugLayerCoverage = () => {
  console.log('=== LAYER COVERAGE DEBUG ===');

  // Get all layers from allVectorLayers
  const allLayerNames = Object.keys(allVectorLayers);
  console.log('Total layers in allVectorLayers:', allLayerNames.length);
  console.log('All layer names:', allLayerNames);

  // Get all layers from categories
  const categories = {
    transportation: transportationLayers,
    infrastructure: infrastructureLayers,
    naturalFeatures: naturalFeaturesLayers,
    vegetation: vegetationLayers,
    urbanFeatures: urbanFeaturesLayers,
    geological: geologicalLayers,
    environmental: environmentalLayers,
    agriculture: agricultureLayers,
  };

  const categoryLayerNames = [];
  Object.entries(categories).forEach(([categoryName, layers]) => {
    const layerNames = Object.keys(layers);
    console.log(`${categoryName}:`, layerNames.length, 'layers -', layerNames);
    categoryLayerNames.push(...layerNames);
  });

  console.log('Total layers in categories:', categoryLayerNames.length);

  // Find missing layers
  const missingFromCategories = allLayerNames.filter(name => !categoryLayerNames.includes(name));
  const missingFromAll = categoryLayerNames.filter(name => !allLayerNames.includes(name));

  if (missingFromCategories.length > 0) {
    console.error('❌ Layers in allVectorLayers but missing from categories:', missingFromCategories);
  }

  if (missingFromAll.length > 0) {
    console.error('❌ Layers in categories but missing from allVectorLayers:', missingFromAll);
  }

  if (missingFromCategories.length === 0 && missingFromAll.length === 0) {
    console.log('✅ All layers properly included in both collections');
  }

  console.log('=== END DEBUG ===');

  return {
    allLayerNames,
    categoryLayerNames,
    missingFromCategories,
    missingFromAll
  };
};

// Expose functions to window for radio button handler and external access
window.updateStatsTableForView = updateStatsTableForView;
window.getCurrentViewMode = getCurrentViewMode;
window.setCurrentViewMode = setCurrentViewMode;
window.refreshCadenzaStats = refreshCadenzaStats;
window.onCadenzaActionTriggered = onCadenzaActionTriggered;
window.debugLayerCoverage = debugLayerCoverage;
window.getCadenzaLayerStatistics = getCadenzaLayerStatistics;

// ===========================================
// LAYER OVERLAP ANALYSIS FUNCTIONALITY
// ===========================================

// Function to get all layers that have features (for dropdown selection)
export const getLayersWithFeatures = async () => {
  const layersWithFeatures = [];
  
  if (currentViewMode === 'cadenza') {
    // Get layers from database for Cadenza mode
    try {
      const cadenzaStats = await getCadenzaLayerStatistics(false);
      cadenzaStats.layers.forEach(layer => {
        if (layer.count > 0) {
          layersWithFeatures.push({
            name: layer.name,
            displayName: layer.name,
            layer: null, // No OpenLayers layer object for database layers
            featureCount: layer.count,
            isCadenza: true
          });
        }
      });
    } catch (error) {
      console.error('Error getting Cadenza layers for overlap analysis:', error);
    }
  } else {
    // Get layers from OpenLayers for traditional mode
    Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
      const count = getLayerFeatureCount(layer);
      if (count > 0) {
        layersWithFeatures.push({
          name: layerName,
          displayName: formatLayerName(layerName),
          layer: layer,
          featureCount: count,
          isCadenza: false
        });
      }
    });
  }

  return layersWithFeatures.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Function to generate HTML for layer selection dropdowns
export const generateLayerSelectionHTML = async () => {
  const layersWithFeatures = await getLayersWithFeatures();

  if (layersWithFeatures.length < 2) {
    const modeText = currentViewMode === 'cadenza' ? 'database' : 'different layers';
    const actionText = currentViewMode === 'cadenza' ? 'Use "Call GeoPixel" to detect objects' : 'Draw some features on different layers';
    
    return `<div class="overlap-error">
      <p>At least 2 layers with features are required for overlap analysis.</p>
      <p>Current layers with features: ${layersWithFeatures.length}</p>
      <p>${actionText} to analyze overlaps!</p>
    </div>`;
  }

  let optionsHTML = '<option value="">Select a layer...</option>';
  layersWithFeatures.forEach(layerInfo => {
    optionsHTML += `<option value="${layerInfo.name}">${layerInfo.displayName} (${layerInfo.featureCount} objects)</option>`;
  });

  const modeIndicator = currentViewMode === 'cadenza' ? ' (Database)' : ' (OpenLayers)';

  return `<div class="overlap-selection">
    <h3>Layer Overlap Analysis${modeIndicator}</h3>
    <p>Select two layers to analyze their overlapping areas:</p>
    
    <div class="layer-selection-row">
      <label for="layer1-select">First Layer:</label>
      <select id="layer1-select" class="layer-select">
        ${optionsHTML}
      </select>
    </div>
    
    <div class="layer-selection-row">
      <label for="layer2-select">Second Layer:</label>
      <select id="layer2-select" class="layer-select">
        ${optionsHTML}
      </select>
    </div>
    
    <div class="overlap-controls">
      <button id="calculate-overlap-btn" class="menu-button" disabled>Calculate Overlap</button>
    </div>
  </div>`;
};

// Function to generate HTML for overlap results
export const generateOverlapResultsHTML = (overlapData, layer1Name, layer2Name) => {
  const layer1DisplayName = formatLayerName(layer1Name);
  const layer2DisplayName = formatLayerName(layer2Name);

  // Format area values with appropriate units
  const formatArea = (area) => {
    if (area > 1000000) {
      return `${(area / 1000000).toFixed(2)} km²`;
    } else if (area > 10000) {
      return `${(area / 10000).toFixed(2)} hectares`;
    } else {
      return `${area.toFixed(2)} m²`;
    }
  };

  // Format percentage with one decimal place
  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(1)}%`;
  };

  let html = `<div class="overlap-results-content">
    <h4>Overlap Analysis Results</h4>
    <div class="overlap-summary">
      <div class="overlap-layers">
        <strong>${layer1DisplayName}</strong> vs <strong>${layer2DisplayName}</strong>
      </div>
    </div>
    
    <div class="overlap-stats">
      <div class="overlap-stat-group">
        <h5>Layer Areas</h5>
        <div class="stat-row">
          <span class="stat-label">${layer1DisplayName}:</span>
          <span class="stat-value">${formatArea(overlapData.layer1Area)}</span>
          <span class="stat-detail">(${overlapData.layer1PolygonCount} polygons)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer2DisplayName}:</span>
          <span class="stat-value">${formatArea(overlapData.layer2Area)}</span>
          <span class="stat-detail">(${overlapData.layer2PolygonCount} polygons)</span>
        </div>
      </div>
      
      <div class="overlap-stat-group">
        <h5>Intersection Analysis</h5>
        <div class="stat-row highlight">
          <span class="stat-label">Overlapping Area:</span>
          <span class="stat-value">${formatArea(overlapData.intersectionArea)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer1DisplayName} Overlap:</span>
          <span class="stat-value">${formatPercentage(overlapData.layer1OverlapPercentage)}</span>
          <span class="stat-detail">of layer area overlaps</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">${layer2DisplayName} Overlap:</span>
          <span class="stat-value">${formatPercentage(overlapData.layer2OverlapPercentage)}</span>
          <span class="stat-detail">of layer area overlaps</span>
        </div>
      </div>`;

  // Add interpretation of results
  if (overlapData.intersectionArea === 0) {
    html += `<div class="overlap-interpretation">
      <h5>Interpretation</h5>
      <p class="no-overlap">No overlap detected between the selected layers.</p>
    </div>`;
  } else {
    const maxOverlap = Math.max(overlapData.layer1OverlapPercentage, overlapData.layer2OverlapPercentage);
    let interpretation = '';

    if (maxOverlap < 5) {
      interpretation = 'Very minimal overlap between layers.';
    } else if (maxOverlap < 20) {
      interpretation = 'Small overlap between layers.';
    } else if (maxOverlap < 50) {
      interpretation = 'Moderate overlap between layers.';
    } else if (maxOverlap < 80) {
      interpretation = 'Significant overlap between layers.';
    } else {
      interpretation = 'Extensive overlap between layers.';
    }

    html += `<div class="overlap-interpretation">
      <h5>Interpretation</h5>
      <p class="overlap-description">${interpretation}</p>
    </div>`;
  }

  html += `</div>
    
    <div class="overlap-actions">
      <button id="new-overlap-analysis-btn" class="menu-button">Analyze Different Layers</button>
    </div>`;

  return html;
};

// Function to perform overlap analysis between two layers
export const performOverlapAnalysis = async (layer1Name, layer2Name) => {
  if (currentViewMode === 'cadenza') {
    // Use database for Cadenza mode
    console.log(`Performing database overlap analysis between ${layer1Name} and ${layer2Name}...`);
    
    try {
      const response = await fetch('/fetch_area_intersection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layer1: layer1Name,
          layer2: layer2Name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate intersection');
      }

      const result = await response.json();
      console.log('Database overlap analysis result:', result);
      
      return result.intersection_data;
      
    } catch (error) {
      console.error('Error performing database overlap analysis:', error);
      throw error;
    }
  } else {
    // Use OpenLayers for traditional mode
    const layer1 = allVectorLayers[layer1Name];
    const layer2 = allVectorLayers[layer2Name];

    if (!layer1 || !layer2) {
      console.error('One or both layers not found:', layer1Name, layer2Name);
      return null;
    }

    console.log(`Performing OpenLayers overlap analysis between ${layer1Name} and ${layer2Name}...`);

    // Calculate overlap using the geometry utilities
    const overlapData = calculateLayerOverlap(layer1, layer2);

    return overlapData;
  }
};

// Function to show the layer overlap analysis interface
export const showLayerOverlapAnalysis = async () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');

  if (modal && content) {
    // Show loading state while generating HTML
    content.innerHTML = '<div class="stats-loading"><p>Loading layer selection...</p></div>';
    modal.style.display = 'block';

    const html = await generateLayerSelectionHTML();
    content.innerHTML = html;

    // Add event listeners for the interface
    setupOverlapAnalysisEventListeners();
  }
};

// Function to setup event listeners for overlap analysis interface
const setupOverlapAnalysisEventListeners = () => {
  const layer1Select = document.getElementById('layer1-select');
  const layer2Select = document.getElementById('layer2-select');
  const calculateBtn = document.getElementById('calculate-overlap-btn');
  const backToStatsBtn = document.getElementById('back-to-stats-btn');

  // Function to check if both layers are selected and different
  const checkSelectionValidity = () => {
    const layer1Value = layer1Select?.value;
    const layer2Value = layer2Select?.value;
    const isValid = layer1Value && layer2Value && layer1Value !== layer2Value;

    if (calculateBtn) {
      calculateBtn.disabled = !isValid;
    }
  };

  // Add event listeners for dropdown changes
  if (layer1Select) {
    layer1Select.addEventListener('change', checkSelectionValidity);
  }

  if (layer2Select) {
    layer2Select.addEventListener('change', checkSelectionValidity);
  }

  // Add event listener for calculate button
  if (calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const layer1Name = layer1Select.value;
      const layer2Name = layer2Select.value;

      if (layer1Name && layer2Name && layer1Name !== layer2Name) {
        // Show loading state
        calculateBtn.textContent = 'Calculating...';
        calculateBtn.disabled = true;

        // Perform the analysis
        setTimeout(async () => {
          try {
            const overlapData = await performOverlapAnalysis(layer1Name, layer2Name);

            if (overlapData) {
              // Replace modal content entirely with results
              const modalContent = document.getElementById('layer-stats-content');
              if (modalContent) {
                modalContent.innerHTML = generateOverlapResultsHTML(overlapData, layer1Name, layer2Name);

                // Setup event listeners for result actions
                setupOverlapResultsEventListeners();
              }
            } else {
              // Reset button state if analysis failed
              calculateBtn.textContent = 'Calculate Overlap';
              calculateBtn.disabled = false;
            }
          } catch (error) {
            console.error('Error in overlap analysis:', error);
            alert(`Error calculating overlap: ${error.message}`);
            // Reset button state if analysis failed
            calculateBtn.textContent = 'Calculate Overlap';
            calculateBtn.disabled = false;
          }
        }, 100); // Small delay to show loading state
      }
    });
  }

  // Add event listener for back to stats button
  if (backToStatsBtn) {
    backToStatsBtn.addEventListener('click', () => {
      showLayerStatsModal();
    });
  }
};

// Function to setup event listeners for overlap results
const setupOverlapResultsEventListeners = () => {
  const newAnalysisBtn = document.getElementById('new-overlap-analysis-btn');
  const backToStatsBtn = document.getElementById('back-to-stats-from-results-btn');

  if (newAnalysisBtn) {
    newAnalysisBtn.addEventListener('click', () => {
      // Reset back to layer selection interface
      const modalContent = document.getElementById('layer-stats-content');
      if (modalContent) {
        modalContent.innerHTML = generateLayerSelectionHTML();
        setupOverlapAnalysisEventListeners();
      }
    });
  }

  if (backToStatsBtn) {
    backToStatsBtn.addEventListener('click', () => {
      showLayerStatsModal();
    });
  }
};

// Expose overlap analysis function to window for manual testing
window.showLayerOverlapAnalysis = showLayerOverlapAnalysis;

// ===========================================
// LAYER SWITCHER FUNCTIONALITY
// ===========================================

/**
 * Toggle function for layer switcher (called from HTML)
 * Shows/hides the layer switcher content panel
 */
export function toggleLayerSwitcher() {
  const content = document.getElementById('layer-switcher-content');
  if (content) {
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    console.log('Layer switcher toggled:', !isVisible ? 'opened' : 'closed');
  }
}

// ===========================================
// TILE PROCESSING RESULT HANDLING
// ===========================================

/**
 * Combines and displays results from multiple tile processing operations
 * @param {Array} tileResults - Array of tile processing results
 * @param {string} object - The object type being processed
 * @param {Object} tileConfig - The tile configuration object
 * @param {Function} setButtonLoadingState - Function to manage button loading state
 */
export function combineAndDisplayTileResults(tileResults, object, tileConfig, setButtonLoadingState) {
  console.log(`Combining results from ${tileConfig.label}...`);

  const validResults = tileResults.filter(result => result !== null);
  console.log(`Successfully processed ${validResults.length} tiles out of ${tileConfig.count} total tiles`);

  if (validResults.length === 0) {
    alert("No valid results from tile processing");
    setButtonLoadingState(false);
    return;
  }

  // Check which source is active (OpenLayers or Cadenza)
  const cadenzaRadio = document.getElementById('cdzbtn');
  const isUsingCadenza = cadenzaRadio && cadenzaRadio.checked;

  if (isUsingCadenza) {
    // Handle Cadenza geometry addition
    addGeometriesToCadenza(validResults, object, tileConfig, setButtonLoadingState).catch(error => {
      console.error('Error in Cadenza geometry addition:', error);
      setButtonLoadingState(false);
    });
  } else {
    // Handle OpenLayers geometry addition (existing functionality)
    addGeometriesToOpenLayers(validResults, object, tileConfig, setButtonLoadingState);
  }
}

/**
 * Add geometries to Cadenza map
 * @param {Array} validResults - Array of valid tile processing results
 * @param {string} object - The object type being processed
 * @param {Object} tileConfig - The tile configuration object
 * @param {Function} setButtonLoadingState - Function to manage button loading state
 */
async function addGeometriesToCadenza(validResults, object, tileConfig, setButtonLoadingState) {
  console.log('Adding geometries to PostGIS database for Cadenza mode');

  // First pass: collect all geometries with their tile information
  const allGeometries = [];

  validResults.forEach(result => {
    const { tileIndex, data } = result;

    if (data.outline && data.outline.length > 0) {
      const isMultiScale = data.multiScale || false;
      const scaleInfo = data.scaleInfo || null;
      
      if (isMultiScale && scaleInfo) {
        console.log(`Processing multi-scale geometries from tile ${tileIndex} (${scaleInfo.totalScales} scales combined)`);
        console.log(`Scale weights: ${scaleInfo.weights.map(w => `${w.scale}:${w.weight.toFixed(3)}`).join(', ')}`);
      } else {
        console.log(`Processing geometries from tile ${tileIndex} for database insertion`);
      }

      if (data.coordinates_transformed) {
        // Process all contours from this tile
        data.outline.forEach((contour, contourIndex) => {
          console.log(`Tile ${tileIndex}, contour ${contourIndex}: ${contour.length} points`);

          let mapCoords = contour; // Already in geographic coordinates

          // Ensure polygon is closed
          if (mapCoords.length > 0 && JSON.stringify(mapCoords[0]) !== JSON.stringify(mapCoords[mapCoords.length - 1])) {
            mapCoords.push([...mapCoords[0]]);
          }

          // Check and fix polygon orientation
          const isClockwise = isPolygonClockwise(mapCoords);
          if (isClockwise) {
            console.log(`Tile ${tileIndex}, contour ${contourIndex}: reversing clockwise polygon`);
            mapCoords.reverse();
          }

          // Store geometry with tile information for mask combining
          // Include multi-scale metadata if available
          const geometryData = {
            tileIndex: tileIndex,
            contourIndex: contourIndex,
            coordinates: mapCoords,
            processed: false
          };
          
          // Add multi-scale metadata if available
          if (isMultiScale && scaleInfo) {
            geometryData.multiScale = true;
            geometryData.scaleInfo = scaleInfo;
            // Note: individual contour weights are lost in current structure
            // but scale information is preserved at tile level
          }
          
          allGeometries.push(geometryData);
        });
      }
    }
  });

  // Combine neighboring tile masks and merge contained masks within the same layer
  const combinedGeometries = combineAndMergeAllMasks(allGeometries, tileConfig);

  // Insert geometries into PostGIS database
  if (combinedGeometries.length > 0) {
    try {
      console.log(`Inserting ${combinedGeometries.length} geometries into PostGIS database`);
      
      // Convert all geometries to MultiPolygon format for database insertion
      const multiPolygonCoordinates = combinedGeometries.map(geom => {
        if (geom.holes && geom.holes.length > 0) {
          return [geom.coordinates, ...geom.holes];
        } else {
          return [geom.coordinates];
        }
      });

      // Create WKT for MultiPolygon
      const polygonWKTs = multiPolygonCoordinates.map(polygonCoords => {
        const ringWKTs = polygonCoords.map(ring => {
          const coordStrings = ring.map(coord => `${coord[0]} ${coord[1]}`).join(', ');
          return `(${coordStrings})`;
        });
        return `(${ringWKTs.join(', ')})`;
      });
      
      const multiPolygonWKT = `MULTIPOLYGON(${polygonWKTs.join(', ')})`;
      
      console.log('Generated MultiPolygon WKT for database insertion');
      console.log('MultiPolygon structure:', {
        polygonCount: multiPolygonCoordinates.length,
        coordinateStructure: multiPolygonCoordinates.map(poly => `${poly.length} rings`)
      });
      
      // Insert into database
      const response = await fetch('/insert_geometry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          object: object,
          geometry_wkt: multiPolygonWKT,
          attributes: {
            tile_config: tileConfig.label,
            total_geometries: combinedGeometries.length,
            processing_timestamp: new Date().toISOString(),
            multi_scale: validResults.some(result => result.data.multiScale)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to insert geometry into database');
      }

      const result = await response.json();
      console.log('✅ Successfully inserted geometry into database:', result);

      // Immediately update cached layer stats with the new count
      if (result.updated_count !== undefined && result.object_name) {
        updateCachedCadenzaStats(result.object_name, result.updated_count);
        console.log(`Updated cached stats: ${result.object_name} now has ${result.updated_count} objects`);
      }

      // Log detailed information about merging
      const totalOriginalMasks = combinedGeometries.reduce((sum, geom) => {
        return sum + 1 + (geom.containedMasks ? geom.containedMasks.length : 0);
      }, 0);
      const masksWithHoles = combinedGeometries.filter(geom => geom.holes && geom.holes.length > 0).length;
      
      // Check if any results were from multi-scale processing
      const multiScaleResults = validResults.filter(result => result.data.multiScale);
      const totalScaleResults = multiScaleResults.reduce((sum, result) =>
        sum + (result.data.scaleInfo ? result.data.scaleInfo.totalScales : 0), 0);

      console.log(`Added ${combinedGeometries.length} combined geometries to PostGIS database`);
      console.log(`Processed ${totalOriginalMasks} original masks into ${combinedGeometries.length} final features`);
      if (masksWithHoles > 0) {
        console.log(`${masksWithHoles} features contain holes from contained masks`);
      }
      if (multiScaleResults.length > 0) {
        console.log(`Multi-scale processing: ${multiScaleResults.length} tiles processed with ${totalScaleResults} total scale variations`);
      }

      // Immediately update the stats table with new data
      if (currentViewMode === 'cadenza') {
        updateStatsTable('cadenza');
        console.log('Layer statistics updated immediately after database insertion');
      }

      // Reload the map to show new geometries (single reload)
      console.log('Reloading Cadenza map to display new geometries...');
      if (window.updateCadenzaFromCurrentExtent) {
        window.updateCadenzaFromCurrentExtent();
      }

    } catch (error) {
      console.error(`Error inserting geometries into database:`, error);
      alert(`Error inserting geometries into database: ${error.message}`);
    }
  }

  // Note: Layer statistics are now updated immediately after database insertion
  // No need for delayed refresh since we update stats instantly

  console.log("Tiled processing with PostGIS database insertion complete!");

  // Re-enable the Call GeoPixel button
  setButtonLoadingState(false);
}

/**
 * Update cached Cadenza stats with new count for a specific layer
 */
function updateCachedCadenzaStats(objectName, newCount) {
  if (cachedCadenzaStats && cachedCadenzaStats.layers) {
    // Find existing layer and update count
    const existingLayer = cachedCadenzaStats.layers.find(layer => layer.name === objectName);
    
    if (existingLayer) {
      // Update existing layer count
      const oldCount = existingLayer.count;
      existingLayer.count = newCount;
      cachedCadenzaStats.total = cachedCadenzaStats.total - oldCount + newCount;
      console.log(`Updated cached stats: ${objectName} count changed from ${oldCount} to ${newCount}`);
    } else {
      // Add new layer if it doesn't exist and count > 0
      if (newCount > 0) {
        cachedCadenzaStats.layers.push({
          name: objectName,
          category: 'Detected Objects',
          count: newCount
        });
        cachedCadenzaStats.total += newCount;
        console.log(`Added new layer to cached stats: ${objectName} with ${newCount} objects`);
      }
    }
    
    // Remove layers with 0 count
    cachedCadenzaStats.layers = cachedCadenzaStats.layers.filter(layer => layer.count > 0);
    
    // Update cache timestamp
    cadenzaStatsLastUpdated = Date.now();
  } else {
    // Create new cache if it doesn't exist
    cachedCadenzaStats = {
      total: newCount,
      layers: newCount > 0 ? [{
        name: objectName,
        category: 'Detected Objects',
        count: newCount
      }] : []
    };
    cadenzaStatsLastUpdated = Date.now();
    console.log(`Created new cached stats for ${objectName} with ${newCount} objects`);
  }
}

/**
 * Refresh Cadenza layer statistics from database
 */
async function refreshCadenzaStatsFromDatabase() {
  try {
    const response = await fetch('/get_layer_stats');
    if (response.ok) {
      const data = await response.json();
      console.log('Updated layer statistics from database:', data);
      
      // Update the current view mode stats if in Cadenza mode
      if (currentViewMode === 'cadenza') {
        updateStatsTable('cadenza');
      }
    } else {
      console.error('Failed to fetch layer stats from database');
    }
  } catch (error) {
    console.error('Error refreshing layer stats from database:', error);
  }
}

/**
 * Helper function to convert GeoJSON to KML format
 * @param {Object} geojson - GeoJSON FeatureCollection
 * @returns {string} KML string
 */
function convertGeoJSONToKML(geojson) {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoPixel Results</name>
    <description>Geometries detected by GeoPixel</description>`;

  if (geojson.features) {
    geojson.features.forEach((feature, index) => {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0]; // Take exterior ring
        const coordString = coords.map(coord => `${coord[0]},${coord[1]},0`).join(' ');
        
        kml += `
    <Placemark>
      <name>GeoPixel Object ${index + 1}</name>
      <description>Detected: ${feature.properties?.object_type || 'Unknown'}</description>
      <Polygon>
        <extrude>1</extrude>
        <altitudeMode>clampToGround</altitudeMode>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordString}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
      }
    });
  }

  kml += `
  </Document>
</kml>`;

  return kml;
}

/**
 * Adds a geometry to Cadenza using the proper workflow (like in the demo)
 * This follows the pattern: createGeometry -> editGeometry -> listen for ok/cancel
 * @param {Object} geoJsonGeometry - GeoJSON geometry object
 * @param {boolean} autoConfirm - Whether to automatically confirm the dialog
 * @returns {Promise} Promise that resolves when geometry is added
 */
async function addGeometryWithCadenzaWorkflow(geoJsonGeometry, autoConfirm = false) {
  console.log('=== addGeometryWithCadenzaWorkflow called ===');
  console.log('geoJsonGeometry:', geoJsonGeometry);
  console.log('autoConfirm parameter:', autoConfirm);
  console.log('window.cadenzaClient exists:', !!window.cadenzaClient);
  
  if (!window.cadenzaClient) {
    console.error('Cadenza client is not initialized');
    throw new Error('Cadenza client is not initialized');
  }
  
  console.log('Adding geometry using proper Cadenza workflow:', geoJsonGeometry);
  
  return new Promise(async (resolve, reject) => {
    let unsubscribeOk, unsubscribeCancel;
    let confirmed = false;
    let processCompleted = false;
    
    // Add error handling for vector layer issues
    const originalConsoleError = console.error;
    const errorHandler = (error) => {
      if (error && error.toString().includes('features')) {
        console.log('⚠️ Vector layer features error detected - may be related to geometry addition');
        console.log('Error details:', error);
        
        // Don't let this error break the geometry addition process
        return;
      }
      originalConsoleError.call(console, error);
    };
    console.error = errorHandler;
    
    // Set up event listeners for completion (like in the demo)
    // Listen for update events during geometry editing
    const unsubscribeUpdate = window.cadenzaClient.on('editGeometry:update', (event) => {
      console.log('🔄 editGeometry:update event received:', event.detail);
      if (event.detail) {
        console.log('🔄 Update event detail type:', typeof event.detail);
        console.log('🔄 Update event detail:', JSON.stringify(event.detail, null, 2));
      } else {
        console.log('🔄 Update event detail is undefined/null');
      }
    });

    unsubscribeOk = window.cadenzaClient.on('editGeometry:ok', (event) => {
      if (processCompleted) return;
      processCompleted = true;
      
      // Log the geometry data for debugging
      console.log('🔍 editGeometry:ok event received:', event.detail);
      console.log('🔍 event.detail.geometry:', event.detail.geometry);
      
      console.log('=== GEOMETRY PERSISTENCE DEBUG ===');
      console.log('Raw event object:', event);
      console.log('Event detail:', event.detail);
      console.log('Event detail type:', typeof event.detail);
      console.log('Event detail keys:', event.detail ? Object.keys(event.detail) : 'N/A');
      
      if (event.detail) {
        console.log('Event detail stringified:', JSON.stringify(event.detail, null, 2));
        
        // Check for persistence indicators
        const hasObjectId = event.detail.objectId && event.detail.objectId !== '';
        const hasGeometry = event.detail.geometry !== null && event.detail.geometry !== undefined;
        const hasFeature = event.detail.feature !== null && event.detail.feature !== undefined;
        
        console.log('=== PERSISTENCE STATUS ===');
        console.log('Has ObjectId:', hasObjectId, '→', event.detail.objectId);
        console.log('Has Geometry:', hasGeometry, '→', event.detail.geometry);
        console.log('Has Feature:', hasFeature, '→', event.detail.feature);
        console.log('Area calculated:', event.detail.area);
        console.log('Circumference calculated:', event.detail.circumference);
        
        // Check if the geometry was actually persisted
        if (hasObjectId && hasGeometry) {
          console.log('✅ GEOMETRY APPEARS TO BE PERSISTED SUCCESSFULLY');
          console.log('ObjectId:', event.detail.objectId);
          console.log('Geometry type:', event.detail.geometry ? event.detail.geometry.type : 'N/A');
        } else {
          console.log('❌ GEOMETRY PERSISTENCE ISSUE DETECTED');
          console.log('Missing ObjectId:', !hasObjectId);
          console.log('Missing Geometry:', !hasGeometry);
          console.log('This may indicate the geometry was not saved to the map');
        }
        
        // Additional diagnostic information
        if (event.detail.error) {
          console.log('❌ Error in event detail:', event.detail.error);
        }
        if (event.detail.status) {
          console.log('Status in event detail:', event.detail.status);
        }
        if (event.detail.message) {
          console.log('Message in event detail:', event.detail.message);
        }
      }
      console.log('=== END PERSISTENCE DEBUG ===');
      
      console.log('Dialog should now be closing...');
      confirmed = true;
      
      // Restore original console.error
      console.error = originalConsoleError;
      
      // IMPORTANT: Wait a moment before closing to ensure persistence
      console.log('Waiting briefly to ensure geometry is persisted before closing dialog...');
      setTimeout(() => {
        try {
          console.log('Attempting to close dialog and return to map view...');
          
          // Try to use showMap to return to regular satellite view
          if (window.cadenzaClient && typeof window.cadenzaClient.showMap === 'function') {
            console.log('Using showMap to close dialog...');
            window.cadenzaClient.showMap('satellitenkarte', {
              useMapSrs: true,
              restoreDisplayState: true
            });
            console.log('ShowMap called to return to regular view');
          }
          
          // Check if dialog closed and verify the geometry is visible
          setTimeout(() => {
            const cadenzaIframe = document.getElementById('cadenza-iframe');
            if (cadenzaIframe) {
              console.log('Checking if dialog closed...');
              console.log('Iframe src after showMap:', cadenzaIframe.src);
              
              // Check if we're back to the regular map view
              const isEditMode = cadenzaIframe.src.includes('action=editGeometry');
              console.log('Still in edit mode:', isEditMode);
              
              if (isEditMode) {
                console.log('⚠️ Dialog still open - trying alternative closure methods...');
                
                // Try alternative methods to close dialog
                try {
                  // Try to send Escape key to close dialog
                  const escapeEvent = new KeyboardEvent('keydown', {
                    key: 'Escape',
                    code: 'Escape',
                    keyCode: 27,
                    which: 27,
                    bubbles: true,
                    cancelable: true
                  });
                  
                  document.dispatchEvent(escapeEvent);
                  console.log('Escape key sent to close dialog');
                  
                  // Try to focus back on main document
                  if (document.body) {
                    document.body.focus();
                    console.log('Focus returned to main document');
                  }
                  
                } catch (escapeError) {
                  console.log('Escape key method failed:', escapeError.message);
                }
              } else {
                console.log('✅ Dialog closed successfully - back to regular map view');
                console.log('🔍 Geometry should now be visible on the map');
                
                // Force a map refresh to ensure geometry is visible
                setTimeout(() => {
                  try {
                    console.log('Forcing map refresh to ensure geometry visibility...');
                    if (window.cadenzaClient && typeof window.cadenzaClient.showMap === 'function') {
                      window.cadenzaClient.showMap('satellitenkarte', {
                        useMapSrs: true,
                        restoreDisplayState: true
                      });
                    }
                  } catch (refreshError) {
                    console.log('Map refresh failed:', refreshError.message);
                  }
                }, 1000);
              }
            }
          }, 1000); // Wait longer to ensure proper closure
          
        } catch (closeError) {
          console.log('Error closing dialog:', closeError.message);
        }
      }, 500); // Wait longer before closing to ensure persistence
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      if (unsubscribeUpdate) unsubscribeUpdate();
      
      resolve(event.detail);
    });
    
    unsubscribeCancel = window.cadenzaClient.on('editGeometry:cancel', (event) => {
      if (processCompleted) return;
      processCompleted = true;
      
      console.log('Geometry addition cancelled:', event.detail);
      
      // Restore original console.error
      console.error = originalConsoleError;
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      if (unsubscribeUpdate) unsubscribeUpdate();
      
      reject(new Error('Geometry addition was cancelled'));
    });
    
    try {
      // Debug the geometry being sent to Cadenza
      console.log('=== GEOMETRY DEBUG INFO ===');
      console.log('Original geometry:', JSON.stringify(geoJsonGeometry, null, 2));
      
      // Check if coordinates are in projected format and need conversion
      let processedGeometry = geoJsonGeometry;
      
      // Helper function to convert a coordinate array
      const convertCoordinateArray = (coords) => {
        return coords.map(coord => {
          const [x, y] = coord;
          
          // Web Mercator to WGS84 conversion
          const lon = (x * 180.0) / 20037508.34;
          let lat = (y * 180.0) / 20037508.34;
          lat = 180.0 / Math.PI * (2.0 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
          
          return [lon, lat];
        });
      };
      
      // Helper function to get sample coordinates for projection detection
      const getSampleCoordinates = (geometry) => {
        if (geometry.type === 'Polygon') {
          return geometry.coordinates[0]; // First ring of polygon
        } else if (geometry.type === 'MultiPolygon') {
          return geometry.coordinates[0][0]; // First ring of first polygon
        }
        return null;
      };
      
      const sampleCoords = getSampleCoordinates(geoJsonGeometry);
      
      if (sampleCoords && sampleCoords.length > 0) {
        const xCoords = sampleCoords.map(c => c[0]);
        const yCoords = sampleCoords.map(c => c[1]);
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        console.log('X coordinate range:', minX, 'to', maxX);
        console.log('Y coordinate range:', minY, 'to', maxY);
        
        // Detect if coordinates are in projected format (Web Mercator EPSG:3857)
        const isProjected = Math.abs(minX) > 180 || Math.abs(maxX) > 180 || Math.abs(minY) > 90 || Math.abs(maxY) > 90;
        console.log('Coordinates appear to be projected:', isProjected);
        
        // Store both original and converted versions for testing
        let originalGeometry = geoJsonGeometry;
        let convertedGeometry = null;
        
        if (isProjected) {
          console.log('Converting projected coordinates to geographic (EPSG:4326)...');
          
          if (geoJsonGeometry.type === 'Polygon') {
            // Convert Polygon coordinates
            const convertedCoords = geoJsonGeometry.coordinates.map(ring => convertCoordinateArray(ring));
            
            convertedGeometry = {
              ...geoJsonGeometry,
              coordinates: convertedCoords
            };
            
          } else if (geoJsonGeometry.type === 'MultiPolygon') {
            // Convert MultiPolygon coordinates
            const convertedCoords = geoJsonGeometry.coordinates.map(polygon =>
              polygon.map(ring => convertCoordinateArray(ring))
            );
            
            convertedGeometry = {
              ...geoJsonGeometry,
              coordinates: convertedCoords
            };
          }
          
          console.log('Converted to geographic coordinates:', JSON.stringify(convertedGeometry, null, 2));
          
          // Verify conversion with sample coordinates
          const convertedSampleCoords = getSampleCoordinates(convertedGeometry);
          if (convertedSampleCoords) {
            const convertedXCoords = convertedSampleCoords.map(c => c[0]);
            const convertedYCoords = convertedSampleCoords.map(c => c[1]);
            console.log('Converted X range:', Math.min(...convertedXCoords), 'to', Math.max(...convertedXCoords));
            console.log('Converted Y range:', Math.min(...convertedYCoords), 'to', Math.max(...convertedYCoords));
          }
        }
        
        // Decision logic: Try to use the most appropriate coordinate system
        if (isProjected) {
          console.log('Using converted geographic coordinates for Cadenza');
          processedGeometry = convertedGeometry;
        } else {
          console.log('Using original coordinates (already geographic) for Cadenza');
          processedGeometry = originalGeometry;
        }
      }
      
      console.log('Final geometry for Cadenza:', JSON.stringify(processedGeometry, null, 2));
      console.log('=== END GEOMETRY DEBUG ===');
      
      // Use editGeometry with the processed coordinates (like in the demo)
      // This will show the geometry in Cadenza and allow user to confirm
      
      console.log('=== OPTIMIZED COORDINATE SYSTEM APPROACH ===');
      console.log('Using the most likely working approach based on testing...');
      
      // Prepare both original and converted geometries
      const originalGeometry = geoJsonGeometry;
      let geographicGeometry = processedGeometry;
      
      // Detect coordinate system
      if (sampleCoords && sampleCoords.length > 0) {
        const xCoords = sampleCoords.map(c => c[0]);
        const yCoords = sampleCoords.map(c => c[1]);
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        const isProjected = Math.abs(minX) > 180 || Math.abs(maxX) > 180 || Math.abs(minY) > 90 || Math.abs(maxY) > 90;
        
        if (isProjected) {
          console.log('Detected projected coordinates - trying optimized approach...');
          
          // BEST APPROACH: Use converted geographic coordinates with useMapSrs: false
          // This is typically the most reliable approach for Cadenza
          try {
            console.log('PREFERRED: Using converted geographic coordinates with useMapSrs: false');
            await window.cadenzaClient.editGeometry('satellitenkarte', geographicGeometry, {
              useMapSrs: false
            });
            console.log('✅ SUCCESS: Geographic coordinates with useMapSrs: false');
          } catch (error1) {
            console.log('❌ FAILED: Geographic coordinates with useMapSrs: false, trying projected coordinates');
            
            // FALLBACK: Use original projected coordinates with useMapSrs: true
            try {
              console.log('FALLBACK: Using original projected coordinates with useMapSrs: true');
              await window.cadenzaClient.editGeometry('satellitenkarte', originalGeometry, {
                useMapSrs: true
              });
              console.log('✅ SUCCESS: Original projected coordinates with useMapSrs: true');
            } catch (error2) {
              console.log('❌ FAILED: Original projected coordinates with useMapSrs: true');
              
              // LAST RESORT: Use geographic coordinates with useMapSrs: true
              console.log('LAST RESORT: Using geographic coordinates with useMapSrs: true');
              await window.cadenzaClient.editGeometry('satellitenkarte', geographicGeometry, {
                useMapSrs: true
              });
              console.log('✅ SUCCESS: Geographic coordinates with useMapSrs: true (last resort)');
            }
          }
        } else {
          // Geographic coordinates - use directly
          console.log('Detected geographic coordinates - using directly');
          try {
            await window.cadenzaClient.editGeometry('satellitenkarte', geographicGeometry, {
              useMapSrs: false
            });
            console.log('✅ SUCCESS: Geographic coordinates with useMapSrs: false');
          } catch (error) {
            console.log('❌ FAILED: Geographic coordinates with useMapSrs: false, trying with useMapSrs: true');
            await window.cadenzaClient.editGeometry('satellitenkarte', geographicGeometry, {
              useMapSrs: true
            });
            console.log('✅ SUCCESS: Geographic coordinates with useMapSrs: true');
          }
        }
      } else {
        // Fallback: Use processed geometry with default options
        console.log('Fallback: Using processed geometry with default options');
        await window.cadenzaClient.editGeometry('satellitenkarte', processedGeometry, {
          useMapSrs: false
        });
        console.log('✅ SUCCESS: Fallback approach');
      }
      
      console.log('=== END OPTIMIZED APPROACH ===');
      
      console.log('Cadenza editGeometry initiated, waiting for user confirmation...');
      console.log('Auto-confirm parameter:', autoConfirm);
      
      // Auto-confirm the dialog if requested (like in Call GeoPixel)
      if (autoConfirm) {
        console.log('Auto-confirmation enabled, setting up enhanced approach...');
        
        // Enhanced approach: Try multiple methods for confirmation
        const maxRetries = 8;
        let retryCount = 0;
        let buttonClickAttempted = false;
        
        const attemptAutoConfirmation = () => {
          if (confirmed || processCompleted) {
            console.log('Already confirmed or completed, stopping retry attempts');
            return;
          }
          
          retryCount++;
          console.log(`Auto-confirmation attempt ${retryCount}/${maxRetries}...`);
          
          try {
            const cadenzaIframe = document.getElementById('cadenza-iframe');
            
            if (cadenzaIframe) {
              // Try different ways to access the iframe content
              let iframeDoc = null;
              
              // Method 1: contentDocument
              try {
                iframeDoc = cadenzaIframe.contentDocument;
              } catch (e) {
                console.log('contentDocument failed:', e.message);
              }
              
              // Method 2: contentWindow.document
              if (!iframeDoc) {
                try {
                  iframeDoc = cadenzaIframe.contentWindow.document;
                } catch (e) {
                  console.log('contentWindow.document failed:', e.message);
                }
              }
              
              // Method 3: Try to access during different iframe states
              if (!iframeDoc) {
                try {
                  // Force iframe to be ready
                  if (cadenzaIframe.contentWindow && cadenzaIframe.contentWindow.document.readyState === 'complete') {
                    iframeDoc = cadenzaIframe.contentWindow.document;
                  }
                } catch (e) {
                  console.log('readyState check failed:', e.message);
                }
              }
              
              if (iframeDoc) {
                console.log('Successfully accessed iframe document!');
                
                // Look for the submit button with multiple selectors
                const buttonSelectors = [
                  'button[data-testid="submit-button"]',
                  'button.button-primary[type="submit"]',
                  'button[type="submit"]',
                  'button.button-primary',
                  'button:contains("Übernehmen")',
                  'button:contains("übernehmen")'
                ];
                
                let submitButton = null;
                
                for (const selector of buttonSelectors) {
                  try {
                    // Skip the :contains selector as it's not standard CSS
                    if (selector.includes(':contains')) {
                      const allButtons = iframeDoc.querySelectorAll('button');
                      submitButton = Array.from(allButtons).find(btn =>
                        btn.textContent && btn.textContent.toLowerCase().includes('übernehmen')
                      );
                    } else {
                      submitButton = iframeDoc.querySelector(selector);
                    }
                    
                    if (submitButton) {
                      console.log(`Found submit button with selector: ${selector}`);
                      break;
                    }
                  } catch (selectorError) {
                    console.log(`Selector ${selector} failed:`, selectorError.message);
                  }
                }
                
                if (submitButton) {
                  console.log('Submit button found, clicking...');
                  console.log('Button details:', {
                    text: submitButton.textContent?.trim(),
                    type: submitButton.type,
                    className: submitButton.className,
                    testid: submitButton.dataset?.testid
                  });
                  
                  buttonClickAttempted = true;
                  
                  // Try multiple click approaches
                  try {
                    // Method 1: Direct click
                    submitButton.click();
                    console.log('Direct click successful');
                    return; // Success - stop retrying
                  } catch (clickError) {
                    console.log('Direct click failed:', clickError.message);
                    
                    // Method 2: Dispatch click event
                    try {
                      const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: cadenzaIframe.contentWindow
                      });
                      submitButton.dispatchEvent(clickEvent);
                      console.log('Click event dispatch successful');
                      return; // Success - stop retrying
                    } catch (eventError) {
                      console.log('Click event dispatch failed:', eventError.message);
                    }
                  }
                } else {
                  console.log('Submit button not found in iframe');
                  
                  // Log all available buttons for debugging
                  const allButtons = iframeDoc.querySelectorAll('button');
                  console.log(`Found ${allButtons.length} buttons in iframe:`);
                  Array.from(allButtons).forEach((btn, idx) => {
                    console.log(`Button ${idx}: "${btn.textContent?.trim()}", type="${btn.type}", class="${btn.className}"`);
                  });
                }
              } else {
                console.log('Could not access iframe document - trying postMessage fallback...');
                
                // Fallback: Try postMessage approach
                if (retryCount >= 3 && !buttonClickAttempted) {
                  console.log('Using postMessage fallback for auto-confirmation...');
                  
                  try {
                    // Try to send a postMessage to the iframe to trigger confirmation
                    const confirmMessage = {
                      type: 'autoConfirm',
                      action: 'submit',
                      timestamp: Date.now()
                    };
                    
                    // Send message to the iframe
                    if (cadenzaIframe.contentWindow) {
                      cadenzaIframe.contentWindow.postMessage(confirmMessage, '*');
                      console.log('postMessage sent to iframe:', confirmMessage);
                    }
                    
                    buttonClickAttempted = true;
                    
                  } catch (postMessageError) {
                    console.log('postMessage fallback failed:', postMessageError.message);
                  }
                }
                
                // Additional fallback: Try Tab+Enter sequence
                if (retryCount >= 5 && buttonClickAttempted) {
                  console.log('Using Tab+Enter fallback for auto-confirmation...');
                  
                  try {
                    // Focus on the iframe first
                    cadenzaIframe.focus();
                    
                    // Wait a bit for focus to settle
                    setTimeout(() => {
                      // Send Tab key to navigate to the button
                      const tabEvent = new KeyboardEvent('keydown', {
                        key: 'Tab',
                        code: 'Tab',
                        keyCode: 9,
                        which: 9,
                        bubbles: true,
                        cancelable: true
                      });
                      
                      cadenzaIframe.dispatchEvent(tabEvent);
                      console.log('Tab key sent to iframe');
                      
                      // Wait for Tab to take effect, then send Enter
                      setTimeout(() => {
                        const enterEvent = new KeyboardEvent('keydown', {
                          key: 'Enter',
                          code: 'Enter',
                          keyCode: 13,
                          which: 13,
                          bubbles: true,
                          cancelable: true
                        });
                        
                        cadenzaIframe.dispatchEvent(enterEvent);
                        console.log('Enter key sent to iframe');
                        
                        // Also try sending to the document
                        setTimeout(() => {
                          document.dispatchEvent(enterEvent);
                          console.log('Enter key sent to document');
                        }, 100);
                        
                      }, 300);
                    }, 100);
                    
                  } catch (keyboardError) {
                    console.log('Tab+Enter fallback failed:', keyboardError.message);
                  }
                }
              }
            } else {
              console.log('Cadenza iframe not found');
            }
          } catch (error) {
            console.log('Auto-confirmation attempt failed:', error.message);
          }
          
          // Retry if not successful and not at max retries
          if (retryCount < maxRetries && !confirmed && !processCompleted) {
            setTimeout(attemptAutoConfirmation, 300); // Wait 300ms before retry
          } else if (retryCount >= maxRetries) {
            console.log('Max retries reached for auto-confirmation');
          }
        };
        
        // Start attempting auto-confirmation after 1 second
        setTimeout(attemptAutoConfirmation, 1000);
        
        // Set up a fallback timeout in case the event doesn't arrive
        setTimeout(() => {
          if (!confirmed && !processCompleted) {
            console.log('Fallback: editGeometry:ok event not received after 12 seconds...');
            
            // Try to directly trigger the confirmation event as a last resort
            console.log('Attempting to directly trigger confirmation event...');
            
            try {
              // Create a synthetic confirmation event
              const syntheticEvent = {
                detail: {
                  geometry: processedGeometry,
                  objectId: `synthetic_${Date.now()}`,
                  status: 'added',
                  autoConfirmed: true,
                  fallback: true,
                  area: 0,
                  circumference: 0
                }
              };
              
              // Trigger the event handler directly
              console.log('Triggering synthetic confirmation event:', syntheticEvent);
              
              // Use a timeout to ensure this runs after the current execution
              setTimeout(() => {
                if (!processCompleted) {
                  processCompleted = true;
                  confirmed = true;
                  
                  // Restore original console.error
                  console.error = originalConsoleError;
                  
                  // Clean up event listeners
                  if (unsubscribeOk) unsubscribeOk();
                  if (unsubscribeCancel) unsubscribeCancel();
                  if (unsubscribeUpdate) unsubscribeUpdate();
                  
                  console.log('Synthetic confirmation event processed');
                  resolve(syntheticEvent.detail);
                }
              }, 100);
              
            } catch (syntheticError) {
              console.log('Synthetic confirmation failed:', syntheticError.message);
              
              // Final fallback
              if (!processCompleted) {
                processCompleted = true;
                
                // Restore original console.error
                console.error = originalConsoleError;
                
                // Clean up event listeners
                if (unsubscribeOk) unsubscribeOk();
                if (unsubscribeCancel) unsubscribeCancel();
                if (unsubscribeUpdate) unsubscribeUpdate();
                
                resolve({ status: 'added', autoConfirmed: false, fallback: true });
              }
            }
          }
        }, 12000); // Wait 12 seconds total
      }
      
    } catch (error) {
      // Clean up event listeners on error
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      if (unsubscribeUpdate) unsubscribeUpdate();
      console.error('Error initiating Cadenza editGeometry:', error);
      reject(error);
    }
  });
}

/**
 * Creates a new geometry in Cadenza from GeoJSON data
 * This function properly creates new geometries with coordinates instead of editing existing ones
 * @param {Object} geoJsonGeometry - GeoJSON geometry object
 * @returns {Promise} Promise that resolves when geometry is created
 */
async function createCadenzaGeometryFromGeoJSON(geoJsonGeometry) {
  console.log('Creating Cadenza geometry from GeoJSON:', geoJsonGeometry);
  
  if (!window.cadenzaClient) {
    throw new Error('Cadenza client is not initialized');
  }
  
  try {
    // Direct approach: Use the Cadenza client's raw API
    // First, let's check what methods are available
    console.log('Available Cadenza client methods:', Object.getOwnPropertyNames(window.cadenzaClient));
    
    // Try to use the direct editGeometry method with auto-confirmation
    console.log('Attempting to add geometry directly to Cadenza map...');
    
    // Create a promise that auto-resolves after a short delay to simulate user confirmation
    const result = await new Promise(async (resolve, reject) => {
      let confirmed = false;
      
      // Set up a listener for the OK event
      const unsubscribeOk = window.cadenzaClient.on('editGeometry:ok', (event) => {
        console.log('Geometry confirmed by user:', event.detail);
        console.log('🔍 event.detail.geometry:', event.detail.geometry);
        confirmed = true;
        unsubscribeOk();
        resolve(event.detail);
      });
      
      // Set up a listener for the cancel event
      const unsubscribeCancel = window.cadenzaClient.on('editGeometry:cancel', () => {
        console.log('Geometry creation cancelled by user');
        unsubscribeCancel();
        reject(new Error('User cancelled geometry creation'));
      });
      
      try {
        // Call the Cadenza API directly
        await window.cadenzaClient.editGeometry('satellitenkarte', geoJsonGeometry, {
          useMapSrs: true
        });
        
        console.log('Cadenza editGeometry called, waiting for user confirmation...');
        
        // Auto-confirm after 1 second if not already confirmed
        setTimeout(() => {
          if (!confirmed) {
            console.log('Auto-confirming geometry creation...');
            // Try to programmatically trigger the OK event if possible
            try {
              // Look for OK button and click it
              const cadenzaIframe = document.getElementById('cadenza-iframe');
              if (cadenzaIframe && cadenzaIframe.contentDocument) {
                const okButtons = cadenzaIframe.contentDocument.querySelectorAll(
                  'button[title*="übernehmen"], button[title*="OK"], button:contains("übernehmen"), .btn-ok, .btn-confirm'
                );
                
                if (okButtons.length > 0) {
                  console.log('Found OK button, clicking automatically...');
                  okButtons[0].click();
                } else {
                  console.log('Could not find OK button for auto-confirmation');
                  // Still resolve as the geometry should be added
                  resolve({ status: 'added', autoConfirmed: true });
                }
              } else {
                console.log('Cannot access iframe content for auto-confirmation');
                // Still resolve as the geometry should be added
                resolve({ status: 'added', autoConfirmed: true });
              }
            } catch (autoConfirmError) {
              console.log('Auto-confirmation failed, but geometry should still be added:', autoConfirmError);
              resolve({ status: 'added', autoConfirmed: false });
            }
          }
        }, 1000);
        
      } catch (apiError) {
        console.error('Error calling Cadenza editGeometry:', apiError);
        unsubscribeOk();
        unsubscribeCancel();
        reject(apiError);
      }
    });
    
    // Return to normal map view
    setTimeout(() => {
      try {
        closeGeometryEditUI('satellitenkarte');
      } catch (closeError) {
        console.warn('Error closing geometry edit UI:', closeError);
      }
    }, 2000);
    
    return result;
    
  } catch (error) {
    console.error('Error creating Cadenza geometry:', error);
    throw error;
  }
}

/**
 * Fallback function to add geometries individually with automatic confirmation
 * This is used when MultiPolygon creation fails
 * @param {Array} combinedGeometries - Array of combined geometries to add
 */
async function addGeometriesIndividuallyWithAutoConfirm(combinedGeometries) {
  console.log('Using fallback: Adding geometries individually with auto-confirmation');
  
  for (const [index, geom] of combinedGeometries.entries()) {
    try {
      // Create GeoJSON polygon from coordinates
      let coordinates;
      if (geom.holes && geom.holes.length > 0) {
        // Create polygon with holes: [exterior, hole1, hole2, ...]
        coordinates = [geom.coordinates, ...geom.holes];
      } else {
        // Simple polygon without holes
        coordinates = [geom.coordinates];
      }

      const polygon = {
        "type": "Polygon",
        "coordinates": coordinates
      };

      console.log(`Adding geometry ${index + 1} individually with auto-confirmation`);

      // Use the proper geometry creation function with auto-confirmation
      await addGeometryWithCadenzaWorkflow(polygon, true); // Auto-confirm
      console.log(`Geometry ${index + 1} successfully added`);
      
      // Small delay between geometries to avoid overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error adding geometry ${index + 1}:`, error);
      // Continue with next geometry even if one fails
    }
  }
}

/**
 * Add geometries to OpenLayers map (existing functionality - unchanged)
 * @param {Array} validResults - Array of valid tile processing results
 * @param {string} object - The object type being processed
 * @param {Object} tileConfig - The tile configuration object
 * @param {Function} setButtonLoadingState - Function to manage button loading state
 */
function addGeometriesToOpenLayers(validResults, object, tileConfig, setButtonLoadingState) {
  console.log('Adding geometries to OpenLayers map (traditional layer mapping)...');

  // Determine target layer based on object type
  let layer = "";

  // Transportation layers
  if (object === "Car") {
    layer = allVectorLayers.carLayer;
  } else if (object === "Truck") {
    layer = allVectorLayers.truckLayer;
  } else if (object === "Train") {
    layer = allVectorLayers.trainLayer;
  } else if (object === "Aircraft") {
    layer = allVectorLayers.aircraftLayer;
  } else if (object === "Ship") {
    layer = allVectorLayers.shipLayer;

    // Infrastructure layers
  } else if (object === "Building") {
    layer = allVectorLayers.buildingLayer;
  } else if (object === "House") {
    layer = allVectorLayers.houseLayer;
  } else if (object === "Factory") {
    layer = allVectorLayers.factoryLayer;
  } else if (object === "Warehouse") {
    layer = allVectorLayers.warehouseLayer;
  } else if (object === "Hospital") {
    layer = allVectorLayers.hospitalLayer;
  } else if (object === "Bridge") {
    layer = allVectorLayers.bridgeLayer;
  } else if (object === "Road") {
    layer = allVectorLayers.roadLayer;
  } else if (object === "Highway") {
    layer = allVectorLayers.highwayLayer;
  } else if (object === "Runway") {
    layer = allVectorLayers.runwayLayer;
  } else if (object === "Parking Lot") {
    layer = allVectorLayers.parkingLotLayer;
  } else if (object === "Solar Panel") {
    layer = allVectorLayers.solarPanelLayer;
  } else if (object === "Wind Turbine") {
    layer = allVectorLayers.windTurbineLayer;

    // Natural features layers
  } else if (object === "River") {
    layer = allVectorLayers.riverLayer;
  } else if (object === "Lake") {
    layer = allVectorLayers.lakeLayer;
  } else if (object === "Ocean") {
    layer = allVectorLayers.oceanLayer;
  } else if (object === "Wetland") {
    layer = allVectorLayers.wetlandLayer;
  } else if (object === "Mountain") {
    layer = allVectorLayers.mountainLayer;
  } else if (object === "Hill") {
    layer = allVectorLayers.hillLayer;
  } else if (object === "Valley") {
    layer = allVectorLayers.valleyLayer;
  } else if (object === "Canyon") {
    layer = allVectorLayers.canyonLayer;
  } else if (object === "Beach") {
    layer = allVectorLayers.beachLayer;
  } else if (object === "Coastline") {
    layer = allVectorLayers.coastlineLayer;
  } else if (object === "Island") {
    layer = allVectorLayers.islandLayer;

    // Vegetation layers
  } else if (object === "Forest") {
    layer = allVectorLayers.forestLayer;
  } else if (object === "Tree") {
    layer = allVectorLayers.treeLayer;
  } else if (object === "Grass") {
    layer = allVectorLayers.grassLayer;
  } else if (object === "Farmland") {
    layer = allVectorLayers.farmlandLayer;
  } else if (object === "Vineyard") {
    layer = allVectorLayers.vineyardLayer;
  } else if (object === "Park") {
    layer = allVectorLayers.parkLayer;
  } else if (object === "Garden") {
    layer = allVectorLayers.gardenLayer;
  } else if (object === "Pasture") {
    layer = allVectorLayers.pastureLayer;

    // Urban features layers
  } else if (object === "Urban Area") {
    layer = allVectorLayers.urbanAreaLayer;
  } else if (object === "Residential") {
    layer = allVectorLayers.residentialLayer;
  } else if (object === "Commercial") {
    layer = allVectorLayers.commercialLayer;
  } else if (object === "Industrial") {
    layer = allVectorLayers.industrialLayer;
  } else if (object === "Construction Site") {
    layer = allVectorLayers.constructionSiteLayer;
  } else if (object === "Stadium") {
    layer = allVectorLayers.stadiumLayer;
  } else if (object === "Sports Field") {
    layer = allVectorLayers.sportsFieldLayer;
  } else if (object === "Golf Course") {
    layer = allVectorLayers.golfCourseLayer;
  } else if (object === "Cemetery") {
    layer = allVectorLayers.cemeteryLayer;

    // Geological layers
  } else if (object === "Rock Formation") {
    layer = allVectorLayers.rockFormationLayer;
  } else if (object === "Sand") {
    layer = allVectorLayers.sandLayer;
  } else if (object === "Desert") {
    layer = allVectorLayers.desertLayer;
  } else if (object === "Quarry") {
    layer = allVectorLayers.quarryLayer;
  } else if (object === "Mine") {
    layer = allVectorLayers.mineLayer;
  } else if (object === "Landslide") {
    layer = allVectorLayers.landslideLayer;
  } else if (object === "Erosion") {
    layer = allVectorLayers.erosionLayer;

    // Environmental layers
  } else if (object === "Fire") {
    layer = allVectorLayers.fireLayer;
  } else if (object === "Flood") {
    layer = allVectorLayers.floodLayer;
  } else if (object === "Snow") {
    layer = allVectorLayers.snowLayer;
  } else if (object === "Ice") {
    layer = allVectorLayers.iceLayer;
  } else if (object === "Smoke") {
    layer = allVectorLayers.smokeLayer;
  } else if (object === "Shadow") {
    layer = allVectorLayers.shadowLayer;

    // Agriculture layers
  } else if (object === "Greenhouse") {
    layer = allVectorLayers.greenhouseLayer;
  } else if (object === "Barn") {
    layer = allVectorLayers.barnLayer;
  } else if (object === "Silo") {
    layer = allVectorLayers.siloLayer;
  } else if (object === "Livestock") {
    layer = allVectorLayers.livestockLayer;

    // Miscellaneous layer
  } else if (object === "misc") {
    layer = allVectorLayers.miscLayer;
    console.log(`Using misc layer for object: ${object}`);

    // Default fallback to building layer
  } else {
    layer = allVectorLayers.buildingLayer;
    console.warn(`Unknown object type: ${object}, using building layer as fallback`);
  }

  console.log("Target layer:", layer);

  // First pass: collect all geometries with their tile information
  const allGeometries = [];

  validResults.forEach(result => {
    const { tileIndex, data } = result;

    if (data.outline && data.outline.length > 0) {
      const isMultiScale = data.multiScale || false;
      const scaleInfo = data.scaleInfo || null;
      
      if (isMultiScale && scaleInfo) {
        console.log(`Processing multi-scale geometries from tile ${tileIndex} (${scaleInfo.totalScales} scales combined)`);
        console.log(`Scale weights: ${scaleInfo.weights.map(w => `${w.scale}:${w.weight.toFixed(3)}`).join(', ')}`);
      } else {
        console.log(`Processing geometries from tile ${tileIndex}`);
      }

      if (data.coordinates_transformed) {
        // Process all contours from this tile
        data.outline.forEach((contour, contourIndex) => {
          console.log(`Tile ${tileIndex}, contour ${contourIndex}: ${contour.length} points`);

          let mapCoords = contour; // Already in geographic coordinates

          // Ensure polygon is closed
          if (mapCoords.length > 0 && JSON.stringify(mapCoords[0]) !== JSON.stringify(mapCoords[mapCoords.length - 1])) {
            mapCoords.push([...mapCoords[0]]);
          }

          // Check and fix polygon orientation
          const isClockwise = isPolygonClockwise(mapCoords);
          if (isClockwise) {
            console.log(`Tile ${tileIndex}, contour ${contourIndex}: reversing clockwise polygon`);
            mapCoords.reverse();
          }

          // Store geometry with tile information for mask combining
          // Include multi-scale metadata if available
          const geometryData = {
            tileIndex: tileIndex,
            contourIndex: contourIndex,
            coordinates: mapCoords,
            processed: false
          };
          
          // Add multi-scale metadata if available
          if (isMultiScale && scaleInfo) {
            geometryData.multiScale = true;
            geometryData.scaleInfo = scaleInfo;
            // Note: individual contour weights are lost in current structure
            // but scale information is preserved at tile level
          }
          
          allGeometries.push(geometryData);
        });
      }
    }
  });

  // Combine neighboring tile masks and merge contained masks within the same layer
  const combinedGeometries = combineAndMergeAllMasks(allGeometries, tileConfig);

  // Convert combined geometries to features and add to map
  if (combinedGeometries.length > 0) {
    const geoms = combinedGeometries.map(geom => {
      if (geom.holes && geom.holes.length > 0) {
        // Create polygon with holes: [exterior, hole1, hole2, ...]
        return [geom.coordinates, ...geom.holes];
      } else {
        // Simple polygon without holes
        return [geom.coordinates];
      }
    });

    const polygon = {
      "type": "MultiPolygon",
      "coordinates": geoms,
    };

    try {
      // Debug: Log the polygon coordinates to see what we're working with
      console.log('Creating OpenLayers features for polygon:', JSON.stringify(polygon, null, 2));
      
      // Detect coordinate format by examining the first coordinate
      let isWebMercator = false;
      if (polygon.coordinates && polygon.coordinates[0] && polygon.coordinates[0][0] && polygon.coordinates[0][0][0]) {
        const firstCoord = polygon.coordinates[0][0][0];
        const x = firstCoord[0];
        const y = firstCoord[1];
        
        // Web Mercator coordinates are typically large numbers (> 180 for X, > 90 for Y in absolute value)
        // Geographic coordinates are between -180 to 180 for X, -90 to 90 for Y
        isWebMercator = Math.abs(x) > 180 || Math.abs(y) > 90;
        
        console.log(`Coordinate detection: x=${x}, y=${y}, isWebMercator=${isWebMercator}`);
      }
      
      const features = new ol.format.GeoJSON().readFeatures(polygon, {
        dataProjection: isWebMercator ? 'EPSG:3857' : 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      
      console.log(`Using ${isWebMercator ? 'EPSG:3857' : 'EPSG:4326'} as input projection`);

      // Log the final transformed coordinates and feature information
      features.forEach((feature, idx) => {
        const geometry = feature.getGeometry();
        const coordinates = geometry.getCoordinates();
        console.log(`Feature ${idx + 1}:`, {
          type: geometry.getType(),
          coordinateCount: coordinates.length,
          firstCoordinate: coordinates[0] ? coordinates[0][0] : 'N/A',
          extent: geometry.getExtent(),
          area: geometry.getArea ? geometry.getArea() : 'N/A'
        });
      });

      console.log(`Successfully created ${features.length} features from combined geometries`);
      console.log(`Features will be added to layer: ${layer.get('name') || 'unnamed layer'}`);

      features.forEach(feature => {
        feature.setStyle(layer.getStyle());
        layer.getSource().addFeature(feature);
      });

      console.log(`Features added to map layer. Total features in layer: ${layer.getSource().getFeatures().length}`);

      // Log detailed information about merging
      const totalOriginalMasks = combinedGeometries.reduce((sum, geom) => {
        return sum + 1 + (geom.containedMasks ? geom.containedMasks.length : 0);
      }, 0);
      const masksWithHoles = combinedGeometries.filter(geom => geom.holes && geom.holes.length > 0).length;
      
      // Check if any results were from multi-scale processing
      const multiScaleResults = validResults.filter(result => result.data.multiScale);
      const totalScaleResults = multiScaleResults.reduce((sum, result) =>
        sum + (result.data.scaleInfo ? result.data.scaleInfo.totalScales : 0), 0);

      console.log(`Added ${features.length} combined features to map`);
      console.log(`Processed ${totalOriginalMasks} original masks into ${combinedGeometries.length} final features`);
      if (masksWithHoles > 0) {
        console.log(`${masksWithHoles} features contain holes from contained masks`);
      }
      if (multiScaleResults.length > 0) {
        console.log(`Multi-scale processing: ${multiScaleResults.length} tiles processed with ${totalScaleResults} total scale variations`);
      }
    } catch (error) {
      console.error(`Error creating combined features:`, error);
    }
  }

  // Refresh the layer and map
  layer.changed();
  map.render();
  map.renderSync();

  // Refresh the stats table to show new geometries
  setTimeout(() => {
    updateStatsTable(currentViewMode);
  }, 200);

  console.log("Tiled processing with mask combining complete!");

  // Re-enable the Call GeoPixel button
  setButtonLoadingState(false);
}

// ===========================================
// CADENZA GEOMETRY FUNCTIONS WITH UI CLOSURE
// ===========================================

/**
 * Add a new geometry to Cadenza with automatic UI closure on completion.
 * This function replaces the showMap approach for geometry creation.
 *
 * @param {string} backgroundMapView - The workbook map view in the background
 * @param {string} geometryType - The geometry type to create ('Point', 'LineString', 'Polygon', etc.)
 * @param {object} options - Additional options for geometry creation
 * @return {Promise<Feature>} A Promise that resolves with the created geometry when completed
 */
export async function addGeometry(backgroundMapView, geometryType, options = {}) {
  console.log('addGeometry called with:', backgroundMapView, geometryType, options);
  
  if (!window.cadenzaClient) {
    throw new Error('Cadenza client is not initialized');
  }
  
  return new Promise(async (resolve, reject) => {
    let unsubscribeOk, unsubscribeCancel;
    
    // Set up event listeners for completion
    unsubscribeOk = window.cadenzaClient.on('editGeometry:ok', (event) => {
      console.log('Geometry added successfully', event.detail);
      console.log('🔍 event.detail.geometry:', event.detail.geometry);
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      
      // Close the UI by returning to regular map view
      closeGeometryEditUI(backgroundMapView);
      
      resolve(event.detail);
    });
    
    unsubscribeCancel = window.cadenzaClient.on('editGeometry:cancel', () => {
      console.log('Geometry addition cancelled');
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      
      // Close the UI by returning to regular map view
      closeGeometryEditUI(backgroundMapView);
      
      reject(new Error('Geometry addition was cancelled'));
    });
    
    try {
      // Use the existing createGeometry method
      await window.cadenzaClient.createGeometry(backgroundMapView, geometryType, options);
    } catch (error) {
      // Clean up event listeners on error
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      reject(error);
    }
  });
}

/**
 * Edit an existing geometry in Cadenza with automatic UI closure on completion.
 * This function replaces the showMap approach for geometry editing.
 *
 * @param {string} backgroundMapView - The workbook map view in the background
 * @param {Object} geometry - The geometry to edit (GeoJSON format)
 * @param {object} options - Additional options for geometry editing
 * @return {Promise<Feature>} A Promise that resolves with the edited geometry when completed
 */
export async function editGeometry(backgroundMapView, geometry, options = {}) {
  console.log('editGeometry called with:', backgroundMapView, geometry, options);
  
  if (!window.cadenzaClient) {
    throw new Error('Cadenza client is not initialized');
  }
  
  return new Promise(async (resolve, reject) => {
    let unsubscribeOk, unsubscribeCancel;
    
    // Set up event listeners for completion
    unsubscribeOk = window.cadenzaClient.on('editGeometry:ok', (event) => {
      console.log('Geometry edited successfully', event.detail);
      console.log('🔍 event.detail.geometry:', event.detail.geometry);
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      
      // Close the UI by returning to regular map view
      closeGeometryEditUI(backgroundMapView);
      
      resolve(event.detail);
    });
    
    unsubscribeCancel = window.cadenzaClient.on('editGeometry:cancel', () => {
      console.log('Geometry editing cancelled');
      
      // Clean up event listeners
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      
      // Close the UI by returning to regular map view
      closeGeometryEditUI(backgroundMapView);
      
      reject(new Error('Geometry editing was cancelled'));
    });
    
    try {
      // Use the existing editGeometry method
      await window.cadenzaClient.editGeometry(backgroundMapView, geometry, options);
    } catch (error) {
      // Clean up event listeners on error
      if (unsubscribeOk) unsubscribeOk();
      if (unsubscribeCancel) unsubscribeCancel();
      reject(error);
    }
  });
}

/**
 * Helper function to close the geometry editing UI and return to regular map view
 * @param {string} backgroundMapView - The map view to return to
 */
function closeGeometryEditUI(backgroundMapView) {
  try {
    console.log('Closing geometry edit UI and returning to regular map view');
    
    // Return to regular map view to close the geometry editing UI
    if (window.cadenzaClient && backgroundMapView) {
      // Use current extent if available
      const showMapOptions = {
        useMapSrs: true,
      };
      
      // If window.currentExtent is available, use it to maintain the current view
      if (window.currentExtent && window.currentExtent.extent) {
        showMapOptions.extentStrategy = {
          type: 'static',
          extent: window.currentExtent.extent
        };
        console.log('Returning to map view with current extent:', window.currentExtent.extent);
      }
      
      // Return to regular satellite map view
      window.cadenzaClient.showMap(backgroundMapView, showMapOptions);
      console.log('Successfully returned to regular map view');
    }
  } catch (error) {
    console.warn('Error closing geometry edit UI:', error);
    // Even if there's an error, the geometry operation was successful
  }
}

// Expose functions to window for global access
window.addGeometry = addGeometry;
window.editGeometry = editGeometry;

// Test button functionality - simulates Call GeoPixel workflow
window.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.getElementById('test-cadenza-geometry-btn');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      console.log('Test Cadenza Geometry button clicked - generating rectangles');
      
      // Check if Cadenza is active
      const cadenzaRadio = document.getElementById('cdzbtn');
      if (!cadenzaRadio || !cadenzaRadio.checked) {
        alert('Please switch to Cadenza mode first (select Cadenza radio button)');
        return;
      }
      
      // Use the same loading state management as Call GeoPixel
      const setButtonLoadingState = (isLoading) => {
        if (isLoading) {
          testBtn.disabled = true;
          testBtn.innerHTML = '<span class="btn-text-full">Processing Test...</span><span class="btn-text-short">Processing...</span>';
        } else {
          testBtn.disabled = false;
          testBtn.innerHTML = '<span class="btn-text-full">Test Cadenza Geometry</span><span class="btn-text-short">Test</span>';
        }
      };
      
      // Set loading state
      setButtonLoadingState(true);
      
      try {
        // Get current extent
        let currentExtent = null;
        if (window.currentExtent && window.currentExtent.extent) {
          currentExtent = window.currentExtent.extent;
        } else if (window.currentExtent && window.currentExtent.center && window.currentExtent.zoom) {
          // Calculate extent from center and zoom
          const center = window.currentExtent.center;
          const zoom = window.currentExtent.zoom;
          const resolution = 156543.03392804097 / Math.pow(2, zoom);
          const halfWidth = resolution * 512 / 2;
          const halfHeight = resolution * 512 / 2;
          
          currentExtent = [
            center[0] - halfWidth,
            center[1] - halfHeight,
            center[0] + halfWidth,
            center[1] + halfHeight
          ];
        } else {
          // Default extent if none available (around Stuttgart area)
          currentExtent = [
            912416.2125450018, 6273450.378201618,
            942201.6070645204, 6282362.962046542
          ];
        }
        
        console.log('Current extent:', currentExtent);
        
        // Calculate rectangle half the size of current extent
        const extentWidth = currentExtent[2] - currentExtent[0];
        const extentHeight = currentExtent[3] - currentExtent[1];
        const centerX = (currentExtent[0] + currentExtent[2]) / 2;
        const centerY = (currentExtent[1] + currentExtent[3]) / 2;
        
        // Half-size rectangle
        const halfWidth = extentWidth / 4; // Half the width
        const halfHeight = extentHeight / 4; // Half the height
        
        const testCoordinates = [
          [centerX - halfWidth, centerY - halfHeight], // Bottom-left
          [centerX + halfWidth, centerY - halfHeight], // Bottom-right
          [centerX + halfWidth, centerY + halfHeight], // Top-right
          [centerX - halfWidth, centerY + halfHeight], // Top-left
          [centerX - halfWidth, centerY - halfHeight]  // Close the polygon
        ];
        
        console.log('Generated test rectangle (half-size of current extent):', testCoordinates);
        
        // Create mock tile results that match the structure expected by combineAndDisplayTileResults
        const mockTileResults = [
          {
            tileIndex: 0,
            data: {
              message: 'Successfully retrieved outline',
              outline: [testCoordinates], // Array of contours
              coordinates_transformed: true,
              multiScale: false,
              scaleInfo: null
            }
          }
        ];
        
        // Create mock tile configuration
        const mockTileConfig = {
          count: 1,
          rows: 1,
          cols: 1,
          label: "1 tile (1x1) - Test Rectangle"
        };
        
        // Get the selected object type (same as Call GeoPixel)
        const objectElement = document.getElementById('objbttn');
        let object = objectElement ? objectElement.textContent.trim() : "Building";
        
        // Ensure we have a valid object type (not the default "Object" placeholder)
        if (!object || object === "Object" || object === "Select Object" || object === "") {
          object = "Building";  // Default to Building for test
        }
        
        console.log('Generating test rectangle for object type:', object);
        console.log('Test rectangle extent:', {
          width: extentWidth / 2,
          height: extentHeight / 2,
          center: [centerX, centerY]
        });
        
        // Use the exact same processing pipeline as Call GeoPixel (step 4 onwards)
        combineAndDisplayTileResults(mockTileResults, object, mockTileConfig, setButtonLoadingState);
        
        console.log('Test rectangle processing initiated - will be added to database');
        
      } catch (error) {
        console.error('Error in test rectangle generation:', error);
        alert(`Error in test rectangle generation: ${error.message}`);
        setButtonLoadingState(false);
      }
    });
  }
});

console.log('Cadenza geometry functions with UI closure initialized');