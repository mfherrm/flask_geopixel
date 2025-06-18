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
  agricultureLayers
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
    agriculture: agricultureLayers
  };

  // Iterate through each category using a for loop
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
    .trim();
};

// Function to get Cadenza layers (placeholder implementation)
const getCadenzaLayerStatistics = () => {
  // This is a placeholder implementation for Cadenza layers
  // In a real implementation, this would query the Cadenza client for active layers
  const cadenzaStats = {
    total: 0,
    layers: []
  };
  
  // Try to get Cadenza layers if client is available
  if (window.cadenzaClient) {
    try {
      // Placeholder for Cadenza layer information
      // This would need to be implemented based on Cadenza API
      console.log('Getting Cadenza layers...');
      
      // For now, return some mock data if Cadenza is active
      cadenzaStats.layers = [
        { name: 'Cadenza Base Layer', category: 'Base', count: 1 },
        { name: 'Cadenza Features', category: 'Features', count: 0 }
      ];
      cadenzaStats.total = cadenzaStats.layers.reduce((sum, layer) => sum + layer.count, 0);
    } catch (error) {
      console.warn('Error getting Cadenza layers:', error);
    }
  }
  
  return cadenzaStats;
};

// Function to generate HTML for statistics table
export const generateStatsTableHTML = (viewMode = 'openlayers') => {
  if (viewMode === 'cadenza') {
    // Get Cadenza layer statistics
    const cadenzaStats = getCadenzaLayerStatistics();
    
    if (cadenzaStats.total === 0 && cadenzaStats.layers.length === 0) {
      return `<div class="stats-empty-state">
        <h4>Cadenza View</h4>
        <p>No Cadenza layers available.</p>
        <p>Make sure Cadenza is running and connected!</p>
      </div>`;
    }
    
    // Format Cadenza layers for display
    const allLayers = cadenzaStats.layers.map((layer, index) => ({
      layerName: layer.name,
      count: layer.count,
      category: layer.category,
      displayName: layer.name,
      isCadenza: true
    }));
    
    let html = `
      <div class="stats-summary-compact">
        <div class="view-indicator cadenza-view">Cadenza View</div>
        <div class="total-count">Total: ${cadenzaStats.total} objects</div>
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
    
    // Generate rows for Cadenza layers (not draggable)
    allLayers.forEach((layer, index) => {
      html += `<tr class="layer-row cadenza-layer" data-layer-name="${layer.layerName}">
        <td class="layer-drag-handle">🗺️</td>
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
    { key: 'agriculture', name: 'Agriculture', data: stats.agriculture }
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

// Function to generate HTML for statistics display (legacy modal support)
export const generateStatsHTML = () => {
  const stats = getLayerStatistics();
  
  let html = `<div class="stats-summary">
    <h3>Total Objects: ${stats.total}</h3>
    <div class="stats-actions" style="display: flex; justify-content: center;">
      <button id="layer-overlap-analysis-btn" class="menu-button">Layer Overlap Analysis</button>
    </div>
  </div>`;

  const categories = [
    { key: 'transportation', name: 'Transportation', data: stats.transportation },
    { key: 'infrastructure', name: 'Infrastructure', data: stats.infrastructure },
    { key: 'naturalFeatures', name: 'Natural Features', data: stats.naturalFeatures },
    { key: 'vegetation', name: 'Vegetation', data: stats.vegetation },
    { key: 'urbanFeatures', name: 'Urban Features', data: stats.urbanFeatures },
    { key: 'geological', name: 'Geological', data: stats.geological },
    { key: 'environmental', name: 'Environmental', data: stats.environmental },
    { key: 'agriculture', name: 'Agriculture', data: stats.agriculture }
  ];

  categories.forEach(category => {
    const categoryTotal = Object.values(category.data).reduce((sum, count) => sum + count, 0);
    
    if (categoryTotal > 0) {
      html += `<div class="stats-category">
        <h4>${category.name} (${categoryTotal} objects)</h4>
        <div class="stats-layers">`;
      
      Object.entries(category.data).forEach(([layerName, count]) => {
        if (count > 0) {
          html += `<div class="stats-layer">
            <span class="layer-name">${formatLayerName(layerName)}:</span>
            <span class="layer-count">${count}</span>
          </div>`;
        }
      });
      
      html += `</div></div>`;
    }
  });

  if (stats.total === 0) {
    html += `<div class="stats-empty">
      <p>No objects found in any layer. Draw some features to see statistics!</p>
    </div>`;
  }

  return html;
};

// Function to show the statistics modal
export const showLayerStatsModal = () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');
  
  if (modal && content) {
    content.innerHTML = generateStatsHTML();
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
export const updateStatsTable = (viewMode = 'openlayers') => {
  const container = document.getElementById('layer-stats-table-container');
  if (container) {
    container.innerHTML = generateStatsTableHTML(viewMode);
    
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
  
  if (isOpenLayersMode) {
    currentViewMode = 'openlayers';
    updateStatsTable('openlayers');
  } else if (isCadenzaMode) {
    currentViewMode = 'cadenza';
    updateStatsTable('cadenza');
  } else {
    // Default to OpenLayers if no clear mode
    currentViewMode = 'openlayers';
    updateStatsTable('openlayers');
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

// Function to refresh stats table (public API)
export const refreshStatsTable = () => {
  updateStatsTable(currentViewMode);
};

// Expose function to window for radio button handler
window.updateStatsTableForView = updateStatsTableForView;

// ===========================================
// LAYER OVERLAP ANALYSIS FUNCTIONALITY
// ===========================================

// Function to get all layers that have features (for dropdown selection)
export const getLayersWithFeatures = () => {
  const layersWithFeatures = [];
  
  Object.entries(allVectorLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    if (count > 0) {
      layersWithFeatures.push({
        name: layerName,
        displayName: formatLayerName(layerName),
        layer: layer,
        featureCount: count
      });
    }
  });
  
  return layersWithFeatures.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Function to generate HTML for layer selection dropdowns
export const generateLayerSelectionHTML = () => {
  const layersWithFeatures = getLayersWithFeatures();
  
  if (layersWithFeatures.length < 2) {
    return `<div class="overlap-error">
      <p>At least 2 layers with features are required for overlap analysis.</p>
      <p>Current layers with features: ${layersWithFeatures.length}</p>
      <p>Draw some features on different layers to analyze overlaps!</p>
    </div>`;
  }
  
  let optionsHTML = '<option value="">Select a layer...</option>';
  layersWithFeatures.forEach(layerInfo => {
    optionsHTML += `<option value="${layerInfo.name}">${layerInfo.displayName} (${layerInfo.featureCount} objects)</option>`;
  });
  
  return `<div class="overlap-selection">
    <h3>Layer Overlap Analysis</h3>
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
export const performOverlapAnalysis = (layer1Name, layer2Name) => {
  const layer1 = allVectorLayers[layer1Name];
  const layer2 = allVectorLayers[layer2Name];
  
  if (!layer1 || !layer2) {
    console.error('One or both layers not found:', layer1Name, layer2Name);
    return null;
  }
  
  console.log(`Performing overlap analysis between ${layer1Name} and ${layer2Name}...`);
  
  // Calculate overlap using the geometry utilities
  const overlapData = calculateLayerOverlap(layer1, layer2);
  
  return overlapData;
};

// Function to show the layer overlap analysis interface
export const showLayerOverlapAnalysis = () => {
  const modal = document.getElementById('layer-stats-modal');
  const content = document.getElementById('layer-stats-content');
  
  if (modal && content) {
    content.innerHTML = generateLayerSelectionHTML();
    modal.style.display = 'block';
    
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
        setTimeout(() => {
          const overlapData = performOverlapAnalysis(layer1Name, layer2Name);
          
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
    
    // Determine target layer based on object type
    let layer = "";
    
    // Transportation layers
    if (object === "Car") {
        layer = allVectorLayers.carLayer;
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
            console.log(`Processing geometries from tile ${tileIndex}`);
            
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
                    allGeometries.push({
                        tileIndex: tileIndex,
                        contourIndex: contourIndex,
                        coordinates: mapCoords,
                        processed: false
                    });
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
            const features = new ol.format.GeoJSON().readFeatures(polygon, {
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857',
            });
            
            features.forEach(feature => {
                feature.setStyle(layer.getStyle());
                layer.getSource().addFeature(feature);
            });
            
            // Log detailed information about merging
            const totalOriginalMasks = combinedGeometries.reduce((sum, geom) => {
                return sum + 1 + (geom.containedMasks ? geom.containedMasks.length : 0);
            }, 0);
            const masksWithHoles = combinedGeometries.filter(geom => geom.holes && geom.holes.length > 0).length;
            
            console.log(`Added ${features.length} combined features to map`);
            console.log(`Processed ${totalOriginalMasks} original masks into ${combinedGeometries.length} final features`);
            if (masksWithHoles > 0) {
                console.log(`${masksWithHoles} features contain holes from contained masks`);
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