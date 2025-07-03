import './cadenza.js';
import {
    retryWithBackoff,
    isRecoverableNetworkError,
    showNetworkErrorMessage,
    networkMonitor
} from './network-utils.js';

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
    const openLayersRadio = document.getElementById('olbtn');
    const originalText = 'Call GeoPixel';
    
    if (isLoading) {
        // Disable button and show loading state
        button.disabled = true;
        button.classList.add('loading-button');
        button.classList.remove('enabled-button-start')
        button.innerHTML = '<span class="loading-spinner"></span>Processing...';
        button.setAttribute('data-original-text', originalText);
        
        // Disable both radio buttons during processing to prevent view switching
        if (cadenzaRadio) {
            cadenzaRadio.disabled = true;
            cadenzaRadio.setAttribute('data-was-disabled-by-processing', 'true');
        }
        if (openLayersRadio) {
            openLayersRadio.disabled = true;
            openLayersRadio.setAttribute('data-was-disabled-by-processing', 'true');
        }
    } else {
        // Re-enable button and restore original state
        button.disabled = false;
        const savedText = button.getAttribute('data-original-text') || originalText;
        button.removeAttribute('data-original-text');
        button.classList.add('enabled-button-start')
        button.classList.remove('loading-button');
        button.innerHTML = savedText;
        
        // Re-enable both radio buttons after processing
        if (cadenzaRadio && cadenzaRadio.getAttribute('data-was-disabled-by-processing')) {
            cadenzaRadio.disabled = false;
            cadenzaRadio.removeAttribute('data-was-disabled-by-processing');
        }
        if (openLayersRadio && openLayersRadio.getAttribute('data-was-disabled-by-processing')) {
            openLayersRadio.disabled = false;
            openLayersRadio.removeAttribute('data-was-disabled-by-processing');
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
    
    // Check which source is active (OpenLayers or Cadenza)
    const cadenzaRadio = document.getElementById('cdzbtn');
    const isUsingCadenza = cadenzaRadio && cadenzaRadio.checked;
    
    if (isUsingCadenza) {
        // Handle Cadenza source
        await handleCadenzaCapture();
    } else {
        // Handle OpenLayers source (existing functionality)
        await handleOpenLayersCapture();
    }
});

/**
 * Handle screenshot and extent capture for Cadenza source
 */
async function handleCadenzaCapture() {
    try {
        console.log('Using Cadenza source for screenshot and extent...');
        
        // Check if Cadenza client is available
        if (!window.cadenzaClient) {
            throw new Error('Cadenza client is not initialized');
        }
        
        // Store the current extent before taking screenshot
        let currentExtent = window.cadenzaCurrentExtent;
        
        // Check if extent is valid (not empty array and has valid coordinates)
        if (!currentExtent || !Array.isArray(currentExtent) || currentExtent.length !== 4 ||
            currentExtent.some(coord => coord === undefined || coord === null || isNaN(coord))) {
            console.warn('Invalid or missing Cadenza extent, using default extent');
            // Use a default extent that covers a reasonable area (example: Germany)
            currentExtent = [5.866, 47.270, 15.042, 55.058]; // [minX, minY, maxX, maxY] for Germany
        }
        
        console.log("Current extent before screenshot:", currentExtent);
        
        // Add a small delay to ensure Cadenza is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get screenshot from Cadenza using getData('png') without changing the extent
        console.log("Getting Cadenza screenshot data...");
        let imgBlob;
        
        try {
            // Check network status before attempting screenshot
            if (!networkMonitor.getStatus()) {
                throw new Error('Network is offline. Please check your internet connection.');
            }

            // Use retry with backoff for screenshot capture
            imgBlob = await retryWithBackoff(async () => {
                return await window.cadenzaClient.getData('png');
            }, 3, 2000, 10000);
            
            console.log('Cadenza screenshot captured successfully');
        } catch (cadenzaError) {
            console.error('Cadenza getData error:', cadenzaError);
            
            // Use network utilities to determine error type and show appropriate message
            if (isRecoverableNetworkError(cadenzaError)) {
                showNetworkErrorMessage(cadenzaError, 'screenshot capture');
                throw new Error('Network error: Unable to capture screenshot. Please try again.');
            } else if (cadenzaError.message && cadenzaError.message.includes('expected type')) {
                throw new Error('Cadenza is not ready for screenshot capture. Please wait a moment and try again.');
            } else {
                throw new Error('Failed to capture screenshot from Cadenza: ' + cadenzaError.message);
            }
        }
        
        if (!imgBlob || !(imgBlob instanceof Blob)) {
            throw new Error('Failed to get valid image data from Cadenza');
        }
        
        console.log('Cadenza screenshot retrieved:', imgBlob);
        
        // Convert extent to mapBounds format [[NW], [SE]]
        const mapBounds = [[currentExtent[0], currentExtent[3]], [currentExtent[2], currentExtent[1]]];
        
        console.log("Cadenza map bounds (extent): [minX, minY, maxX, maxY] = ", currentExtent);
        console.log("Map bounds as NW/SE:", mapBounds);
        
        // Process the captured image
        handleSuccessfulCapture(imgBlob, mapBounds, setButtonLoadingState);
        
    } catch (error) {
        console.error('Error capturing from Cadenza:', error);
        alert('Error capturing from Cadenza: ' + error.message);
        setButtonLoadingState(false);
    }
}

