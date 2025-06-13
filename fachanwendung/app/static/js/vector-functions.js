/**
 * Vector Functions Module for GeoPixel Application
 * 
 * This module contains all functions for working with vector layers:
 * - Layer statistics functionality
 * - Layer overlap analysis functionality
 * - Modal controls and HTML generation
 * - Layer switching functionality
 */

// Import geometry utilities for overlap calculations
import { calculateLayerOverlap } from './geometry-utils.js';

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
      } else if (geometryType === 'MultiLineString') {
        const lineStrings = geometry.getLineStrings();
        totalGeometries += lineStrings.length;
      } else if (geometryType === 'MultiPoint') {
        const points = geometry.getPoints();
        totalGeometries += points.length;
      } else if (geometryType === 'GeometryCollection') {
        const geometries = geometry.getGeometries();
        totalGeometries += geometries.length;
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

  // Transportation layers statistics
  Object.entries(transportationLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.transportation[layerName] = count;
    stats.total += count;
  });

  // Infrastructure layers statistics
  Object.entries(infrastructureLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.infrastructure[layerName] = count;
    stats.total += count;
  });

  // Natural features layers statistics
  Object.entries(naturalFeaturesLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.naturalFeatures[layerName] = count;
    stats.total += count;
  });

  // Vegetation layers statistics
  Object.entries(vegetationLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.vegetation[layerName] = count;
    stats.total += count;
  });

  // Urban features layers statistics
  Object.entries(urbanFeaturesLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.urbanFeatures[layerName] = count;
    stats.total += count;
  });

  // Geological layers statistics
  Object.entries(geologicalLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.geological[layerName] = count;
    stats.total += count;
  });

  // Environmental layers statistics
  Object.entries(environmentalLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.environmental[layerName] = count;
    stats.total += count;
  });

  // Agriculture layers statistics
  Object.entries(agricultureLayers).forEach(([layerName, layer]) => {
    const count = getLayerFeatureCount(layer);
    stats.agriculture[layerName] = count;
    stats.total += count;
  });

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

// Function to generate HTML for statistics display
export const generateStatsHTML = () => {
  const stats = getLayerStatistics();
  
  let html = `<div class="stats-summary">
    <h3>Total Objects: ${stats.total}</h3>
    <div class="stats-actions">
      <button id="layer-overlap-analysis-btn" class="stats-action-btn">Layer Overlap Analysis</button>
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
      <button id="calculate-overlap-btn" class="overlap-btn" disabled>Calculate Overlap</button>
      <button id="back-to-stats-btn" class="overlap-btn secondary">Back to Layer Stats</button>
    </div>
    
    <div id="overlap-results" class="overlap-results" style="display: none;"></div>
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
      <button id="new-overlap-analysis-btn" class="overlap-btn">Analyze Different Layers</button>
      <button id="back-to-stats-from-results-btn" class="overlap-btn secondary">Back to Layer Stats</button>
    </div>
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
            // Show results
            const resultsDiv = document.getElementById('overlap-results');
            if (resultsDiv) {
              resultsDiv.innerHTML = generateOverlapResultsHTML(overlapData, layer1Name, layer2Name);
              resultsDiv.style.display = 'block';
              
              // Setup event listeners for result actions
              setupOverlapResultsEventListeners();
            }
          }
          
          // Reset button state
          calculateBtn.textContent = 'Calculate Overlap';
          calculateBtn.disabled = false;
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
      showLayerOverlapAnalysis();
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