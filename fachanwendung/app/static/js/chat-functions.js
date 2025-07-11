/**
 * Chat Query Module for GeoPixel Application
 * 
 * This module handles:
 * - Chat button functionality
 * - Chat modal window management
 * - Chat query processing
 * - Layer assignment logic for chat results
 */

// Import required modules
import { allVectorLayers } from './vector-layers.js';
import { processTiledImage, tileConfig } from './tile-processing.js';
import { upscalingConfig } from './funcs.js';

// Global variables
let chatWindowOpen = false;
let chatOriginalCallGeoPixelState = false;

/**
 * Initialize chat functionality
 */
export function initializeChatFunctions() {
    console.log('Initializing chat functions...');
    
    // Get DOM elements
    const chatButton = document.getElementById('chatBttn');
    const chatModal = document.getElementById('chat-query-modal');
    const chatInput = document.getElementById('chatInput');
    const chatCancelBtn = document.getElementById('chat-cancel-btn');
    const chatCallGeoPixelBtn = document.getElementById('chat-call-geopixel-btn');
    const chatCloseBtn = document.getElementById('chat-modal-close');
    const mainCallGeoPixelBtn = document.getElementById('screenMap');
    
    if (!chatButton || !chatModal || !chatInput || !chatCancelBtn || !chatCallGeoPixelBtn || !mainCallGeoPixelBtn) {
        console.error('Chat elements not found in DOM');
        return;
    }
    
    // Add event listeners
    chatButton.addEventListener('click', openChatWindow);
    chatCancelBtn.addEventListener('click', closeChatWindow);
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', closeChatWindow);
    }
    chatInput.addEventListener('keypress', handleEnterKey);
    chatCallGeoPixelBtn.addEventListener('click', handleChatCallGeoPixel);
    
    // Sync chat button state with main button
    const observer = new MutationObserver(syncChatButtonState);
    observer.observe(mainCallGeoPixelBtn, { 
        attributes: true, 
        attributeFilter: ['disabled', 'class'] 
    });
    
    // Close modal when clicking outside
    chatModal.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            closeChatWindow();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindowOpen) {
            closeChatWindow();
        }
    });
    
    console.log('Chat functions initialized successfully');
}

/**
 * Open the chat window
 */
function openChatWindow() {
    console.log('Opening chat window...');
    
    const chatModal = document.getElementById('chat-query-modal');
    const chatInput = document.getElementById('chatInput');
    
    if (chatModal && chatInput) {
        // Clear previous input
        chatInput.value = '';
        
        // Show modal
        chatModal.style.display = 'block';
        chatWindowOpen = true;
        
        // Focus on input
        setTimeout(() => {
            chatInput.focus();
        }, 100);
        
        // Sync button state
        syncChatButtonState();
        
        console.log('Chat window opened');
    }
}

/**
 * Close the chat window
 */
function closeChatWindow() {
    console.log('Closing chat window...');
    
    const chatModal = document.getElementById('chat-query-modal');
    const chatInput = document.getElementById('chatInput');
    
    if (chatModal && chatInput) {
        // Hide modal
        chatModal.style.display = 'none';
        chatWindowOpen = false;
        
        // Clear input
        chatInput.value = '';
        
        console.log('Chat window closed');
    }
}

/**
 * Handle Enter key press in chat input
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleChatCallGeoPixel();
    }
}

/**
 * Sync chat CallGeoPixel button state with main button
 */
function syncChatButtonState() {
    const mainCallGeoPixelBtn = document.getElementById('screenMap');
    const chatCallGeoPixelBtn = document.getElementById('chat-call-geopixel-btn');
    
    if (mainCallGeoPixelBtn && chatCallGeoPixelBtn) {
        // Copy disabled state
        chatCallGeoPixelBtn.disabled = mainCallGeoPixelBtn.disabled;
        
        // Copy classes
        chatCallGeoPixelBtn.className = mainCallGeoPixelBtn.className;
        
        // If main button is in loading state, reflect in chat button
        if (mainCallGeoPixelBtn.innerHTML.includes('Processing')) {
            chatCallGeoPixelBtn.innerHTML = 'Processing...';
        } else {
            chatCallGeoPixelBtn.innerHTML = 'Call GeoPixel';
        }
    }
}

