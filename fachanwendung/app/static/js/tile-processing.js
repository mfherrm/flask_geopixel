// Import geometry utility functions
import {
    isPolygonClockwise,
    combineAndMergeAllMasks
} from './geometry-utils.js';

// Import all vector layers directly
import {
    allVectorLayers
} from './vector-layers.js';

// Global tile configuration
export let tileConfig = {
    count: 1,
    rows: 1,
    cols: 1,
    label: "1 tile (1x1)"
};

/**
 * Wrapper function to update the global tileConfig using the updateTileConfig function
 * @param {number} tileCount - The number of tiles to configure
 * @returns {Object} The updated tile configuration object
 */
export function updateTileConfigWrapper(tileCount) {
    const newConfig = updateTileConfig(tileCount);
    if (newConfig) {
        tileConfig = newConfig;
    }
    return tileConfig;
}

/**
 * Updates the tile configuration based on the specified tile count
 * @param {number} tileCount - The number of tiles to configure
 * @returns {Object} The updated tile configuration object
 */
export function updateTileConfig(tileCount) {
    // Define optimal grid configurations for different tile counts
    const tileConfigs = {
        1: { rows: 1, cols: 1, label: "1 tile (1x1)" },
        6: { rows: 2, cols: 3, label: "6 tiles (2x3)" },
        12: { rows: 3, cols: 4, label: "12 tiles (3x4)" },
        20: { rows: 4, cols: 5, label: "20 tiles (4x5)" },
        24: { rows: 4, cols: 6, label: "24 tiles (4x6)" },
        30: { rows: 5, cols: 6, label: "30 tiles (5x6)" },
        42: { rows: 6, cols: 7, label: "42 tiles (6x7)" }
    };
    
    if (tileConfigs[tileCount]) {
        return {
            count: tileCount,
            rows: tileConfigs[tileCount].rows,
            cols: tileConfigs[tileCount].cols,
            label: tileConfigs[tileCount].label
        };
    } else {
        console.error(`Unknown tile count: ${tileCount}`);
        return null;
    }
}

/**
 * Processes an image by dividing it into tiles and processing each tile separately
 * @param {Blob} imageBlob - The image blob to process
 * @param {string} selection - The object selection string for processing
 * @param {Array} mapBounds - The geographic bounds of the map [[NW], [SE]]
 * @param {string} object - The object type being processed
 * @param {Object} tileConfig - The tile configuration object
 * @param {Function} setButtonLoadingState - Function to manage button loading state
 */
export async function processTiledImage(imageBlob, selection, mapBounds, object, tileConfig, setButtonLoadingState) {
    console.log(`Starting tiled image processing with ${tileConfig.label}...`);
    
    // Create image element to get dimensions
    const img = new Image();
    img.onload = async function() {
        const imageWidth = img.width;
        const imageHeight = img.height;
        console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);
        
        // Use dynamic tile configuration
        const tilesX = tileConfig.cols;
        const tilesY = tileConfig.rows;
        const tileWidth = Math.floor(imageWidth / tilesX);
        const tileHeight = Math.floor(imageHeight / tilesY);
        
        console.log(`Tile grid: ${tilesX}x${tilesY} = ${tileConfig.count} tiles`);
        console.log(`Tile dimensions: ${tileWidth}x${tileHeight}`);
        
        // Create canvas for tile extraction
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Determine batch size based on total tile count to prevent GPU memory overload
        const batchSize = tileConfig.count > 20 ? 4 : tileConfig.count > 10 ? 6 : tileConfig.count;
        console.log(`Processing tiles in batches of ${batchSize} to prevent GPU memory issues`);
        
        // Prepare all tile data first
        const tileData = [];
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                const tileIndex = y * tilesX + x;
                
                // Calculate tile bounds in pixel space
                const startX = x * tileWidth;
                const startY = y * tileHeight;
                const endX = Math.min(startX + tileWidth, imageWidth);
                const endY = Math.min(startY + tileHeight, imageHeight);
                const actualTileWidth = endX - startX;
                const actualTileHeight = endY - startY;
                
                // Calculate tile bounds in geographic space
                const tileBounds = calculateTileBounds(mapBounds, startX, startY, endX, endY, imageWidth, imageHeight);
                
                tileData.push({
                    tileIndex,
                    startX, startY, endX, endY,
                    actualTileWidth, actualTileHeight,
                    tileBounds
                });
            }
        }
        
        // Process tiles in batches
        const allTileResults = [];
        for (let batchStart = 0; batchStart < tileData.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, tileData.length);
            const batch = tileData.slice(batchStart, batchEnd);
            
            console.log(`Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(tileData.length / batchSize)}: tiles ${batchStart} to ${batchEnd - 1}`);
            
            // Process current batch
            const batchPromises = batch.map(tile => {
                return new Promise((resolve) => {
                    // Extract tile from image
                    canvas.width = tile.actualTileWidth;
                    canvas.height = tile.actualTileHeight;
                    ctx.drawImage(img, tile.startX, tile.startY, tile.actualTileWidth, tile.actualTileHeight, 0, 0, tile.actualTileWidth, tile.actualTileHeight);
                    
                    // Convert tile to blob and process
                    canvas.toBlob(function(tileBlob) {
                        processSingleTile(tileBlob, selection, tile.tileBounds, [tile.actualTileHeight, tile.actualTileWidth], tile.tileIndex)
                            .then(resolve)
                            .catch(error => {
                                console.error(`Error processing tile ${tile.tileIndex}:`, error);
                                resolve(null);
                            });
                    }, 'image/png');
                });
            });
            
            // Wait for current batch to complete
            const batchResults = await Promise.all(batchPromises);
            allTileResults.push(...batchResults);
            
            // Small delay between batches to allow GPU memory to clear
            if (batchEnd < tileData.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`All ${tileData.length} tiles processed. Combining results...`);
        combineAndDisplayTileResults(allTileResults, object, tileConfig, setButtonLoadingState);
    };
    
    img.src = URL.createObjectURL(imageBlob);
}

