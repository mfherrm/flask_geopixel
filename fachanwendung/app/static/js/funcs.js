import './cadenza3.0.4.js';
document.getElementById('screenMap').addEventListener('click', async () => {
    let mbs = map.getView().calculateExtent()

    console.log("Map bounds: \n \t SW: ", mbs[0], mbs[1], "\n \t NE: ", mbs[2], mbs[3])
    // As NW and SE
    var mapBounds = [[mbs[0], mbs[3]], [mbs[2], mbs[1]]]

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
        mapCanvas.toBlob(function(blob) {
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
                        console.log(data.imageDims);
                        console.log(data.outline);

                        var geoms = [];

                        for (const pos in [data.outline]) {
                            var mapCoords = imageCoordsToMapCoords(mapBounds, [data.outline][pos], data.imageDims);

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

                        console.log("Geoms", geoms);

                        var polygon = {
                            "type": "MultiPolygon",
                            "coordinates": geoms,
                        };

                        cadenzaClient.showMap('messstellenkarte', {
                            useMapSrs: true,
                            mapExtent: [
                                mbs[0], mbs[1], mbs[2], mbs[3]
                            ],
                            geometry: polygon
                        });
                    } else if (data.error) {
                        alert(`Error: ${data.error}`);
                    }
                }).catch(e => {
                    alert(e.toString());
                });
        }, 'image/png');
    });
    map.renderSync();

});

function imageCoordsToMapCoords(mapExtent, imageCoords, imageDims) {
    console.log("Image coords", imageCoords)
    // Parse all input values to ensure they're numbers
    const NW = [parseFloat(mapExtent[0][0]), parseFloat(mapExtent[0][1])];
    const SE = [parseFloat(mapExtent[1][0]), parseFloat(mapExtent[1][1])];
    const width = parseFloat(imageDims[0]);
    const height = parseFloat(imageDims[1]);

    // Calculate scaling factors
    const pixelCoordX = (SE[0] - NW[0]) / width;
    const pixelCoordY = (NW[1] - SE[1]) / height;

    // console.log(imageCoords)

    console.log("NW:", NW, "SE:", SE);
    console.log("Image dimensions:", width, "x", height);
    console.log("Pixel scaling factors:", pixelCoordX, pixelCoordY);

    // Create a new array to avoid modifying the input
    const result = [];
    const firstCoord = []

    // Process each coordinate pair and add to result array
    for (let i = 0; i < imageCoords.length; i++) {
        const coord = imageCoords[i];
        for (let j = 0; j < coord.length; j++) {
            // Ensure coord is an array with two numeric values
            if (Array.isArray(coord)) {
                const x = parseFloat(coord[j][0][0]);
                const y = parseFloat(coord[j][0][1]);


                // Create a new coordinate pair with proper calculations
                const mapCoord = [
                    NW[0] + x * pixelCoordX,
                    NW[1] + y * pixelCoordY
                ];

                result.push(mapCoord);

                if (j == 0) {
                    firstCoord.push(mapCoord)
                }
            } else {
                console.error("Invalid coordinate at index", i, ":", coord);
            }

        }

    }
    result.push(firstCoord[0])

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