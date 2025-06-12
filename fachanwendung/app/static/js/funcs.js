import './cadenza3.0.4.js';
// Import geometry utility functions from dedicated module
import {
    calculatePolygonDistance,
    calculatePolygonArea,
    isPolygonClockwise,
    crossProduct,
    convexHull,
    combineMasks,
    combineNeighboringMasks,
    areDirectNeighbors,
    areNeighboringTiles
} from './geometry-utils.js';

// Import tile processing functions from dedicated module
import {
    processTiledImage,
    calculateTileBounds,
    processSingleTile,
    combineAndDisplayTileResults
} from './tile-processing.js';

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

/**
 * Manages the loading state of the Call GeoPixel button
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoadingState(isLoading) {
    const button = document.getElementById('screenMap');
    const originalText = 'Call GeoPixel';
    
    if (isLoading) {
        // Disable button and show loading state
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = '<span class="loading-spinner"></span>Processing...';
        button.setAttribute('data-original-text', originalText);
    } else {
        // Re-enable button and restore original state
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.getAttribute('data-original-text') || originalText;
        button.removeAttribute('data-original-text');
    }
}

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

document.getElementById('screenMap').addEventListener('click', async (event) => {
    // Check if the button is disabled
    if (event.target.disabled) {
        event.preventDefault();
        alert('Please start a RunPod instance first to use GeoPixel functionality.');
        return;
    }
    
    // Check if the button is already in loading state
    if (event.target.classList.contains('loading')) {
        event.preventDefault();
        return;
    }
    
    // Disable button and show loading state
    setButtonLoadingState(true);
    
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
                setButtonLoadingState(false);
                return;
            }

            // Get form data
            const object = document.getElementById('objbttn').textContent.trim();
            const color = document.getElementById('colorbttn').textContent.trim();

            if (object === "Object" || object === "") {
                alert("Error: object needs to be selected");
                setButtonLoadingState(false);
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
            processTiledImage(blob, selection, mapBounds, object, tileConfig, setButtonLoadingState);
            
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

            // Button state management is now handled exclusively by RunPodManager
            // The RunPodManager will be notified of radio button changes via event listeners
            // set up in the HTML file and will update the button state accordingly
        });

        // Manually trigger the change event on the checked radio button
        // This ensures the correct element is shown based on the initial selection
        $('input[name="vis"]:checked').trigger('change');
    }, 1000); // 1 second delay to ensure Cadenza is fully initialized
});