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


bp = Blueprint('main', __name__)
CORS(bp, resources={r"/receive": {"origins": "*"}})

IMAGE_FOLDER = 'fachanwendung/app/static/images'  # Define a subfolder within static
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)

def image_coords_to_map_coords(map_bounds, image_coords, image_dims):
    """
    Transform image pixel coordinates to geographic coordinates.
    
    Args:
        map_bounds: [[NW_x, NW_y], [SE_x, SE_y]] in EPSG:3857
        image_coords: Array of [x, y] pixel coordinates
        image_dims: [height, width] of image
        
    Returns:
        Array of [x, y] geographic coordinates in EPSG:3857
    """
    if not map_bounds or not image_dims:
        return image_coords
        
    # Parse map bounds
    NW = [float(map_bounds[0][0]), float(map_bounds[0][1])]
    SE = [float(map_bounds[1][0]), float(map_bounds[1][1])]
    width = float(image_dims[1])
    height = float(image_dims[0])
    
    # Calculate map bounds
    map_min_x = NW[0]
    map_max_x = SE[0]
    map_min_y = SE[1]
    map_max_y = NW[1]
    
    # Calculate scaling factors
    pixel_coord_x = (map_max_x - map_min_x) / width
    pixel_coord_y = (map_max_y - map_min_y) / height
    
    # Transform coordinates
    result = []
    for coord in image_coords:
        if len(coord) >= 2:
            x = float(coord[0])
            y = float(coord[1])
            
            # Transform: image (0,0) = top-left, map coordinates = geographic
            map_coord = [
                map_min_x + x * pixel_coord_x,        # X: left to right
                map_max_y - y * pixel_coord_y         # Y: top to bottom (flip Y axis)
            ]
            result.append(map_coord)
    
    return result

def map_coords_to_image_coords(map_bounds, map_coords, image_dims):
    """
    Transform geographic coordinates back to image pixel coordinates.
    
    Args:
        map_bounds: [[NW_x, NW_y], [SE_x, SE_y]] in EPSG:3857
        map_coords: Array of [x, y] geographic coordinates
        image_dims: [height, width] of image
        
    Returns:
        Array of [x, y] pixel coordinates
    """
    if not map_bounds or not image_dims:
        return map_coords
        
    # Parse map bounds
    NW = [float(map_bounds[0][0]), float(map_bounds[0][1])]
    SE = [float(map_bounds[1][0]), float(map_bounds[1][1])]
    width = float(image_dims[1])
    height = float(image_dims[0])
    
    # Calculate map bounds
    map_min_x = NW[0]
    map_max_x = SE[0]
    map_min_y = SE[1]
    map_max_y = NW[1]
    
    # Calculate scaling factors
    pixel_coord_x = (map_max_x - map_min_x) / width
    pixel_coord_y = (map_max_y - map_min_y) / height
    
    # Transform coordinates back to pixels
    result = []
    for coord in map_coords:
        if len(coord) >= 2:
            map_x = float(coord[0])
            map_y = float(coord[1])
            
            # Inverse transform
            pixel_x = (map_x - map_min_x) / pixel_coord_x
            pixel_y = (map_max_y - map_y) / pixel_coord_y  # Flip Y axis back
            
            result.append([int(pixel_x), int(pixel_y)])
    
    return result

