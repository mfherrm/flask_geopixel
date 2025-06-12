from flask import Blueprint, render_template, request, jsonify, current_app
import os
import sys
import base64
import re
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


bp = Blueprint('main', __name__)
CORS(bp, resources={r"/receive": {"origins": "*"}})

IMAGE_FOLDER = 'fachanwendung/app/static/images'  # Define a subfolder within static
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)



@bp.after_request
def add_cors_headers(response):
    cadenza_uri = current_app.config.get('CADENZA_URI', '')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://ajax.googleapis.com https://cdn.jsdelivr.net https://html2canvas.hertzen.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.google.com https://*.arcgis.com https://*.arcgisonline.com https://wayback.maptiles.arcgis.com https://*.maptiles.arcgis.com; frame-src 'self' http://localhost:8080; connect-src 'self' http://localhost:8080 http://127.0.0.1:5000 https://api.runpod.ai https://api.runpod.io https://*.proxy.runpod.net https://*.arcgis.com https://*.arcgisonline.com https://wayback.maptiles.arcgis.com https://*.maptiles.arcgis.com; frame-ancestors 'self' http://localhost:8080 http://localhost:8080/cadenza/;"
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

@bp.route('/receive', methods=['post'])
def receive_image():
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
        # Use the correct filename for tile processing
        if tile_info:
            image_filepath = f"fachanwendung/app/static/images/tile_{tile_info['index']}.jpg"
        else:
            image_filepath = "fachanwendung/app/static/images/satellite_image.jpg"
            
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
        
        response = get_object_outlines(api_url, image_filepath, query)
        
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
        print(f"Masks shape: {masks.shape if masks is not None else 'None'}")
        print(f"Number of contours: {len(contours) if contours else 0}")
        print(f"Image dimensions: {imageDims}")
        print(f"Map bounds: {mapBounds}")
        
        # Simplify contours before creating overlays and sending to frontend
        simplified_contours = []
        if contours:
            tile_prefix = f"Tile {tile_info['index']}: " if tile_info else ""
            print(f"{tile_prefix}Simplifying contours...")
            for i, contour in enumerate(contours):
                # Simplify contour using Douglas-Peucker algorithm (conservative simplification)
                epsilon = 0.001 * cv2.arcLength(contour, True)  # 0.1% of perimeter for ~20% point reduction
                simplified_contour = cv2.approxPolyDP(contour, epsilon, True)
                simplified_contours.append(simplified_contour)
                print(f"{tile_prefix}Contour {i}: {len(contour)} -> {len(simplified_contour)} points (simplified)")
        
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
        
        # Delete tile file from hard storage after processing (cleanup)
        if tile_info:
            tile_filepath = os.path.join(IMAGE_FOLDER, f'tile_{tile_info["index"]}.jpg')
            try:
                if os.path.exists(tile_filepath):
                    os.remove(tile_filepath)
                    print(f"Deleted tile file: {tile_filepath}")
            except Exception as delete_error:
                print(f"Warning: Failed to delete tile file {tile_filepath}: {str(delete_error)}")
        
        return jsonify({'message': 'Successfully retrieved outline',
                        'outline': serializable_contours,
                        'imageDims': list(imageDims),
                        'overlay_images': overlay_urls,
                        'coordinates_transformed': bool(mapBounds and imageDims)}), 200
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