/**
 * Handle chat CallGeoPixel button click
 */
async function handleChatCallGeoPixel() {
    console.log('Chat CallGeoPixel clicked');
    
    const chatInput = document.getElementById('chatInput');
    const chatCallGeoPixelBtn = document.getElementById('chat-call-geopixel-btn');
    
    if (!chatInput || !chatCallGeoPixelBtn) {
        console.error('Chat elements not found');
        return;
    }
    
    // Get and validate input
    const userQuery = chatInput.value.trim();
    if (!userQuery) {
        alert('Please enter a query before calling GeoPixel');
        chatInput.focus();
        return;
    }
    
    console.log('Processing chat query:', userQuery);
    
    // Close chat window
    closeChatWindow();
    
    // Set loading state for main button
    setButtonLoadingState(true);
    
    try {
        // Check which source is active (OpenLayers or Cadenza)
        const cadenzaRadio = document.getElementById('cdzbtn');
        const isUsingCadenza = cadenzaRadio && cadenzaRadio.checked;
        
        if (isUsingCadenza) {
            // Handle Cadenza source
            await handleCadenzaChatCapture(userQuery);
        } else {
            // Handle OpenLayers source
            await handleOpenLayersChatCapture(userQuery);
        }
    } catch (error) {
        console.error('Error in chat query processing:', error);
        alert('Error processing chat query: ' + error.message);
        setButtonLoadingState(false);
    }
}

/**
 * Handle screenshot and extent capture for Cadenza source with chat query
 */
async function handleCadenzaChatCapture(userQuery) {
    console.log('Using Cadenza source for chat query screenshot and extent...');
    
    try {
        // Check if Cadenza client is available
        if (!window.cadenzaClient) {
            throw new Error('Cadenza client is not initialized');
        }
        
        // Get the current extent from the shared variable
        let currentExtent = null;
        if (window.currentExtent) {
            if (window.currentExtent.extent) {
                currentExtent = window.currentExtent.extent;
                console.log('Using actual OpenLayers extent for Cadenza chat capture:', currentExtent);
            } else if (window.currentExtent.center) {
                const center = window.currentExtent.center;
                const zoom = window.currentExtent.zoom || 15;
                
                const resolution = 156543.03392804097 / Math.pow(2, zoom);
                const halfWidth = resolution * 1024 / 2;
                const halfHeight = resolution * 1024 / 2;
                
                currentExtent = [
                    center[0] - halfWidth,
                    center[1] - halfHeight,
                    center[0] + halfWidth,
                    center[1] + halfHeight
                ];
                
                console.log('Using calculated extent for Cadenza chat capture:', currentExtent);
            }
        }
        
        // Set extent before screenshot
        if (currentExtent) {
            try {
                await window.cadenzaClient.showMap('satellitenkarte', {
                    useMapSrs: true,
                    extentStrategy: {
                        type: 'static',
                        extent: currentExtent
                    }
                });
                console.log("Set extent before chat screenshot to:", currentExtent);
            } catch (extentError) {
                console.warn("Could not set extent before chat screenshot:", extentError);
            }
        }
        
        // Small delay to ensure extent is applied
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get screenshot from Cadenza
        console.log("Getting Cadenza screenshot data for chat query...");
        const imgBlob = await window.cadenzaClient.getData('png');
        
        if (!imgBlob || !(imgBlob instanceof Blob)) {
            throw new Error('Failed to get valid image data from Cadenza');
        }
        
        console.log('Cadenza screenshot retrieved for chat query:', imgBlob);
        
        // Convert extent to mapBounds format
        const mapBounds = [[currentExtent[0], currentExtent[3]], [currentExtent[2], currentExtent[1]]];
        
        // Process the captured image with chat query
        await handleSuccessfulChatCapture(imgBlob, mapBounds, userQuery);
        
    } catch (error) {
        console.error('Error capturing from Cadenza for chat query:', error);
        alert('Error capturing from Cadenza for chat query: ' + error.message);
        setButtonLoadingState(false);
    }
}

