import './cadenza3.0.4.js';
document.getElementById('screenMap').addEventListener('click', async () => {
    let mbs = document.getElementById("cadenza-iframe").src.split("mapExtent=")[1].split("%2C")
    mbs[3] = mbs[3].split("&")[0]

    console.log("Map bounds: \n \t SW: ", mbs[0], mbs[1], "\n \t NE: ", mbs[2], mbs[3])
    // As NW and SE
    var mapBounds = [[mbs[0], mbs[3]], [mbs[2], mbs[1]]]



    //var imgblob = await window.cadenzaClient.getData('png')
    // var blb = await captureIframe("cadenza-iframe")
    //console.log("BLB", imgblob)
    const object = document.getElementById('objbttn').textContent.trim();
    const color = document.getElementById('colorbttn').textContent.trim();

    if (object === "Object" || object === "") {
        alert("Error: object needs to be selected");
        return;
    }

    let colorValue = color;
    if (color === "No color" || color === "Color") {
        var selection = JSON.stringify(object.toLowerCase())
    } else {
        var selection = JSON.stringify(colorValue.toLowerCase() + " " + object.toLowerCase())
    }

    console.log("Selection", selection)

    const formData = new FormData();
    formData.append('selection', selection);
    // formData.append('imageData', blb);

    fetch('http://127.0.0.1:5000/receive', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
        .then(data => {
            console.log(data);

            console.log()
            if (data.message === 'Successfully retrieved outline' && data.outline) {
                // console.log(mapBounds)
                console.log(data.imageDims)
                console.log(data.outline)

                var geoms = []

                for (const pos in [data.outline]) {
                    var mapCoords = imageCoordsToMapCoords(mapBounds, [data.outline][pos], data.imageDims)

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
                    geoms.push([mapCoords])
                }

                console.log("Geoms", geoms)

                var polygon = {
                    "type": "MultiPolygon",
                    "coordinates": geoms,
                }

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