def create_geographically_accurate_overlays(original_img, contours, masks, save_folder, map_bounds, image_dims):
    """
    Create geographically accurate overlay images by transforming contours
    to match the geographic projection used in the map display.
    
    Args:
        original_img: Original OpenCV image (BGR format)
        contours: List of contours from OpenCV (in pixel coordinates)
        masks: Binary mask as numpy array
        save_folder: Directory to save the overlay images
        map_bounds: Geographic bounds [[NW_x, NW_y], [SE_x, SE_y]] in EPSG:3857
        image_dims: Image dimensions [height, width]
        
    Returns:
        dict: Dictionary containing paths to saved overlay images
    """
    overlay_paths = {}
    
    try:
        print(f"Creating geographically accurate overlays...")
        print(f"Image dims: {image_dims}, Map bounds: {map_bounds}")
        
        # Create contours overlay with geographic accuracy
        if contours is not None and len(contours) > 0:
            contours_overlay = original_img.copy()
            
            colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0),
                     (255, 0, 255), (0, 255, 255), (128, 0, 128), (255, 165, 0)]
            
            print(f"Processing {len(contours)} contours with geographic transformation")
            
            for i, contour in enumerate(contours):
                color = colors[i % len(colors)]
                
                # Extract contour points and transform them
                contour_points = [[point[0][0], point[0][1]] for point in contour]
                
                # Transform to geographic coordinates using the same logic as frontend
                geo_coords = image_coords_to_map_coords(map_bounds, contour_points, image_dims)
                
                # Transform back to pixel coordinates for overlay rendering
                pixel_coords = map_coords_to_image_coords(map_bounds, geo_coords, image_dims)
                
                # Validate and filter coordinates
                valid_coords = []
                for coord in pixel_coords:
                    if (0 <= coord[0] < image_dims[1] and 0 <= coord[1] < image_dims[0]):
                        valid_coords.append(coord)
                
                if len(valid_coords) > 2:  # Need at least 3 points for a contour
                    # Convert to OpenCV contour format
                    transformed_contour = np.array([[[coord[0], coord[1]]] for coord in valid_coords], dtype=np.int32)
                    
                    # Draw the transformed contour
                    cv2.drawContours(contours_overlay, [transformed_contour], -1, color, 3)
                    
                    # Draw points for debugging
                    for coord in valid_coords:
                        cv2.circle(contours_overlay, (coord[0], coord[1]), 2, color, -1)
                else:
                    print(f"Skipping contour {i} - insufficient valid coordinates after transformation")
            
            # Save contours overlay
            contours_filename = 'satellite_image_contours_overlay_geo.jpg'
            contours_filepath = os.path.join(save_folder, contours_filename)
            cv2.imwrite(contours_filepath, contours_overlay)
            overlay_paths['contours'] = contours_filepath
            print(f"Saved geographic contours overlay to {contours_filepath}")
    
        # Create masks overlay (masks are already in correct pixel space)
        if masks is not None:
            masks_overlay = original_img.copy()
            
            print(f"Creating masks overlay with mask shape: {masks.shape}")
            
            # Ensure masks are in the correct coordinate system
            if masks.shape[:2] != (image_dims[0], image_dims[1]):
                print(f"Resizing mask from {masks.shape} to {image_dims}")
                masks = cv2.resize(masks.astype(np.uint8), (image_dims[1], image_dims[0]), interpolation=cv2.INTER_NEAREST)
            
            # Create colored mask overlay
            colored_mask = np.zeros_like(original_img)
            mask_color = (0, 255, 0)  # Bright green
            colored_mask[masks > 0] = mask_color
            
            # Blend with higher alpha for visibility
            alpha = 0.6
            masks_overlay = cv2.addWeighted(original_img, 1-alpha, colored_mask, alpha, 0)
            
            # Save masks overlay
            masks_filename = 'satellite_image_masks_overlay_geo.jpg'
            masks_filepath = os.path.join(save_folder, masks_filename)
            cv2.imwrite(masks_filepath, masks_overlay)
            overlay_paths['masks'] = masks_filepath
            print(f"Saved geographic masks overlay to {masks_filepath}")
            
    except Exception as e:
        print(f"Error creating geographically accurate overlays: {str(e)}")
        overlay_paths['error'] = str(e)
    
    return overlay_paths

def create_overlay_images(original_img, contours, masks, save_folder, map_bounds=None, image_dims=None):
    """
    Create and save overlay images showing contours and masks on the original image.
    Uses geographic transformation when map bounds are available for accuracy.
    """
    if map_bounds and image_dims:
        # Use geographically accurate method
        return create_geographically_accurate_overlays(original_img, contours, masks, save_folder, map_bounds, image_dims)
    else:
        # Fallback to simple pixel-based overlay
        return create_simple_overlay_images(original_img, contours, masks, save_folder)

def create_simple_overlay_images(original_img, contours, masks, save_folder):
    """
    Create simple overlay images without geographic transformation (fallback method).
    """
    overlay_paths = {}
    
    try:
        print("Creating simple pixel-based overlays...")
        
        # Create contours overlay
        if contours is not None and len(contours) > 0:
            contours_overlay = original_img.copy()
            colors = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0)]
            
            print(f"Drawing {len(contours)} contours on simple overlay")
            for i, contour in enumerate(contours):
                color = colors[i % len(colors)]
                print(f"Contour {i}: shape {contour.shape}, first few points: {contour[:3]}")
                cv2.drawContours(contours_overlay, [contour], -1, color, 3)
            
            contours_filename = 'satellite_image_contours_overlay.jpg'
            contours_filepath = os.path.join(save_folder, contours_filename)
            cv2.imwrite(contours_filepath, contours_overlay)
            overlay_paths['contours'] = contours_filepath
            print(f"Saved simple contours overlay to {contours_filepath}")
    
        # Create masks overlay
        if masks is not None:
            masks_overlay = original_img.copy()
            colored_mask = np.zeros_like(original_img)
            colored_mask[masks > 0] = (0, 255, 0)
            
            alpha = 0.6
            masks_overlay = cv2.addWeighted(original_img, 1-alpha, colored_mask, alpha, 0)
            
            masks_filename = 'satellite_image_masks_overlay.jpg'
            masks_filepath = os.path.join(save_folder, masks_filename)
            cv2.imwrite(masks_filepath, masks_overlay)
            overlay_paths['masks'] = masks_filepath
            print(f"Saved simple masks overlay to {masks_filepath}")
            
    except Exception as e:
        print(f"Error creating simple overlay images: {str(e)}")
        overlay_paths['error'] = str(e)
    
    return overlay_paths