/**
 * Handle screenshot and extent capture for OpenLayers source with chat query
 */
async function handleOpenLayersChatCapture(userQuery) {
    console.log('Using OpenLayers source for chat query screenshot and extent...');
    
    try {
        let mbs = window.map.getView().calculateExtent();
        var mapBounds = [[mbs[0], mbs[3]], [mbs[2], mbs[1]]];
        
        // Store current visibility of all layers
        const layerVisibility = [];
        const layers = window.map.getLayers().getArray();
        let activeBaseLayer = null;
        
        // Find the currently visible/active base layer
        layers.forEach((layer) => {
            const layerName = layer.get('name');
            const isBaseLayer = layerName && (
                layerName.includes('Google') ||
                layerName.includes('201') ||
                layerName.includes('202') ||
                layerName.includes('OSM') ||
                layerName.includes('Satellite') ||
                layerName.includes('Street') ||
                layerName.includes('Terrain')
            );
            
            if (isBaseLayer && layer.getVisible()) {
                activeBaseLayer = layer;
            }
        });
        
        // Hide all layers except the active base layer
        layers.forEach((layer, index) => {
            layerVisibility[index] = layer.getVisible();
            
            if (layer === activeBaseLayer) {
                layer.setVisible(true);
            } else {
                layer.setVisible(false);
            }
        });
        
        console.log(`Capturing with only active base layer for chat query: ${activeBaseLayer ? activeBaseLayer.get('name') : 'none'}`);
        
        // Force map re-render without vector layers
        window.map.renderSync();
        
        window.map.once('rendercomplete', function () {
            const mapCanvas = document.createElement('canvas');
            const size = window.map.getSize();
            mapCanvas.width = size[0];
            mapCanvas.height = size[1];
            const mapContext = mapCanvas.getContext('2d');
            
            Array.prototype.forEach.call(
                window.map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'),
                function (canvas) {
                    if (canvas.width > 0) {
                        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
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
                        
                        CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
                        
                        const backgroundColor = canvas.parentNode.style.backgroundColor;
                        if (backgroundColor) {
                            mapContext.fillStyle = backgroundColor;
                            mapContext.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        
                        mapContext.drawImage(canvas, 0, 0);
                    }
                }
            );
            
            mapContext.globalAlpha = 1;
            mapContext.setTransform(1, 0, 0, 1, 0, 0);
            
            // Convert canvas to blob
            mapCanvas.toBlob(function (blob) {
                console.log("Canvas converted to blob for chat query:", blob);
                
                if (!blob) {
                    console.error("Failed to create blob from canvas for chat query");
                    alert("Failed to capture map image for chat query");
                    setButtonLoadingState(false);
                    return;
                }
                
                handleSuccessfulChatCapture(blob, mapBounds, userQuery);
                
            }, 'image/png');
            
            // Restore original layer visibility after capture
            setTimeout(() => {
                layers.forEach((layer, index) => {
                    layer.setVisible(layerVisibility[index]);
                });
                window.map.renderSync();
            }, 100);
        });
        
        window.map.renderSync();
        
    } catch (error) {
        console.error('Error capturing from OpenLayers for chat query:', error);
        alert('Error capturing from OpenLayers for chat query: ' + error.message);
        setButtonLoadingState(false);
    }
}

/**
 * Handle successful image capture and process it with chat query
 */
async function handleSuccessfulChatCapture(blob, mapBounds, userQuery) {
    console.log('Processing chat query:', userQuery);
    
    // Create selection JSON from user query
    const selection = JSON.stringify(userQuery.toLowerCase());
    
    console.log("Chat selection:", selection);
    
    // Process image in tiles using selected configuration
    console.log(`Processing chat query with ${tileConfig.label} and upscaling ${upscalingConfig.label}`);
    
    // Mark this as a chat query for special processing
    const chatMetadata = {
        isChat: true,
        originalQuery: userQuery,
        needsLayerAssignment: true
    };
    
    // Use the existing tile processing but with chat metadata
    await processTiledImageWithChatQuery(blob, selection, mapBounds, userQuery, tileConfig, setButtonLoadingState, upscalingConfig, chatMetadata);
}

/**
 * Process tiled image with chat query - sends additional chat parameters to backend
 */
async function processTiledImageWithChatQuery(blob, selection, mapBounds, originalQuery, tileConfig, setButtonLoadingState, upscalingConfig, chatMetadata) {
    console.log('Processing tiled image with chat query...');
    
    // We need to create a modified version of tile processing that includes chat parameters
    // This will send isChat=true and originalQuery to the backend
    
    try {
        // Create tiles from the image
        const tiles = await createTilesFromImage(blob, tileConfig);
        
        // Process each tile with chat information
        const tilePromises = tiles.map(async (tile, index) => {
            const formData = new FormData();
            
            // Add the standard parameters
            formData.append('imageData', tile.blob);
            formData.append('mapExtent', JSON.stringify(mapBounds));
            formData.append('selection', selection);
            
            // Add chat-specific parameters
            formData.append('isChat', 'true');
            formData.append('originalQuery', originalQuery);
            
            // Add tile and upscaling information
            formData.append('tileInfo', JSON.stringify({
                index: index,
                tileDims: tile.dimensions,
                totalTiles: tiles.length
            }));
            
            if (upscalingConfig) {
                formData.append('upscalingConfig', JSON.stringify(upscalingConfig));
            }
            
            try {
                console.log(`Processing chat tile ${index + 1}/${tiles.length}`);
                const response = await fetch('/receive', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Handle alerts from the backend
                if (data.alert) {
                    console.warn(`Alert for tile ${index}:`, data.alert);
                }
                
                return {
                    tileIndex: index,
                    data: data
                };
            } catch (error) {
                console.error(`Error processing chat tile ${index}:`, error);
                return null;
            }
        });
        
        // Wait for all tiles to complete
        const results = await Promise.all(tilePromises);
        
        // Filter out failed tiles
        const validResults = results.filter(result => result !== null);
        
        // Check if we have any valid results
        if (validResults.length === 0) {
            alert('No valid geometries found.');
            setButtonLoadingState(false);
            return;
        }
        
        // Check if all results have alerts (meaning no geometries found)
        const allHaveAlerts = validResults.every(result => result.data.alert);
        if (allHaveAlerts) {
            alert('No valid geometries found.');
            setButtonLoadingState(false);
            return;
        }
        
        // Combine and display results with special chat handling
        await combineAndDisplayChatResults(validResults, originalQuery, tileConfig, setButtonLoadingState, chatMetadata);
        
    } catch (error) {
        console.error('Error in chat tile processing:', error);
        alert('Error processing chat query: ' + error.message);
        setButtonLoadingState(false);
    }
}

/**
 * Create tiles from image (simplified version for chat)
 */
async function createTilesFromImage(blob, tileConfig) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // For simplicity, we'll just return one tile (the full image)
            canvas.toBlob((tileBlob) => {
                if (tileBlob) {
                    resolve([{
                        blob: tileBlob,
                        dimensions: [img.height, img.width]
                    }]);
                } else {
                    reject(new Error('Failed to create tile blob'));
                }
            }, 'image/png');
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
    });
}

