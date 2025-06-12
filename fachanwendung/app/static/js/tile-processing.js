// Import geometry utility functions
import {
    isPolygonClockwise,
    combineNeighboringMasks
} from './geometry-utils.js';

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
        layer = window.carLayer;
    } else if (object === "Truck") {
        layer = window.truckLayer;
    } else if (object === "Bus") {
        layer = window.busLayer;
    } else if (object === "Motorcycle") {
        layer = window.motorcycleLayer;
    } else if (object === "Bicycle") {
        layer = window.bicycleLayer;
    } else if (object === "Train") {
        layer = window.trainLayer;
    } else if (object === "Aircraft") {
        layer = window.aircraftLayer;
    } else if (object === "Ship") {
        layer = window.shipLayer;
    } else if (object === "Boat") {
        layer = window.boatLayer;
    
    // Infrastructure layers
    } else if (object === "Building") {
        layer = window.buildingLayer;
    } else if (object === "House") {
        layer = window.houseLayer;
    } else if (object === "Skyscraper") {
        layer = window.skyscraperLayer;
    } else if (object === "Factory") {
        layer = window.factoryLayer;
    } else if (object === "Warehouse") {
        layer = window.warehouseLayer;
    } else if (object === "School") {
        layer = window.schoolLayer;
    } else if (object === "Hospital") {
        layer = window.hospitalLayer;
    } else if (object === "Bridge") {
        layer = window.bridgeLayer;
    } else if (object === "Road") {
        layer = window.roadLayer;
    } else if (object === "Highway") {
        layer = window.highwayLayer;
    } else if (object === "Runway") {
        layer = window.runwayLayer;
    } else if (object === "Parking Lot") {
        layer = window.parkingLotLayer;
    } else if (object === "Solar Panel") {
        layer = window.solarPanelLayer;
    } else if (object === "Wind Turbine") {
        layer = window.windTurbineLayer;
    
    // Natural features layers
    } else if (object === "River") {
        layer = window.riverLayer;
    } else if (object === "Lake") {
        layer = window.lakeLayer;
    } else if (object === "Ocean") {
        layer = window.oceanLayer;
    } else if (object === "Stream") {
        layer = window.streamLayer;
    } else if (object === "Pond") {
        layer = window.pondLayer;
    } else if (object === "Wetland") {
        layer = window.wetlandLayer;
    } else if (object === "Mountain") {
        layer = window.mountainLayer;
    } else if (object === "Hill") {
        layer = window.hillLayer;
    } else if (object === "Valley") {
        layer = window.valleyLayer;
    } else if (object === "Canyon") {
        layer = window.canyonLayer;
    } else if (object === "Beach") {
        layer = window.beachLayer;
    } else if (object === "Coastline") {
        layer = window.coastlineLayer;
    } else if (object === "Island") {
        layer = window.islandLayer;
    
    // Vegetation layers
    } else if (object === "Forest") {
        layer = window.forestLayer;
    } else if (object === "Tree") {
        layer = window.treeLayer;
    } else if (object === "Grass") {
        layer = window.grassLayer;
    } else if (object === "Crop Field") {
        layer = window.cropFieldLayer;
    } else if (object === "Farmland") {
        layer = window.farmlandLayer;
    } else if (object === "Orchard") {
        layer = window.orchardLayer;
    } else if (object === "Vineyard") {
        layer = window.vineyardLayer;
    } else if (object === "Park") {
        layer = window.parkLayer;
    } else if (object === "Garden") {
        layer = window.gardenLayer;
    } else if (object === "Shrub") {
        layer = window.shrubLayer;
    } else if (object === "Pasture") {
        layer = window.pastureLayer;
    
    // Urban features layers
    } else if (object === "Urban Area") {
        layer = window.urbanAreaLayer;
    } else if (object === "Residential") {
        layer = window.residentialLayer;
    } else if (object === "Commercial") {
        layer = window.commercialLayer;
    } else if (object === "Industrial") {
        layer = window.industrialLayer;
    } else if (object === "Construction Site") {
        layer = window.constructionSiteLayer;
    } else if (object === "Stadium") {
        layer = window.stadiumLayer;
    } else if (object === "Sports Field") {
        layer = window.sportsFieldLayer;
    } else if (object === "Golf Course") {
        layer = window.golfCourseLayer;
    } else if (object === "Cemetery") {
        layer = window.cemeteryLayer;
    
    // Geological layers
    } else if (object === "Rock Formation") {
        layer = window.rockFormationLayer;
    } else if (object === "Sand") {
        layer = window.sandLayer;
    } else if (object === "Desert") {
        layer = window.desertLayer;
    } else if (object === "Quarry") {
        layer = window.quarryLayer;
    } else if (object === "Mine") {
        layer = window.mineLayer;
    } else if (object === "Landslide") {
        layer = window.landslideLayer;
    } else if (object === "Erosion") {
        layer = window.erosionLayer;
    
    // Environmental layers
    } else if (object === "Fire") {
        layer = window.fireLayer;
    } else if (object === "Flood") {
        layer = window.floodLayer;
    } else if (object === "Snow") {
        layer = window.snowLayer;
    } else if (object === "Ice") {
        layer = window.iceLayer;
    } else if (object === "Cloud") {
        layer = window.cloudLayer;
    } else if (object === "Shadow") {
        layer = window.shadowLayer;
    } else if (object === "Smoke") {
        layer = window.smokeLayer;
    } else if (object === "Pollution") {
        layer = window.pollutionLayer;
    
    // Agriculture layers
    } else if (object === "Greenhouse") {
        layer = window.greenhouseLayer;
    } else if (object === "Barn") {
        layer = window.barnLayer;
    } else if (object === "Silo") {
        layer = window.siloLayer;
    } else if (object === "Irrigation") {
        layer = window.irrigationLayer;
    } else if (object === "Livestock") {
        layer = window.livestockLayer;
    
    // Default fallback to building layer
    } else {
        layer = window.buildingLayer;
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
    
    // Combine neighboring tile masks if they are close enough
    const combinedGeometries = combineNeighboringMasks(allGeometries, tileConfig);
    
    // Convert combined geometries to features and add to map
    if (combinedGeometries.length > 0) {
        const geoms = combinedGeometries.map(geom => [geom.coordinates]);
        
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
            
            console.log(`Added ${features.length} combined features to map`);
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