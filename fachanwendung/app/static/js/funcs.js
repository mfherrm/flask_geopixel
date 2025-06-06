import './cadenza3.0.4.js';
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

        // Convert canvas to blob and handle form submission
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

            // Create FormData with image blob
            const formData = new FormData();
            formData.append('selection', selection);
            formData.append('mapExtent', JSON.stringify(mapBounds));
            formData.append('imageData', blob, 'map-image.png');

            // Debug: Log FormData contents
            console.log("FormData entries:");
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
                if (value instanceof File || value instanceof Blob) {
                    console.log(`  ${key}: ${value.constructor.name}, size: ${value.size}, type: ${value.type}`);
                }
            }

            // Send the request
            fetch('http://127.0.0.1:5000/receive', {
                method: 'POST',
                body: formData
            }).then(response => response.json())
                .then(data => {
                    console.log(data);

                    if (data.message === 'Successfully retrieved outline' && data.outline) {
                        console.log("Image dims:", data.imageDims);
                        console.log("Coordinates transformed:", data.coordinates_transformed);
                        console.log("Outline data:", data.outline);
                        console.log("Number of contours:", data.outline.length);

                        var geoms = [];

                        if (data.coordinates_transformed) {
                            // Backend has already transformed coordinates to geographic format
                            console.log("Using pre-transformed geographic coordinates from backend");
                            
                            // Process all contours, not just the first one
                            data.outline.forEach((contour, index) => {
                                console.log(`Processing contour ${index} with ${contour.length} points`);
                                var mapCoords = contour; // Already in geographic coordinates
                                
                                // Ensure polygon is closed
                                if (mapCoords.length > 0 && JSON.stringify(mapCoords[0]) !== JSON.stringify(mapCoords[mapCoords.length - 1])) {
                                    mapCoords.push([...mapCoords[0]]);
                                }

                                // Check if polygon follows right-hand rule (counterclockwise orientation)
                                const isClockwise = isPolygonClockwise(mapCoords);

                                // If clockwise, reverse the coordinates to follow right-hand rule
                                if (isClockwise) {
                                    console.log(`Contour ${index} is clockwise, reversing to follow right-hand rule`);
                                    mapCoords.reverse();
                                } else {
                                    console.log(`Contour ${index} already follows right-hand rule (counterclockwise)`);
                                }
                                
                                geoms.push([mapCoords]);
                            });
                        } else {
                            // Need to transform pixel coordinates to geographic coordinates
                            console.log("Transforming pixel coordinates to geographic coordinates");
                            var mapCoords = imageCoordsToMapCoords(mapBounds, data.outline, data.imageDims);

                            // Ensure polygon is closed
                            if (JSON.stringify(mapCoords[0]) !== JSON.stringify(mapCoords[mapCoords.length - 1])) {
                                mapCoords.push([...mapCoords[0]]);
                            }

                            // Check if polygon follows right-hand rule (counterclockwise orientation)
                            const isClockwise = isPolygonClockwise(mapCoords);

                            // If clockwise, reverse the coordinates to follow right-hand rule
                            if (isClockwise) {
                                console.log("Polygon is clockwise, reversing to follow right-hand rule");
                                mapCoords.reverse();
                            } else {
                                console.log("Polygon already follows right-hand rule (counterclockwise)");
                            }
                            geoms.push([mapCoords]);
                        }

                        let layer = ""
                        if (object === "Car") {
                            layer = window.carLayer
                        } else if (object === "River") {
                            layer = window.riverLayer
                        } else {
                            layer = window.buildingLayer
                        }

                        console.log("Object", object, "Layer", layer)

                        var polygon = {
                            "type": "MultiPolygon",
                            "coordinates": geoms,
                        };

                        console.log("Polygon", polygon)

                        const features = new ol.format.GeoJSON().readFeatures(polygon, {
                            dataProjection: 'EPSG:3857',     // Input coordinates are already in EPSG:3857
                            featureProjection: 'EPSG:3857',  // Map projection
                        })
                        console.log("Features", features)

                        const featureArray = Array.isArray(features) ? features : [features];

                        featureArray.forEach(feature => {
                            feature.setStyle(layer.getStyle());
                            layer.getSource().addFeature(feature);
                        });
                        layer.changed()
                        map.render(); 
                        map.renderSync();
                        // addRectangleToLayer(features, layer)

                        // cadenzaClient.showMap('messstellenkarte', {
                        // useMapSrs: true,
                        // mapExtent: [
                        //     mbs[0], mbs[1], mbs[2], mbs[3]
                        // ],
                        //  geometry: polygon
                        //});



                    } else if (data.error) {
                        alert(`Error: ${data.error}`);
                    }
                }).catch(e => {
                    alert(e.toString());
                });
            
            // Restore original layer visibility after screenshot
            layers.forEach((layer, index) => {
                layer.setVisible(layerVisibility[index]);
            });
            
            // Re-render map with restored layers
            map.renderSync();
        }, 'image/png');
    });
    map.renderSync();

});

