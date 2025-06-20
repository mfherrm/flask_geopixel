import './cadenza3.0.4.js';

// Import tile processing functions from dedicated module
import {
    processTiledImage,
    updateTileConfigWrapper,
    tileConfig
} from './tile-processing.js';

// Add tile configuration update to window so it can be called from HTML
window.updateTileConfig = updateTileConfigWrapper;

// Upscaling configuration
let upscalingConfig = {
    scale: 1, // Default to x1 (no upscaling)
    label: 'x1 (Original)'
};

/**
 * Update upscaling configuration
 * @param {number} scale - The upscaling factor (1, 2, 4, 8)
 */
function updateUpscalingConfigWrapper(scale) {
    upscalingConfig.scale = scale;
    upscalingConfig.label = `x${scale}`;
    console.log(`Upscaling configuration updated: ${upscalingConfig.label}`);
}

// Add upscaling configuration update to window so it can be called from HTML
window.updateUpscalingConfig = updateUpscalingConfigWrapper;

// Export upscaling configuration for other modules
export { upscalingConfig };

/**
 * Manages the loading state of the Call GeoPixel button
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoadingState(isLoading) {
    const button = document.getElementById('screenMap');
    const cadenzaRadio = document.getElementById('cdzbtn');
    const originalText = 'Call GeoPixel';
    
    if (isLoading) {
        // Disable button and show loading state
        button.disabled = true;
        button.classList.add('loading-button');
        button.classList.remove('enabled-button-start')
        button.innerHTML = '<span class="loading-spinner"></span>Processing...';
        button.setAttribute('data-original-text', originalText);
        
        // Disable Cadenza radio button during processing
        if (cadenzaRadio) {
            cadenzaRadio.disabled = true;
            cadenzaRadio.setAttribute('data-was-disabled-by-processing', 'true');
        }
    } else {
        // Re-enable button and restore original state
        button.disabled = false;
        const savedText = button.getAttribute('data-original-text') || originalText;
        button.removeAttribute('data-original-text');
        button.classList.add('enabled-button-start')
        button.classList.remove('loading-button');
        button.innerHTML = savedText;
        
        // Re-enable Cadenza radio button after processing
        if (cadenzaRadio && cadenzaRadio.getAttribute('data-was-disabled-by-processing')) {
            cadenzaRadio.disabled = false;
            cadenzaRadio.removeAttribute('data-was-disabled-by-processing');
        }
    }
}


/**
 * Handle successful image capture and process it
 */
function handleSuccessfulCapture(blob, mapBounds, setButtonLoadingState) {
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
    console.log(`Processing image with ${tileConfig.label} and upscaling ${upscalingConfig.label}`);
    processTiledImage(blob, selection, mapBounds, object, tileConfig, setButtonLoadingState, upscalingConfig);
}

document.getElementById('screenMap').addEventListener('click', async (event) => {
    // Check if the button is already in loading state
    if (event.target.classList.contains('loading')) {
        event.preventDefault();
        return;
    }
    
    // Disable button and show loading state
    setButtonLoadingState(true);
    
    let mbs = map.getView().calculateExtent()

    console.log("Map bounds (extent): [minX, minY, maxX, maxY] = ", mbs)
    // As NW and SE
    var mapBounds = [[mbs[0], mbs[3]], [mbs[2], mbs[1]]]
    // Store current visibility of all layers
    const layerVisibility = [];
    
    // Hide only vector/overlay layers, preserve visible base layer for capture
    const layers = map.getLayers().getArray();
    layers.forEach((layer, index) => {
        layerVisibility[index] = layer.getVisible();
        
        // Check if this is a vector layer (contains geometries that should be hidden during capture)
        const layerName = layer.get('name');
        const isVectorLayer = layerName && (
            layer.getSource().constructor.name.includes('Vector')
        );
        
        // Hide vector layers but keep base layers (satellite, OSM, etc.) as they are
        if (isVectorLayer) {
            layer.setVisible(false);
        }
        // Base layers keep their current visibility state - no change
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

        // Convert canvas to blob
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

            handleSuccessfulCapture(blob, mapBounds, setButtonLoadingState);
            
        }, 'image/png');
        
        // Restore original layer visibility after capture
        setTimeout(() => {
            layers.forEach((layer, index) => {
                layer.setVisible(layerVisibility[index]);
            });
            map.renderSync();
        }, 100);
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
            
            // Update the layer stats table based on current view
            if (window.updateStatsTableForView) {
                const isOpenLayersMode = value === 1 && this.checked;
                const isCadenzaMode = value === 2 && this.checked;
                window.updateStatsTableForView(isOpenLayersMode, isCadenzaMode);
            }
            
            // Let RunPod manager handle button state based on view + pod availability
            // No direct button manipulation here - RunPod manager will handle it
        });

        // Manually trigger the change event on the checked radio button
        // This ensures the correct element is shown based on the initial selection
        $('input[name="vis"]:checked').trigger('change');
    }, 1000); // 1 second delay to ensure Cadenza is fully initialized
});