/**
 * Handle screenshot and extent capture for OpenLayers source (existing functionality)
 */
async function handleOpenLayersCapture() {
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
}


// Wait for Cadenza to initialize before setting up the toggle functionality
$(document).ready(function () {
    // Delay the setup of radio button functionality to ensure Cadenza is loaded
    setTimeout(function () {
        $('input[name="vis"]').on('change', function () {
            console.log("toggled visibility");
            const value = +this.value;
            const isOpenLayersMode = value === 1 && this.checked;
            const isCadenzaMode = value === 2 && this.checked;

            // Handle extent synchronization when switching views
            if (isOpenLayersMode) {
                // Switching to OpenLayers - sync extent from Cadenza to OL
                syncExtentFromCadenzaToOL();
                $('#OL-map').show();
                $('#cadenza-iframe').hide();
            } else if (isCadenzaMode) {
                // Switching to Cadenza - show iframe first, then sync extent
                $('#OL-map').hide();
                $('#cadenza-iframe').show();
                // Wait a bit for iframe to become visible before syncing extent
                setTimeout(() => {
                    syncExtentFromOLToCadenza();
                }, 100);
            }
            
            // Update the layer stats table based on current view
            if (window.updateStatsTableForView) {
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

/**
 * Sync extent from Cadenza to OpenLayers when switching to OL view
 */
function syncExtentFromCadenzaToOL() {
    try {
        console.log('Syncing extent from Cadenza to OpenLayers...');
        
        // Get current Cadenza extent
        let cadenzaExtent = window.cadenzaCurrentExtent;
        
        // Check if we have a valid Cadenza extent
        if (!cadenzaExtent || !Array.isArray(cadenzaExtent) || cadenzaExtent.length !== 4 ||
            cadenzaExtent.some(coord => coord === undefined || coord === null || isNaN(coord))) {
            console.log('No valid Cadenza extent available, keeping current OL extent');
            return;
        }
        
        // Just store the Cadenza extent for reference, don't change the OpenLayers view
        console.log('Cadenza extent available for reference:', cadenzaExtent);
        
    } catch (error) {
        console.error('Error syncing extent from Cadenza to OpenLayers:', error);
    }
}

/**
 * Sync extent from OpenLayers to Cadenza when switching to Cadenza view
 */
function syncExtentFromOLToCadenza() {
    try {
        console.log('Syncing extent from OpenLayers to Cadenza...');
        
        // Get current OpenLayers extent
        if (!window.map || !window.map.getView()) {
            console.log('OpenLayers map not available');
            return;
        }
        
        const olExtent = window.map.getView().calculateExtent();
        console.log('OpenLayers extent:', olExtent);
        
        // Check if Cadenza client and iframe are available and visible
        if (!window.cadenzaClient) {
            console.log('Cadenza client not available');
            return;
        }
        
        // Check if iframe is visible before attempting to sync
        const cadenzaIframe = document.getElementById('cadenza-iframe');
        if (!cadenzaIframe || cadenzaIframe.style.display === 'none') {
            console.log('Cadenza iframe not visible, skipping extent sync');
            return;
        }
        
        // Check iframe dimensions
        const rect = cadenzaIframe.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            console.log('Cadenza iframe not properly sized, skipping extent sync');
            return;
        }
        
        // Set the Cadenza map extent
        window.cadenzaClient.showMap('satellitenkarte', {
            useMapSrs: true,
            extentStrategy: {
                type: 'static',
                extent: olExtent
            }
        }).then(() => {
            console.log('Successfully set Cadenza extent to:', olExtent);
            // Update the stored Cadenza extent
            window.cadenzaCurrentExtent = olExtent;
        }).catch((error) => {
            console.error('Error setting Cadenza extent:', error);
            // If it's an iframe visibility error, we can ignore it as the user will see the default view
            if (error.message && error.message.includes('Iframe must be visible')) {
                console.log('Iframe visibility error - this is expected during view switching');
            }
        });
        
    } catch (error) {
        console.error('Error syncing extent from OpenLayers to Cadenza:', error);
    }
}
