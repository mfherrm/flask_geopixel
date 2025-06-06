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
    
    // Determine target layer
    let layer = "";
    if (object === "Car") {
        layer = window.carLayer;
    } else if (object === "River") {
        layer = window.riverLayer;
    } else {
        layer = window.buildingLayer;
    }
    
    console.log("Target layer:", layer);
    
    // Process each tile's results
    validResults.forEach(result => {
        const { tileIndex, data } = result;
        
        if (data.outline && data.outline.length > 0) {
            console.log(`Processing geometries from tile ${tileIndex}`);
            
            const geoms = [];
            
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
                    
                    geoms.push([mapCoords]);
                });
            }
            
            if (geoms.length > 0) {
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
                    
                    console.log(`Added ${features.length} features from tile ${tileIndex}`);
                } catch (error) {
                    console.error(`Error creating features for tile ${tileIndex}:`, error);
                }
            }
        }
    });
    
    // Refresh the layer and map
    layer.changed();
    map.render();
    map.renderSync();
    
    console.log("Tiled processing complete!");
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