/**
 * Combine and display chat results with special layer assignment
 */
async function combineAndDisplayChatResults(validResults, originalQuery, tileConfig, setButtonLoadingState, chatMetadata) {
    console.log('Combining and displaying chat results...');
    
    // Get the target layer from the first result (should be consistent)
    const targetLayer = validResults[0]?.data?.targetLayer || 'misc';
    
    console.log(`Chat query results will be assigned to layer: ${targetLayer}`);
    
    // Import the existing combine function
    const { combineAndDisplayTileResults } = await import('./vector-functions.js');
    
    // Call the existing combine function with the target layer as the object type
    await combineAndDisplayTileResults(validResults, targetLayer, tileConfig, setButtonLoadingState);
}

/**
 * Manages the loading state of buttons
 */
function setButtonLoadingState(isLoading) {
    const mainButton = document.getElementById('screenMap');
    const chatButton = document.getElementById('chat-call-geopixel-btn');
    const originalText = 'Call GeoPixel';
    
    if (isLoading) {
        // Disable buttons and show loading state
        if (mainButton) {
            mainButton.disabled = true;
            mainButton.classList.add('loading-button');
            mainButton.classList.remove('enabled-button-start');
            mainButton.innerHTML = '<span class="loading-spinner"></span>Processing...';
            mainButton.setAttribute('data-original-text', originalText);
        }
        
        if (chatButton) {
            chatButton.disabled = true;
            chatButton.classList.add('loading-button');
            chatButton.classList.remove('enabled-button-start');
            chatButton.innerHTML = 'Processing...';
        }
        
        // Disable Cadenza radio button during processing
        if (window.cadenzaRadio) {
            window.cadenzaRadio.disabled = true;
            window.cadenzaRadio.setAttribute('data-was-disabled-by-processing', 'true');
        }
    } else {
        // Re-enable buttons and restore original state
        if (mainButton) {
            mainButton.disabled = false;
            const savedText = mainButton.getAttribute('data-original-text') || originalText;
            mainButton.removeAttribute('data-original-text');
            mainButton.classList.add('enabled-button-start');
            mainButton.classList.remove('loading-button');
            mainButton.innerHTML = '<span class="btn-text-full">' + savedText + '</span><span class="btn-text-short">GeoPixel</span>';
        }
        
        if (chatButton) {
            chatButton.disabled = false;
            chatButton.classList.add('enabled-button-start');
            chatButton.classList.remove('loading-button');
            chatButton.innerHTML = 'Call GeoPixel';
        }
        
        // Re-enable Cadenza radio button after processing
        if (window.cadenzaRadio && window.cadenzaRadio.getAttribute('data-was-disabled-by-processing')) {
            window.cadenzaRadio.disabled = false;
            window.cadenzaRadio.removeAttribute('data-was-disabled-by-processing');
        }
    }
}

