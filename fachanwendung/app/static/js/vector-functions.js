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

// Function to generate HTML for statistics display
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
      <button id="back-to-stats-btn" class="disabled-button" style="cursor: pointer !important;" onmouseover="this.style.backgroundColor='#6c757d'; this.style.transform='translateY(-1px)'" onmouseout="this.style.backgroundColor='#979da3'; this.style.transform='translateY(0)'">Back to Layer Stats</button>
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
      <button id="new-overlap-analysis-btn" class="menu-button">Analyze Different Layers</button>
      <button id="back-to-stats-from-results-btn" class="disabled-button" style="cursor: pointer !important;" onmouseover="this.style.backgroundColor='#6c757d'; this.style.transform='translateY(-1px)'" onmouseout="this.style.backgroundColor='#979da3'; this.style.transform='translateY(0)'">Back to Layer Stats</button>
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
    
    console.log("Tiled processing with mask combining complete!");
    
    // Re-enable the Call GeoPixel button
    setButtonLoadingState(false);
}