@bp.after_request
def add_cors_headers(response):
    cadenza_uri = current_app.config.get('CADENZA_URI', '')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:8080 http://localhost:8080/cadenza/; connect-src 'self' http://localhost:8080 http://127.0.0.1:5000;"
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
    # Check if imageData is in the request
    img = None
    try:
        # Get the base64 string from the data URL
        image_data = request.files['imageData']
        image = Image.open(image_data.stream)
        
        # Convert to OpenCV format
        img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Save the image for debugging (optional)
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
        response = get_object_outlines("https://kgu5t2vmwim44q-5000.proxy.runpod.net/", "fachanwendung/app/static/images/satellite_image.jpg", query)
        
        # Handle the case when get_object_outlines returns None
        if response is None:
            return jsonify({'error': 'Failed to process image'}), 500
            
        # Unpack the response tuple
        result, contours, masks = response
        print(f"Masks shape: {masks.shape if masks is not None else 'None'}")
        print(f"Number of contours: {len(contours) if contours else 0}")
        print(f"Image dimensions: {imageDims}")
        print(f"Map bounds: {mapBounds}")
        
        # Simplify contours before creating overlays and sending to frontend
        simplified_contours = []
        if contours:
            print("Simplifying contours...")
            for i, contour in enumerate(contours):
                # Simplify contour using Douglas-Peucker algorithm (conservative simplification)
                epsilon = 0.001 * cv2.arcLength(contour, True)  # 0.1% of perimeter for ~20% point reduction
                simplified_contour = cv2.approxPolyDP(contour, epsilon, True)
                simplified_contours.append(simplified_contour)
                print(f"Contour {i}: {len(contour)} -> {len(simplified_contour)} points (simplified)")
        
        # Create overlay images using simplified contours
        overlay_paths = create_overlay_images(img, simplified_contours, masks, IMAGE_FOLDER, mapBounds, imageDims)
        
        # Transform simplified contours to geographic coordinates for frontend display
        # This ensures the map geometries match the overlay images
        serializable_contours = []
        if simplified_contours and mapBounds and imageDims:
            print("Transforming simplified contours to geographic coordinates for frontend display...")
            for i, simplified_contour in enumerate(simplified_contours):
                # Extract simplified contour points
                contour_points = [[point[0][0], point[0][1]] for point in simplified_contour]
                
                # Transform to geographic coordinates using the same logic as the overlay creation
                geo_coords = image_coords_to_map_coords(mapBounds, contour_points, imageDims)
                
                # Convert to the format expected by the frontend
                serializable_contours.append(geo_coords)
                
                print(f"Simplified contour {i}: {len(simplified_contour)} points -> {len(geo_coords)} geo points")
        elif simplified_contours:
            # Fallback to original pixel coordinates if no geographic data
            print("Using simplified contours with pixel coordinates (no geographic transformation)")
            for i, simplified_contour in enumerate(simplified_contours):
                serializable_contours.append(simplified_contour.tolist())
                print(f"Simplified contour {i}: {len(simplified_contour)} points")
        
        print(f"Processed {len(serializable_contours)} simplified contours for JSON")
        
        # Convert file paths to URLs
        overlay_urls = {}
        for key, path in overlay_paths.items():
            if key != 'error' and path:
                filename = os.path.basename(path)
                overlay_urls[key] = urljoin(request.url_root, f'overlay_images/{filename}')
        
        return jsonify({'message': 'Successfully retrieved outline',
                        'outline': serializable_contours,
                        'imageDims': list(imageDims),
                        'overlay_images': overlay_urls,
                        'coordinates_transformed': bool(mapBounds and imageDims)}), 200
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500
    # if file:
    #     img = np.array(Image.open(file))
    #     try:
    #         img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            # img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # filename = 'satellite_image.jpg'
            # filepath = os.path.join(IMAGE_FOLDER, filename)
            # cv2.imwrite(filepath, img)

            # image_url = urljoin(request.url_root, os.path.join('static/images', filename))
            # get_geopixel_result([])
            

        #     return jsonify({'message': 'Image received and saved successfully',
        #                     'image_url': image_url,
        #                     'mapExtent': mapBounds}), 200
        # except Exception as e:
        #     return jsonify({'error': f'Error processing file: {str(e)}'}), 500

    return jsonify({'error': 'Something went wrong'}), 500