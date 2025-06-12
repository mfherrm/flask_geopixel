"""
Image Processing and Geographic Transformation module for GeoPixel Flask application.

This module handles all image processing and geographic coordinate transformation functionality including:
- Coordinate transformations between image pixels and geographic coordinates
- Image overlay creation with contours and masks
- Geographic accuracy for map projections
- Simple fallback methods for pixel-based overlays
"""

import os
import cv2
import numpy as np


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

def create_simple_overlay_images(original_img, contours, masks, save_folder):
    """
    Create simple overlay images without geographic transformation (fallback method).
    
    Args:
        original_img: Original OpenCV image (BGR format)
        contours: List of contours from OpenCV (in pixel coordinates)
        masks: Binary mask as numpy array
        save_folder: Directory to save the overlay images
        
    Returns:
        dict: Dictionary containing paths to saved overlay images
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

def create_overlay_images(original_img, contours, masks, save_folder, map_bounds=None, image_dims=None):
    """
    Create and save overlay images showing contours and masks on the original image.
    Uses geographic transformation when map bounds are available for accuracy.
    
    Args:
        original_img: Original OpenCV image (BGR format)
        contours: List of contours from OpenCV (in pixel coordinates)
        masks: Binary mask as numpy array
        save_folder: Directory to save the overlay images
        map_bounds: Geographic bounds [[NW_x, NW_y], [SE_x, SE_y]] in EPSG:3857 (optional)
        image_dims: Image dimensions [height, width] (optional)
        
    Returns:
        dict: Dictionary containing paths to saved overlay images
    """
    if map_bounds and image_dims:
        # Use geographically accurate method
        return create_geographically_accurate_overlays(original_img, contours, masks, save_folder, map_bounds, image_dims)
    else:
        # Fallback to simple pixel-based overlay
        return create_simple_overlay_images(original_img, contours, masks, save_folder)