/**
 * Determine target layer based on chat query
 * @param {string} userQuery - The user's chat query
 * @returns {Object} - Object containing layer and layerName
 */
export function determineTargetLayerFromQuery(userQuery) {
    console.log('Determining target layer for query:', userQuery);
    
    // Convert query to lowercase for comparison
    const queryLower = userQuery.toLowerCase();
    
    // Split query into words
    const words = queryLower.split(/\s+/);
    
    // Define object type mappings (similar to existing object dropdown)
    const objectMappings = {
        // Transportation
        'car': 'carLayer',
        'cars': 'carLayer',
        'vehicle': 'carLayer',
        'vehicles': 'carLayer',
        'truck': 'truckLayer',
        'trucks': 'truckLayer',
        'train': 'trainLayer',
        'trains': 'trainLayer',
        'aircraft': 'aircraftLayer',
        'airplane': 'aircraftLayer',
        'plane': 'aircraftLayer',
        'ship': 'shipLayer',
        'ships': 'shipLayer',
        'boat': 'shipLayer',
        'boats': 'shipLayer',
        
        // Infrastructure
        'building': 'buildingLayer',
        'buildings': 'buildingLayer',
        'house': 'houseLayer',
        'houses': 'houseLayer',
        'home': 'houseLayer',
        'homes': 'houseLayer',
        'factory': 'factoryLayer',
        'factories': 'factoryLayer',
        'warehouse': 'warehouseLayer',
        'warehouses': 'warehouseLayer',
        'hospital': 'hospitalLayer',
        'hospitals': 'hospitalLayer',
        'bridge': 'bridgeLayer',
        'bridges': 'bridgeLayer',
        'road': 'roadLayer',
        'roads': 'roadLayer',
        'street': 'roadLayer',
        'streets': 'roadLayer',
        'highway': 'highwayLayer',
        'highways': 'highwayLayer',
        'runway': 'runwayLayer',
        'runways': 'runwayLayer',
        'parking': 'parkingLotLayer',
        'solar': 'solarPanelLayer',
        'wind': 'windTurbineLayer',
        'turbine': 'windTurbineLayer',
        
        // Natural features
        'river': 'riverLayer',
        'rivers': 'riverLayer',
        'lake': 'lakeLayer',
        'lakes': 'lakeLayer',
        'ocean': 'oceanLayer',
        'sea': 'oceanLayer',
        'water': 'riverLayer',
        'wetland': 'wetlandLayer',
        'wetlands': 'wetlandLayer',
        'mountain': 'mountainLayer',
        'mountains': 'mountainLayer',
        'hill': 'hillLayer',
        'hills': 'hillLayer',
        'valley': 'valleyLayer',
        'valleys': 'valleyLayer',
        'canyon': 'canyonLayer',
        'canyons': 'canyonLayer',
        'beach': 'beachLayer',
        'beaches': 'beachLayer',
        'coast': 'coastlineLayer',
        'coastline': 'coastlineLayer',
        'island': 'islandLayer',
        'islands': 'islandLayer',
        
        // Vegetation
        'forest': 'forestLayer',
        'forests': 'forestLayer',
        'tree': 'treeLayer',
        'trees': 'treeLayer',
        'grass': 'grassLayer',
        'farmland': 'farmlandLayer',
        'farm': 'farmlandLayer',
        'farms': 'farmlandLayer',
        'vineyard': 'vineyardLayer',
        'vineyards': 'vineyardLayer',
        'park': 'parkLayer',
        'parks': 'parkLayer',
        'garden': 'gardenLayer',
        'gardens': 'gardenLayer',
        'pasture': 'pastureLayer',
        'pastures': 'pastureLayer',
        
        // Urban features
        'urban': 'urbanAreaLayer',
        'city': 'cityLayer',
        'cities': 'cityLayer',
        'residential': 'residentialLayer',
        'commercial': 'commercialLayer',
        'industrial': 'industrialLayer',
        'construction': 'constructionSiteLayer',
        'stadium': 'stadiumLayer',
        'stadiums': 'stadiumLayer',
        'sports': 'sportsFieldLayer',
        'golf': 'golfCourseLayer',
        'cemetery': 'cemeteryLayer',
        'cemeteries': 'cemeteryLayer',
        
        // Geological
        'rock': 'rockFormationLayer',
        'rocks': 'rockFormationLayer',
        'sand': 'sandLayer',
        'desert': 'desertLayer',
        'deserts': 'desertLayer',
        'quarry': 'quarryLayer',
        'quarries': 'quarryLayer',
        'mine': 'mineLayer',
        'mines': 'mineLayer',
        'landslide': 'landslideLayer',
        'landslides': 'landslideLayer',
        'erosion': 'erosionLayer',
        
        // Environmental
        'fire': 'fireLayer',
        'fires': 'fireLayer',
        'flood': 'floodLayer',
        'floods': 'floodLayer',
        'flooding': 'floodLayer',
        'snow': 'snowLayer',
        'ice': 'iceLayer',
        'smoke': 'smokeLayer',
        'shadow': 'shadowLayer',
        'shadows': 'shadowLayer',
        
        // Agriculture
        'greenhouse': 'greenhouseLayer',
        'greenhouses': 'greenhouseLayer',
        'barn': 'barnLayer',
        'barns': 'barnLayer',
        'silo': 'siloLayer',
        'silos': 'siloLayer',
        'livestock': 'livestockLayer',
        'cattle': 'livestockLayer',
        'animals': 'livestockLayer'
    };
    
    // Check each word in the query against the mappings
    for (const word of words) {
        if (objectMappings[word]) {
            const layerName = objectMappings[word];
            const layer = allVectorLayers[layerName];
            if (layer) {
                console.log(`Found matching layer for word "${word}": ${layerName}`);
                return { layer, layerName, objectName: word };
            }
        }
    }
    
    // If no match found, return misc layer
    console.log('No matching layer found, using misc layer');
    return { 
        layer: allVectorLayers.miscLayer, 
        layerName: 'miscLayer',
        objectName: 'misc'
    };
}

// Export functions for use in other modules
export { 
    openChatWindow, 
    closeChatWindow, 
    handleChatCallGeoPixel,
    setButtonLoadingState as setChatButtonLoadingState
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChatFunctions);

console.log('Chat functions module loaded');