function imageCoordsToMapCoords(mapExtent, imageCoords, imageDims) {
    console.log("=== Coordinate Transformation Debug ===");
    console.log("Input imageCoords length:", imageCoords.length);
    console.log("First few image coords:", imageCoords.slice(0, 3));
    
    // Parse all input values to ensure they're numbers
    const NW = [parseFloat(mapExtent[0][0]), parseFloat(mapExtent[0][1])];
    const SE = [parseFloat(mapExtent[1][0]), parseFloat(mapExtent[1][1])];
    const width = parseFloat(imageDims[1]);
    const height = parseFloat(imageDims[0]);

    console.log("Map extent - NW:", NW, "SE:", SE);
    console.log("Image dimensions:", width, "x", height);
    
    // Calculate map bounds in a more explicit way
    const mapMinX = NW[0];
    const mapMaxX = SE[0];
    const mapMinY = SE[1];
    const mapMaxY = NW[1];
    
    console.log("Map bounds: minX:", mapMinX, "maxX:", mapMaxX, "minY:", mapMinY, "maxY:", mapMaxY);
    console.log("Map width:", mapMaxX - mapMinX, "Map height:", mapMaxY - mapMinY);

    // Validate map extent and dimensions
    if (isNaN(NW[0]) || isNaN(NW[1]) || isNaN(SE[0]) || isNaN(SE[1])) {
        console.error("Invalid map extent:", mapExtent);
        return [];
    }
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error("Invalid image dimensions:", imageDims);
        return [];
    }

    // Calculate scaling factors
    const pixelCoordX = (mapMaxX - mapMinX) / width;
    const pixelCoordY = (mapMaxY - mapMinY) / height;

    console.log("Pixel scaling factors: X =", pixelCoordX, "Y =", pixelCoordY);

    // Create a new array to avoid modifying the input
    const result = [];
    const firstCoord = []

    // Process each coordinate pair and add to result array
    for (let i = 0; i < imageCoords.length; i++) {
        const coord = imageCoords[i];
        
        // Ensure coord is an array with two numeric values
        if (Array.isArray(coord) && coord.length >= 2) {
            const x = parseFloat(coord[0]);
            const y = parseFloat(coord[1]);

            // Validate parsed coordinates
            if (isNaN(x) || isNaN(y)) {
                console.error(`Invalid coordinate values at index ${i}: x=${x}, y=${y}, original:`, coord);
                continue; // Skip this coordinate
            }

            // Create a new coordinate pair with proper calculations
            // Image coordinates: (0,0) = top-left, (width,height) = bottom-right
            // Map coordinates: standard geographic coordinates
            const mapCoord = [
                mapMinX + x * pixelCoordX,        // X: left to right
                mapMaxY - y * pixelCoordY         // Y: top to bottom (flip Y axis)
            ];

            // Log first few transformations for debugging
            if (i < 3) {
                console.log(`Transform [${i}]: img(${x}, ${y}) -> map(${mapCoord[0]}, ${mapCoord[1]})`);
            }

            // Validate calculated coordinates
            if (isNaN(mapCoord[0]) || isNaN(mapCoord[1])) {
                console.error(`Calculated coordinate is NaN at index ${i}:`, mapCoord);
                continue; // Skip this coordinate
            }

            result.push(mapCoord);

            if (i == 0) {
                firstCoord.push(mapCoord)
            }
        } else {
            console.error("Invalid coordinate at index", i, ":", coord);
        }
    }
    
    // Add first coordinate to close polygon if we have any coordinates
    if (firstCoord.length > 0) {
        result.push(firstCoord[0]);
    }

    console.log("Transformation complete. Input coords:", imageCoords.length, "Output coords:", result.length);
    console.log("First 3 output coords:", result.slice(0, 3));
    console.log("=== End Coordinate Transformation Debug ===");

    return result;
};

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

document.getElementById('export-png').addEventListener('click', function () {
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
        const link = document.getElementById('image-download');
        link.href = mapCanvas.toDataURL();
        link.click();
    });
    map.renderSync();
});