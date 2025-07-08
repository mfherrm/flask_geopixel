from flask import Blueprint, render_template, request, jsonify, current_app
import os
import sys
import base64
import re
import time
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np
from flask_cors import CORS
import json
from urllib.parse import urljoin
from .call_geopixel import get_object_outlines
from io import BytesIO
import requests
# Import RunPod functionality from the dedicated module
from ..runpod import get_active_runpod_url, set_runpod_api_key, check_pod_running_with_template
# Import image processing functionality from the dedicated module
from ..image_processing import (
    image_coords_to_map_coords,
    map_coords_to_image_coords,
    create_overlay_images
)

def create_tile_mask_overlay(tile_filepath, contours, masks, is_multi_scale, tile_info, tile_bounds, tile_dims, save_folder):
    """
    Create and save mask overlay for a specific tile showing actual contours from mask data
    
    Args:
        tile_filepath: Path to the tile image file
        contours: List of contours (geographic coordinates for traditional, empty for multi-scale)
        masks: Mask data (flattened array for multi-scale, actual mask for traditional)
        is_multi_scale: Boolean indicating if this is multi-scale processing
        tile_info: Tile information including index
        tile_bounds: Geographic bounds of the tile
        tile_dims: Tile dimensions [height, width]
        save_folder: Directory to save overlay images
        
    Returns:
        str: Path to saved overlay image, or None if failed
    """
    try:
        # Load the tile image
        tile_img = cv2.imread(tile_filepath)
        if tile_img is None:
            print(f"Failed to load tile image: {tile_filepath}")
            return None
        
        print(f"Creating overlay for tile {tile_info['index']} - Multi-scale: {is_multi_scale}")
        print(f"Tile image shape: {tile_img.shape}")
        print(f"Tile bounds: {tile_bounds}")
        print(f"Tile dims: {tile_dims}")
        
        timestamp = int(time.time())
        tile_height, tile_width = tile_img.shape[:2]
        
        if is_multi_scale:
            # For multi-scale, we have raw mask data - convert it back to a 2D mask and extract contours
            print("Multi-scale mode: Processing raw mask data")
            
            if masks is not None and len(masks) > 0:
                print(f"Processing raw mask data with length: {len(masks)}")
                
                # Reshape flattened mask back to 2D using tile dimensions
                expected_pixels = tile_height * tile_width
                if len(masks) == expected_pixels:
                    # Reshape to 2D mask
                    mask_2d = np.array(masks).reshape(tile_height, tile_width)
                    print(f"Reshaped mask to {mask_2d.shape}")
                    
                    # Convert to uint8 and apply threshold
                    mask_uint8 = (mask_2d * 255).astype(np.uint8)
                    
                    # Apply threshold to create binary mask
                    threshold_value = np.max(mask_uint8) * 0.5  # 50% of max value
                    _, binary_mask = cv2.threshold(mask_uint8, threshold_value, 255, cv2.THRESH_BINARY)
                    
                    print(f"Created binary mask with {np.count_nonzero(binary_mask)} active pixels")
                    
                    # Extract contours from the binary mask
                    contours_cv, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    print(f"Found {len(contours_cv)} contours from raw mask")
                    
                    # Create overlay with mask and contours
                    overlay_img = tile_img.copy()
                    
                    # Add colored mask overlay (semi-transparent green)
                    colored_mask = np.zeros_like(tile_img)
                    colored_mask[binary_mask > 0] = (0, 255, 0)  # Green
                    alpha = 0.3
                    overlay_img = cv2.addWeighted(overlay_img, 1-alpha, colored_mask, alpha, 0)
                    
                    # Draw contours in red
                    contour_colors = [(0, 0, 255), (255, 0, 0), (0, 255, 255), (255, 255, 0)]
                    for i, contour in enumerate(contours_cv):
                        if cv2.contourArea(contour) > 10:  # Filter small contours
                            color = contour_colors[i % len(contour_colors)]
                            cv2.drawContours(overlay_img, [contour], -1, color, 2)
                    
                    # Add text overlay
                    scale_info = tile_info.get('scaleInfo', {})
                    scale_label = scale_info.get('label', 'unknown')
                    text = f"Tile {tile_info['index']} - Scale {scale_label} - {len(contours_cv)} contours"
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 0.5
                    color = (255, 255, 255)  # White
                    thickness = 1
                    
                    (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
                    x = 5
                    y = 20
                    
                    # Add background rectangle for text
                    cv2.rectangle(overlay_img, (x-2, y-text_height-2), (x+text_width+2, y+2), (0, 0, 0), -1)
                    cv2.putText(overlay_img, text, (x, y), font, font_scale, color, thickness)
                    
                    # Save multi-scale tile overlay with contours
                    filename = f'tile_{tile_info["index"]}_scale_{scale_label}_contours_{timestamp}.jpg'
                    filepath = os.path.join(save_folder, filename)
                    cv2.imwrite(filepath, overlay_img)
                    
                    print(f"✅ Saved multi-scale contour overlay: {filepath}")
                    return filepath
                else:
                    print(f"❌ Raw mask length {len(masks)} doesn't match expected pixels {expected_pixels}")
                    return None
            else:
                print("No raw mask data available for multi-scale processing")
                return None
            
        else:
            # Traditional processing: create actual mask overlay
            print("Traditional mode: Creating mask overlay")
            
            if masks is not None and hasattr(masks, 'shape'):
                print(f"Processing masks with shape: {masks.shape}")
                
                # Ensure mask matches tile dimensions
                if masks.shape[:2] != (tile_height, tile_width):
                    print(f"Resizing mask from {masks.shape} to ({tile_height}, {tile_width})")
                    masks = cv2.resize(masks.astype(np.uint8), (tile_width, tile_height), interpolation=cv2.INTER_NEAREST)
                
                # Create colored mask overlay
                overlay_img = tile_img.copy()
                colored_mask = np.zeros_like(tile_img)
                mask_color = (0, 255, 0)  # Bright green
                colored_mask[masks > 0] = mask_color
                
                # Blend with alpha
                alpha = 0.4
                overlay_img = cv2.addWeighted(tile_img, 1-alpha, colored_mask, alpha, 0)
                
                # Extract and draw contours from the mask
                contours_cv, _ = cv2.findContours(masks.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                print(f"Found {len(contours_cv)} contours from traditional mask")
                
                # Draw contours in red
                for contour in contours_cv:
                    if cv2.contourArea(contour) > 10:  # Filter small contours
                        cv2.drawContours(overlay_img, [contour], -1, (0, 0, 255), 2)
                
                # Add text overlay
                text = f"Tile {tile_info['index']} - Traditional - {len(contours_cv)} contours"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.5
                color = (255, 255, 255)  # White
                thickness = 1
                
                (text_width, text_height), _ = cv2.getTextSize(text, font, font_scale, thickness)
                x = 5
                y = 20
                
                # Add background rectangle for text
                cv2.rectangle(overlay_img, (x-2, y-text_height-2), (x+text_width+2, y+2), (0, 0, 0), -1)
                cv2.putText(overlay_img, text, (x, y), font, font_scale, color, thickness)
                
                # Save traditional tile overlay
                filename = f'tile_{tile_info["index"]}_traditional_contours_{timestamp}.jpg'
                filepath = os.path.join(save_folder, filename)
                cv2.imwrite(filepath, overlay_img)
                
                print(f"✅ Saved traditional contour overlay: {filepath}")
                return filepath
            else:
                print("No masks available for traditional processing")
                return None
                
    except Exception as e:
        print(f"Error creating tile mask overlay: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


bp = Blueprint('main', __name__)
CORS(bp, resources={r"/receive": {"origins": "*"}})

IMAGE_FOLDER = 'fachanwendung/app/static/images'  # Define a subfolder within static
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)



@bp.after_request
def add_cors_headers(response):
    cadenza_uri = current_app.config.get('CADENZA_URI', '')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://ajax.googleapis.com https://cdn.jsdelivr.net https://html2canvas.hertzen.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.google.com https://*.arcgis.com https://*.arcgisonline.com https://wayback.maptiles.arcgis.com https://*.maptiles.arcgis.com https://api.maptiler.com https://gis.sinica.edu.tw; frame-src 'self' http://localhost:8080; connect-src 'self' http://localhost:8080 http://127.0.0.1:5000 https://api.runpod.ai https://api.runpod.io https://*.proxy.runpod.net https://*.arcgis.com https://*.arcgisonline.com https://wayback.maptiles.arcgis.com https://*.maptiles.arcgis.com https://api.maptiler.com https://gis.sinica.edu.tw; frame-ancestors 'self' http://localhost:8080 http://localhost:8080/cadenza/;"
    return response

@bp.route('/')
def index():
    return render_template('index.html',
                          cadenza_uri=current_app.config.get('CADENZA_URI'),
                          config=current_app.config)

@bp.route('/overlay_images/<filename>')
def serve_overlay_image(filename):
    """Serve overlay images from the images directory"""
    from flask import send_from_directory
    return send_from_directory(IMAGE_FOLDER, filename)

@bp.route('/receive', methods=['POST', 'OPTIONS'])
def receive_image():
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    if 'mapExtent' not in request.form:
        return jsonify({'error': 'No map bounds'}), 400
    
    mapBounds = json.loads(request.form['mapExtent'])
    selection = json.loads(request.form['selection'])
    
    # Get RunPod API key from the request if provided (from frontend interface)
    if 'runpodApiKey' in request.form and request.form['runpodApiKey'].strip():
        frontend_api_key = request.form['runpodApiKey'].strip()
        set_runpod_api_key(frontend_api_key)
        print(f"Using API key from frontend interface (length: {len(frontend_api_key)})")
    
    # Check if this is a tile processing request
    tile_info = None
    if 'tileInfo' in request.form:
        tile_info = json.loads(request.form['tileInfo'])
        print(f"Processing tile {tile_info['index']} with dimensions {tile_info['tileDims']}")
    
    # Get upscaling configuration from request
    upscaling_config = None
    if 'upscalingConfig' in request.form:
        upscaling_config = json.loads(request.form['upscalingConfig'])
        if 'scaleIndex' in upscaling_config:
            # Multi-scale processing
            print(f"Multi-scale processing - Scale: {upscaling_config['label']}, Index: {upscaling_config['scaleIndex']}/{upscaling_config.get('totalScales', 'unknown')}")
        else:
            # Traditional single-scale processing
            print(f"Traditional upscaling configuration: {upscaling_config['label']}")
    else:
        # Default to x1 (no upscaling)
        upscaling_config = {'scale': 1, 'label': 'x1'}
    
    # Check if imageData is in the request
    img = None
    try:
        # Get the base64 string from the data URL
        image_data = request.files['imageData']
        image = Image.open(image_data.stream)
        
        # Convert to OpenCV format
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Save the image for debugging (optional)
        if tile_info:
            filename = f'tile_{tile_info["index"]}.jpg'
        else:
            filename = 'satellite_image.jpg'
        filepath = os.path.join(IMAGE_FOLDER, filename)
        cv2.imwrite(filepath, img)
        print(f"Saved captured image to {filepath}")
    except Exception as e:
        print(f"Error processing image data: {str(e)}")
        raise

    query = f"Please give me segmentation masks for {selection}."
    imageDims = img.shape[:2]
      
    try:
        # masks = get_geopixel_result(["--version=MBZUAI/GeoPixel-7B-RES"], [selection])
        # outline = np.array([[[[[446, 219]], [[445, 220]], [[443, 220]], [[439, 224]], [[439, 227]], [[438, 228]], [[438, 231]], [[437, 232]], [[437, 247]], [[436, 248]], [[437, 249]], [[437, 262]], [[436, 263]], [[436, 273]], [[435, 274]], [[435, 293]], [[434, 294]], [[434, 312]], [[435, 313]], [[435, 315]], [[438, 318]], [[448, 318]], [[449, 319]], [[465, 319]], [[466, 318]], [[467, 318]], [[469, 316]], [[469, 313]], [[468, 312]], [[468, 304]], [[469, 303]], [[469, 299]], [[468, 298]], [[468, 297]], [[469, 296]], [[469, 286]], [[470, 285]], [[470, 268]], [[471, 267]], [[471, 265]], [[470, 264]], [[471, 263]], [[471, 254]], [[472, 253]], [[472, 250]], [[473, 249]], [[473, 233]], [[472, 232]], [[472, 230]], [[471, 229]], [[471, 226]], [[470, 226]], [[469, 225]], [[468, 225]], [[467, 224]], [[465, 224]], [[461, 220]], [[460, 220]], [[459, 219]]]]])
        # outline = cv2.findContours(masks.astype(np.uint8).squeeze(),cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
        # Use the correct filename for tile processing - use absolute path to avoid path resolution issues
        if tile_info:
            image_filepath = os.path.join(IMAGE_FOLDER, f'tile_{tile_info["index"]}.jpg')
        else:
            image_filepath = os.path.join(IMAGE_FOLDER, 'satellite_image.jpg')
            
        # Try to get the API URL dynamically from running RunPod instance
        api_url = get_active_runpod_url()
        print(api_url)
        
        # Fallback to configuration, environment variable, or hardcoded default
        if not api_url:
            api_url = (current_app.config.get('GEOPIXEL_API_URL') or
                      os.environ.get('GEOPIXEL_API_URL', "https://0tjxinf025d4jr-5000.proxy.runpod.net/"))
            print(f"No active RunPod found, using fallback URL: {api_url}")
        else:
            print(f"Using dynamic RunPod API URL: {api_url}")
        
        response = get_object_outlines(api_url, image_filepath, query, upscaling_config)
        
        # Handle the case when get_object_outlines returns None
        if response is None:
            error_msg = 'Failed to process image - API processing failed. Please check if the RunPod instance is running and the GeoPixel API is accessible.'
            if tile_info:
                error_msg = f"Tile {tile_info['index']}: {error_msg}"
            return jsonify({'error': error_msg}), 500
            
        # Unpack the response tuple
        result, contours, masks = response
        
        # Additional validation
        if result is None:
            return jsonify({'error': 'No valid result received from API'}), 500
        print(f"Masks shape: {masks.shape if hasattr(masks, 'shape') else f'Length: {len(masks) if masks is not None else 0}'}")
        print(f"Number of contours: {len(contours) if contours else 0}")
        print(f"Image dimensions: {imageDims}")
        print(f"Map bounds: {mapBounds}")
        
        # Check if this is multi-scale processing (raw mask data)
        is_multi_scale_data = (upscaling_config and
                              upscaling_config.get('scaleIndex') is not None and
                              isinstance(masks, np.ndarray) and
                              len(masks.shape) == 1)  # Flattened array
        
        if is_multi_scale_data:
            # For multi-scale processing, store raw mask data
            tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
            print(f"{tile_prefix}Multi-scale processing: storing raw mask data (length: {len(masks)})")
            
            # No overlays for individual scales in multi-scale mode
            serializable_contours = []  # No contours yet, will be generated after combination
            overlay_paths = {}  # No overlays for individual scales
        else:
            # Traditional processing: simplify contours and create overlays
            simplified_contours = []
            if contours:
                tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
                print(f"{tile_prefix}Simplifying contours...")
                for i, contour in enumerate(contours):
                    try:
                        # Convert list contours from backend to numpy arrays for OpenCV
                        if isinstance(contour, list):
                            print(f"✓ Converting contour {i} from list to numpy array ({len(contour)} points)")
                            # Convert list of [x, y] points to OpenCV format (N, 1, 2)
                            contour_np = np.array(contour, dtype=np.int32).reshape(-1, 1, 2)
                        elif isinstance(contour, np.ndarray):
                            contour_np = contour
                            print(f"✓ Contour {i} already numpy array with shape {contour.shape}")
                        else:
                            print(f"❌ Views.py contour {i} unknown type: {type(contour)}")
                            continue
                        
                        # Check contour shape
                        if len(contour_np.shape) != 3 or contour_np.shape[2] != 2:
                            print(f"⚠️ Views.py contour {i} has invalid shape: {contour_np.shape}")
                            continue
                        
                        # Ensure contour has enough points
                        if len(contour_np) < 3:
                            print(f"⚠️ Views.py contour {i} has only {len(contour_np)} points, skipping")
                            continue
                        
                        # Safely calculate perimeter
                        perimeter = cv2.arcLength(contour_np, True)
                        if perimeter > 0:
                            # Simplify contour using Douglas-Peucker algorithm (conservative simplification)
                            epsilon = 0.001 * perimeter  # 0.1% of perimeter for ~20% point reduction
                            simplified_contour = cv2.approxPolyDP(contour_np, epsilon, True)
                            simplified_contours.append(simplified_contour)
                            print(f"{tile_prefix}Contour {i}: {len(contour_np)} -> {len(simplified_contour)} points (simplified)")
                        else:
                            # Use original contour if perimeter is 0
                            simplified_contours.append(contour_np)
                            print(f"{tile_prefix}Contour {i}: {len(contour_np)} points (no simplification - zero perimeter)")
                            
                    except Exception as e:
                        print(f"❌ Error processing contour {i} in views.py: {str(e)}")
                        # Try to add original contour as fallback
                        try:
                            if isinstance(contour, list):
                                fallback_contour = np.array(contour, dtype=np.int32).reshape(-1, 1, 2)
                                simplified_contours.append(fallback_contour)
                            else:
                                simplified_contours.append(contour)
                        except:
                            print(f"❌ Failed to add fallback contour {i}")
                        continue
            
            # Create overlay images using simplified contours (only for non-tile processing)
            overlay_paths = {}
            if not tile_info:
                overlay_paths = create_overlay_images(img, simplified_contours, masks, IMAGE_FOLDER, mapBounds, imageDims)
            else:
                print(f"Skipping overlay creation for tile {tile_info['index']}")
            
            # Transform simplified contours to geographic coordinates for frontend display
            # This ensures the map geometries match the overlay images
            serializable_contours = []
            if simplified_contours and mapBounds and imageDims:
                tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
                print(f"{tile_prefix}Transforming simplified contours to geographic coordinates for frontend display...")
                for i, simplified_contour in enumerate(simplified_contours):
                    # Extract simplified contour points
                    contour_points = [[point[0][0], point[0][1]] for point in simplified_contour]
                    
                    # Transform to geographic coordinates using the same logic as the overlay creation
                    geo_coords = image_coords_to_map_coords(mapBounds, contour_points, imageDims)
                    
                    # Convert to the format expected by the frontend
                    serializable_contours.append(geo_coords)
                    
                    print(f"{tile_prefix}Simplified contour {i}: {len(simplified_contour)} points -> {len(geo_coords)} geo points")
            elif simplified_contours:
                # Fallback to original pixel coordinates if no geographic data
                tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
                print(f"{tile_prefix}Using simplified contours with pixel coordinates (no geographic transformation)")
                for i, simplified_contour in enumerate(simplified_contours):
                    serializable_contours.append(simplified_contour.tolist())
                    print(f"{tile_prefix}Simplified contour {i}: {len(simplified_contour)} points")
        
        tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
        print(f"{tile_prefix}Processed {len(serializable_contours)} simplified contours for JSON")
        
        # Convert file paths to URLs
        overlay_urls = {}
        for key, path in overlay_paths.items():
            if key != 'error' and path:
                filename = os.path.basename(path)
                overlay_urls[key] = urljoin(request.url_root, f'overlay_images/{filename}')
        
        # Special handling for tile0: create mask overlay before cleanup
        if tile_info and tile_info['index'] == 0:
            tile_filepath = os.path.join(IMAGE_FOLDER, f'tile_{tile_info["index"]}.jpg')
            
            if os.path.exists(tile_filepath):
                print(f"Creating mask overlay for tile0...")
                try:
                    # Create mask overlay for tile0
                    overlay_result = create_tile_mask_overlay(
                        tile_filepath,
                        serializable_contours,
                        masks,  # Pass actual mask data for both multi-scale and traditional
                        is_multi_scale_data,
                        tile_info,
                        mapBounds,  # Use mapBounds for tile bounds
                        imageDims,  # Use imageDims for tile dimensions
                        IMAGE_FOLDER
                    )
                    
                    if overlay_result:
                        print(f"✅ Successfully created tile0 mask overlay: {overlay_result}")
                    else:
                        print(f"⚠️ Failed to create tile0 mask overlay")
                        
                except Exception as overlay_error:
                    print(f"Error creating tile0 mask overlay: {str(overlay_error)}")
        
        # Delete tile file from hard storage after processing (cleanup)
        if tile_info:
            tile_filepath = os.path.join(IMAGE_FOLDER, f'tile_{tile_info["index"]}.jpg')
            try:
                if os.path.exists(tile_filepath):
                    os.remove(tile_filepath)
                    print(f"Deleted tile file: {tile_filepath}")
            except Exception as delete_error:
                print(f"Warning: Failed to delete tile file {tile_filepath}: {str(delete_error)}")
        
        # Build response with raw mask data if available
        response_data = {
            'message': 'Successfully retrieved outline',
            'outline': serializable_contours,
            'imageDims': list(imageDims),
            'overlay_images': overlay_urls,
            'coordinates_transformed': bool(mapBounds and imageDims)
        }
        
        # Add raw mask data for multi-scale processing
        if is_multi_scale_data and isinstance(masks, np.ndarray):
            response_data['rawMask'] = masks.tolist()
            tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
            print(f"{tile_prefix}Added raw mask data to response (length: {len(masks)})")
        
        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint for RunPod availability testing"""
    return jsonify({
        'status': 'healthy',
        'service': 'GeoPixel Flask Backend',
        'timestamp': str(os.path.getmtime(__file__) if os.path.exists(__file__) else 'unknown')
    }), 200