/**
 * Calculates the geographic bounds for a specific tile
 * @param {Array} globalMapBounds - The global map bounds [[NW], [SE]]
 * @param {number} startX - Start X pixel coordinate
 * @param {number} startY - Start Y pixel coordinate
 * @param {number} endX - End X pixel coordinate
 * @param {number} endY - End Y pixel coordinate
 * @param {number} imageWidth - Total image width in pixels
 * @param {number} imageHeight - Total image height in pixels
 * @returns {Array} Tile bounds [[NW], [SE]]
 */
export function calculateTileBounds(globalMapBounds, startX, startY, endX, endY, imageWidth, imageHeight) {
    const NW = globalMapBounds[0];
    const SE = globalMapBounds[1];
    
    const mapWidth = SE[0] - NW[0];
    const mapHeight = NW[1] - SE[1];
    
    const tileNW_X = NW[0] + (startX / imageWidth) * mapWidth;
    const tileNW_Y = NW[1] - (startY / imageHeight) * mapHeight;
    const tileSE_X = NW[0] + (endX / imageWidth) * mapWidth;
    const tileSE_Y = NW[1] - (endY / imageHeight) * mapHeight;
    
    return [[tileNW_X, tileNW_Y], [tileSE_X, tileSE_Y]];
}

/**
 * Processes a single tile by sending it to the backend API
 * @param {Blob} tileBlob - The tile image blob
 * @param {string} selection - The object selection string
 * @param {Array} tileBounds - The geographic bounds of the tile
 * @param {Array} tileDims - The tile dimensions [height, width]
 * @param {number} tileIndex - The index of the tile
 * @returns {Promise} Promise resolving to tile processing result
 */
export async function processSingleTile(tileBlob, selection, tileBounds, tileDims, tileIndex) {
    console.log(`Sending tile ${tileIndex} to backend...`);
    
    const formData = new FormData();
    formData.append('selection', selection);
    formData.append('mapExtent', JSON.stringify(tileBounds));
    formData.append('imageData', tileBlob, `tile-${tileIndex}.png`);
    formData.append('tileInfo', JSON.stringify({
        index: tileIndex,
        tileDims: tileDims
    }));
    
    // Get RunPod API key from the interface and include it in the request
    const runpodApiKey = document.getElementById('runpod-api-key')?.value?.trim();
    if (runpodApiKey) {
        formData.append('runpodApiKey', runpodApiKey);
        console.log(`Including RunPod API key from interface (length: ${runpodApiKey.length})`);
    } else {
        console.log('No RunPod API key found in interface');
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5000/receive', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log(`Tile ${tileIndex} response:`, data);
        
        if (data.message === 'Successfully retrieved outline' && data.outline) {
            return {
                tileIndex: tileIndex,
                data: data
            };
        } else if (data.error) {
            console.error(`Tile ${tileIndex} error:`, data.error);
            return null;
        }
    } catch (error) {
        console.error(`Network error for tile ${tileIndex}:`, error);
        return null;
    }
}

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