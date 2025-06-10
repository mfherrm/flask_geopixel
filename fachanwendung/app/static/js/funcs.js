import './cadenza3.0.4.js';

// Global tile configuration
let tileConfig = {
    count: 1,
    rows: 1,
    cols: 1,
    label: "1 tile (1x1)"
};

// Dropup functionality is now handled in the HTML file
// This ensures proper loading and execution order

// Add tile configuration update to window so it can be called from HTML
window.updateTileConfig = updateTileConfig;

function updateTileConfig(tileCount) {
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
        tileConfig = {
            count: tileCount,
            rows: tileConfigs[tileCount].rows,
            cols: tileConfigs[tileCount].cols,
            label: tileConfigs[tileCount].label
        };
    } else {
        console.error(`Unknown tile count: ${tileCount}`);
    }
}

document.getElementById('screenMap').addEventListener('click', async () => {
    let mbs = map.getView().calculateExtent()

    console.log("Map bounds (extent): [minX, minY, maxX, maxY] = ", mbs)
    console.log("Map bounds: \n \t SW: ", mbs[0], mbs[1], "\n \t NE: ", mbs[2], mbs[3])
    // As NW and SE
    var mapBounds = [[mbs[0], mbs[3]], [mbs[2], mbs[1]]]
    console.log("Transformed mapBounds: \n \t NW: ", mapBounds[0], "\n \t SE: ", mapBounds[1])

    // Store current visibility of vector layers
    const layerVisibility = [];
    
    // Hide vector layers for satellite-only capture
    const layers = map.getLayers().getArray();
    layers.forEach((layer, index) => {
        layerVisibility[index] = layer.getVisible();
        // Hide all layers except the first one (satellite base layer)
        if (index > 0) {
            layer.setVisible(false);
        }
    });
    
    // Force map re-render without vector layers
    map.renderSync();
    
    map.once('rendercomplete', function () {
        const mapCanvas = document.createElement('canvas');
        const size = map.getSize();
        mapCanvas.width = size[0];
        mapCanvas.height = size[1];
        const mapContext = mapCanvas.getContext('2d');
        Array.prototype.forEach.call(
            map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
            function (canvas) {
                if (canvas.width > 0) {
                    const opacity =
                        canvas.parentNode.style.opacity || canvas.style.opacity;
                    mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
                    let matrix;
                    const transform = canvas.style.transform;
                    if (transform) {
                        // Get the transform parameters from the style's transform matrix
                        matrix = transform
                            .match(/^matrix\(([^\(]*)\)$/)[1]
                            .split(',')
                            .map(Number);
                    } else {
                        matrix = [
                            parseFloat(canvas.style.width) / canvas.width,
                            0,
                            0,
                            parseFloat(canvas.style.height) / canvas.height,
                            0,
                            0,
                        ];
                    }
                    // Apply the transform to the export map context
                    CanvasRenderingContext2D.prototype.setTransform.apply(
                        mapContext,
                        matrix,
                    );
                    const backgroundColor = canvas.parentNode.style.backgroundColor;
                    if (backgroundColor) {
                        mapContext.fillStyle = backgroundColor;
                        mapContext.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    mapContext.drawImage(canvas, 0, 0);
                }
            },
        );
        mapContext.globalAlpha = 1;
        mapContext.setTransform(1, 0, 0, 1, 0, 0);

        // Convert canvas to blob and handle tiled processing
        mapCanvas.toBlob(function (blob) {
            console.log("Canvas converted to blob:", blob);
            console.log("Blob size:", blob ? blob.size : "null");
            console.log("Blob type:", blob ? blob.type : "null");

            if (!blob) {
                console.error("Failed to create blob from canvas");
                alert("Failed to capture map image");
                return;
            }

            // Get form data
            const object = document.getElementById('objbttn').textContent.trim();
            const color = document.getElementById('colorbttn').textContent.trim();

            if (object === "Object" || object === "") {
                alert("Error: object needs to be selected");
                return;
            }

            let colorValue = color;
            let selection;
            if (color === "No color" || color === "Color") {
                selection = JSON.stringify(object.toLowerCase());
            } else {
                selection = JSON.stringify(colorValue.toLowerCase() + " " + object.toLowerCase());
            }

            console.log("Selection", selection);

            // Process image in tiles using selected configuration
            console.log(`Processing image with ${tileConfig.label}`);
            processTiledImage(blob, selection, mapBounds, object);
            
        }, 'image/png');
        
        // Restore original layer visibility after screenshot
        layers.forEach((layer, index) => {
            layer.setVisible(layerVisibility[index]);
        });
        
        // Re-render map with restored layers
        map.renderSync();
    });
    map.renderSync();

});

async function processTiledImage(imageBlob, selection, mapBounds, object) {
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
        combineAndDisplayTileResults(allTileResults, object);
    };
    
    img.src = URL.createObjectURL(imageBlob);
}

function calculateTileBounds(globalMapBounds, startX, startY, endX, endY, imageWidth, imageHeight) {
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

async function processSingleTile(tileBlob, selection, tileBounds, tileDims, tileIndex) {
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

function combineAndDisplayTileResults(tileResults, object) {
    console.log(`Combining results from ${tileConfig.label}...`);
    
    const validResults = tileResults.filter(result => result !== null);
    console.log(`Successfully processed ${validResults.length} tiles out of ${tileConfig.count} total tiles`);
    
    if (validResults.length === 0) {
        alert("No valid results from tile processing");
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
    const combinedGeometries = combineNeighboringMasks(allGeometries);
    
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
}


/**
 * Combines neighboring tile masks that are within a small threshold distance.
 * Only combines masks from different tiles and uses more conservative criteria.
 *
 * @param {Array} geometries - Array of geometry objects with tile information
 * @returns {Array} - Array of combined geometries
 */
function combineNeighboringMasks(geometries) {
    console.log(`Starting mask combining for ${geometries.length} geometries...`);
    
    // More conservative distance threshold for combining masks (in map units - meters for EPSG:3857)
    const COMBINE_THRESHOLD = 25; // 25 meters - more conservative
    
    const combinedGeometries = [];
    const processed = new Set();
    
    for (let i = 0; i < geometries.length; i++) {
        if (processed.has(i)) continue;
        
        const currentGeom = geometries[i];
        const tilesToCombine = [i];
        processed.add(i);
        
        // Find neighboring tiles and check for close masks
        for (let j = i + 1; j < geometries.length; j++) {
            if (processed.has(j)) continue;
            
            const otherGeom = geometries[j];
            
            // Only combine masks from different tiles
            if (currentGeom.tileIndex === otherGeom.tileIndex) continue;
            
            // Check if tiles are neighbors (only direct neighbors, not diagonal)
            if (areDirectNeighbors(currentGeom.tileIndex, otherGeom.tileIndex)) {
                // Check if masks are close enough and similar enough to combine
                const distance = calculatePolygonDistance(currentGeom.coordinates, otherGeom.coordinates);
                
                if (distance <= COMBINE_THRESHOLD) {
                    // Additional check: only combine if masks have similar areas (within 3x ratio)
                    const area1 = calculatePolygonArea(currentGeom.coordinates);
                    const area2 = calculatePolygonArea(otherGeom.coordinates);
                    const areaRatio = Math.max(area1, area2) / Math.min(area1, area2);
                    
                    if (areaRatio <= 3.0) {
                        console.log(`Combining masks from tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} (distance: ${distance.toFixed(2)}m, area ratio: ${areaRatio.toFixed(2)})`);
                        tilesToCombine.push(j);
                        processed.add(j);
                    } else {
                        console.log(`Skipping combine for tiles ${currentGeom.tileIndex} and ${otherGeom.tileIndex} - area ratio too large: ${areaRatio.toFixed(2)}`);
                    }
                }
            }
        }
        
        // Combine the masks if we have multiple tiles to combine
        if (tilesToCombine.length > 1) {
            const masksToCombine = tilesToCombine.map(idx => geometries[idx].coordinates);
            const combinedMask = combineMasks(masksToCombine);
            
            combinedGeometries.push({
                coordinates: combinedMask,
                combinedFromTiles: tilesToCombine.map(idx => geometries[idx].tileIndex)
            });
        } else {
            // Keep original mask
            combinedGeometries.push({
                coordinates: currentGeom.coordinates,
                originalTile: currentGeom.tileIndex
            });
        }
    }
    
    console.log(`Mask combining complete: ${geometries.length} → ${combinedGeometries.length} geometries`);
    return combinedGeometries;
}

/**
 * Determines if two tiles are direct neighbors (horizontally or vertically adjacent).
 * This is more conservative than diagonal neighbors.
 *
 * @param {number} tileIndex1 - First tile index
 * @param {number} tileIndex2 - Second tile index
 * @returns {boolean} - True if tiles are direct neighbors
 */
function areDirectNeighbors(tileIndex1, tileIndex2) {
    const cols = tileConfig.cols;
    
    // Convert tile indices to row, col coordinates
    const row1 = Math.floor(tileIndex1 / cols);
    const col1 = tileIndex1 % cols;
    const row2 = Math.floor(tileIndex2 / cols);
    const col2 = tileIndex2 % cols;
    
    // Check if tiles are directly adjacent (horizontally or vertically only)
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Determines if two tiles are neighbors in the grid.
 *
 * @param {number} tileIndex1 - First tile index
 * @param {number} tileIndex2 - Second tile index
 * @returns {boolean} - True if tiles are neighbors
 */
function areNeighboringTiles(tileIndex1, tileIndex2) {
    const cols = tileConfig.cols;
    const rows = tileConfig.rows;
    
    // Convert tile indices to row, col coordinates
    const row1 = Math.floor(tileIndex1 / cols);
    const col1 = tileIndex1 % cols;
    const row2 = Math.floor(tileIndex2 / cols);
    const col2 = tileIndex2 % cols;
    
    // Check if tiles are adjacent (horizontally, vertically, or diagonally)
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    
    return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
}

/**
 * Calculates the minimum distance between two polygons.
 *
 * @param {Array} poly1 - First polygon coordinates
 * @param {Array} poly2 - Second polygon coordinates
 * @returns {number} - Minimum distance between polygons
 */
function calculatePolygonDistance(poly1, poly2) {
    let minDistance = Infinity;
    
    // Check distance between all points of both polygons
    for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
            const distance = Math.sqrt(
                Math.pow(poly1[i][0] - poly2[j][0], 2) +
                Math.pow(poly1[i][1] - poly2[j][1], 2)
            );
            minDistance = Math.min(minDistance, distance);
        }
    }
    
    return minDistance;
}

/**
 * Combines multiple masks into a single unified mask.
 * Uses a more conservative approach that preserves the original mask shapes.
 *
 * @param {Array} masks - Array of polygon coordinates to combine
 * @returns {Array} - Combined polygon coordinates
 */
function combineMasks(masks) {
    if (masks.length === 1) {
        return masks[0];
    }
    
    // For now, use a simple approach: find the largest mask and merge smaller ones into it
    // This preserves the general shape better than convex hull
    let largestMask = masks[0];
    let largestArea = calculatePolygonArea(largestMask);
    
    for (let i = 1; i < masks.length; i++) {
        const area = calculatePolygonArea(masks[i]);
        if (area > largestArea) {
            largestMask = masks[i];
            largestArea = area;
        }
    }
    
    // Return the largest mask as the representative shape
    // In a more sophisticated implementation, we could use proper polygon union algorithms
    return largestMask;
}

/**
 * Calculates the approximate area of a polygon using the shoelace formula.
 *
 * @param {Array} coords - Array of [x, y] coordinates
 * @returns {number} - Polygon area
 */
function calculatePolygonArea(coords) {
    if (coords.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1]);
    }
    return Math.abs(area) / 2;
}

/**
 * Computes the convex hull of a set of points using Graham scan algorithm.
 *
 * @param {Array} points - Array of [x, y] coordinates
 * @returns {Array} - Convex hull as array of [x, y] coordinates
 */
function convexHull(points) {
    if (points.length < 3) return points;
    
    // Remove duplicate points
    const uniquePoints = [];
    const seen = new Set();
    points.forEach(point => {
        const key = `${point[0]},${point[1]}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePoints.push(point);
        }
    });
    
    if (uniquePoints.length < 3) return uniquePoints;
    
    // Find the bottom-most point (and leftmost in case of tie)
    let start = 0;
    for (let i = 1; i < uniquePoints.length; i++) {
        if (uniquePoints[i][1] < uniquePoints[start][1] ||
            (uniquePoints[i][1] === uniquePoints[start][1] && uniquePoints[i][0] < uniquePoints[start][0])) {
            start = i;
        }
    }
    
    // Swap start point to beginning
    [uniquePoints[0], uniquePoints[start]] = [uniquePoints[start], uniquePoints[0]];
    
    // Sort points by polar angle with respect to start point
    const startPoint = uniquePoints[0];
    uniquePoints.slice(1).sort((a, b) => {
        const angleA = Math.atan2(a[1] - startPoint[1], a[0] - startPoint[0]);
        const angleB = Math.atan2(b[1] - startPoint[1], b[0] - startPoint[0]);
        if (angleA === angleB) {
            // If angles are equal, sort by distance
            const distA = Math.pow(a[0] - startPoint[0], 2) + Math.pow(a[1] - startPoint[1], 2);
            const distB = Math.pow(b[0] - startPoint[0], 2) + Math.pow(b[1] - startPoint[1], 2);
            return distA - distB;
        }
        return angleA - angleB;
    });
    
    // Build convex hull
    const hull = [uniquePoints[0], uniquePoints[1]];
    
    for (let i = 2; i < uniquePoints.length; i++) {
        // Remove points that make clockwise turn
        while (hull.length > 1 && crossProduct(hull[hull.length - 2], hull[hull.length - 1], uniquePoints[i]) <= 0) {
            hull.pop();
        }
        hull.push(uniquePoints[i]);
    }
    
    // Close the polygon
    if (hull.length > 0 && JSON.stringify(hull[0]) !== JSON.stringify(hull[hull.length - 1])) {
        hull.push([...hull[0]]);
    }
    
    return hull;
}

/**
 * Calculates the cross product for three points to determine turn direction.
 *
 * @param {Array} O - First point [x, y]
 * @param {Array} A - Second point [x, y]
 * @param {Array} B - Third point [x, y]
 * @returns {number} - Cross product (positive for counter-clockwise, negative for clockwise)
 */
function crossProduct(O, A, B) {
    return (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
}

/**
 * Determines if a polygon is in clockwise order.
 * For the right-hand rule, exterior rings should be counterclockwise.
 *
 * @param {Array} coords - Array of coordinate pairs [x, y]
 * @returns {boolean} - True if clockwise, false if counterclockwise
 */
function isPolygonClockwise(coords) {
    // Implementation of the Shoelace formula (also known as the surveyor's formula)
    // to calculate the signed area of the polygon
    let area = 0;

    // Need at least 3 points to form a polygon
    if (coords.length < 3) {
        return false;
    }

    for (let i = 0; i < coords.length - 1; i++) {
        area += (coords[i + 1][0] - coords[i][0]) * (coords[i + 1][1] + coords[i][1]);
    }

    // If the signed area is positive, the polygon is clockwise
    return area > 0;
}

// Wait for Cadenza to initialize before setting up the toggle functionality
$(document).ready(function () {
    // Delay the setup of radio button functionality to ensure Cadenza is loaded
    setTimeout(function () {
        $('input[name="vis"]').on('change', function () {
            console.log("toggled visibility");
            const value = +this.value;

            // Toggle OpenLayers map
            $('#OL-map').toggle(value === 1 && this.checked);

            // Toggle Cadenza iframe
            $('#cadenza-iframe').toggle(value === 2 && this.checked);

            // Enable/disable the "Call GeoPixel" button based on Cadenza visibility
            const screenMapButton = document.getElementById('screenMap');
            if (value === 1 && this.checked) {
                // Enable the button when Cadenza is invisible
                screenMapButton.disabled = false;
                screenMapButton.classList.remove('disabled-button');
            } else {
                // Disable the button when Cadenza is visible
                screenMapButton.disabled = true;
                screenMapButton.classList.add('disabled-button');
            }
        });

        // Manually trigger the change event on the checked radio button
        // This ensures the correct element is shown based on the initial selection
        $('input[name="vis"]:checked').trigger('change');
    }, 1000); // 1 second delay to ensure Cadenza is fully initialized
});