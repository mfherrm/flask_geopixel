import { cadenza } from './cadenza3.0.4.js';
document.getElementById('screenMap').addEventListener('click', () => {
    let mbs = document.getElementById("cadenza-iframe").src.split("mapExtent=")[1].split("%2C")
    mbs[3] = mbs[3].split("&")[0]
    console.log("Map bounds: \n \t NW: ", mbs[0], mbs[1], "\n \t SE: ", mbs[2], mbs[3])
    var mapBounds = [[mbs[0], mbs[1]], [mbs[2], mbs[3]]]

    const formData = new FormData();
    formData.append('mapExtent', JSON.stringify(mapBounds));

    fetch('http://127.0.0.1:5000/receive', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
        .then(data => {
            console.log(data);

            console.log()
            if (data.message === 'Successfully retrieved outline' && data.outline) {
                console.log(mapBounds)

                console.log(data.imageDims)

                console.log(data.outline)

                var mapCoords = imageCoordsToMapCoords(mapBounds, data.outline, data.imageDims)

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

                var polygon = {
                    "type": "Polygon",
                    "coordinates": [mapCoords],
                }
                console.log(polygon)

                if (polygon) {
                    try {
                        cadenzaClient.editGeometry('messstellenkarte', polygon, { useMapSrs: true }
                        );

                        cadenzaClient.on('editGeometry:ok', (event) => {
                            console.log('Geometry editing was completed', event.detail.geometry);
                            cadenzaClient.showMap('messstellenkarte', {
                                useMapSrs: true,
                                mapExtent: [
                                    852513.341856, 6511017.966314, 916327.095083, 7336950.728974
                                ],
                                geometry: polygon
                            });
                        });
                        cadenzaClient.on('editGeometry:cancel', (event) => {
                            console.log('Geometry editing was cancelled');
                            cadenzaClient.showMap('messstellenkarte', {
                                useMapSrs: true,
                                mapExtent: [
                                    852513.341856, 6511017.966314, 916327.095083, 7336950.728974
                                ]});
                            });
                        } catch (error) {
                            console.log(error)
                        }
                    } else {
                        console.log("No Polygon")
                        cadenzaClient.createGeometry('messstellenkarte', 'Polygon');
                    };



                } else if (data.error) {
                    alert(`Error: ${data.error}`);
                }
            }).catch(e => {
                alert(e.toString());
            });

});

function imageCoordsToMapCoords(mapExtent, imageCoords, imageDims) {
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

        // Ensure coord is an array with two numeric values
        if (Array.isArray(coord)) {
            const x = parseFloat(coord[0][0]);
            const y = parseFloat(coord[0][1]);

            // Create a new coordinate pair with proper calculations
            const mapCoord = [
                NW[0] + x * pixelCoordX,
                NW[1] + y * pixelCoordY
            ];

            result.push(mapCoord);

            if (i == 0) {
                firstCoord.push(mapCoord)
            }
        } else {
            console.error("Invalid coordinate at index", i, ":", coord);
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

function closeGeometryModal() {
    const modal = document.getElementsByClassName('d-modal-fullscreen--sidebar-content d-stack-v space-3 d-edit-geometry-dialog--sidebar-right')
    console.log(modal)
    const geometryModal = bootstrap.Modal.getInstance(modal);
    geometryModal.hide();
}