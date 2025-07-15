import requests
import json
import cv2
import base64
import os
import numpy as np
from PIL import Image
from io import BytesIO
import time
import threading
from .cuda_config import (
    CUDA_MEMORY_LIMITS, RATE_LIMITING, MEMORY_THRESHOLDS, ERROR_HANDLING,
    get_max_pixels_for_attempt, is_oom_error, log_debug
)

# Global rate limiting for GPU requests
_api_lock = threading.Lock()
_last_request_time = 0
_min_request_interval = 1.0  # Minimum 1 second between requests

def rate_limit_api_request():
    """
    Rate limit API requests to prevent GPU overload
    """
    global _last_request_time
    
    with _api_lock:
        current_time = time.time()
        time_since_last = current_time - _last_request_time
        
        if time_since_last < _min_request_interval:
            sleep_time = _min_request_interval - time_since_last
            print(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        _last_request_time = time.time()

def resize_image_if_needed(image_path, max_pixels=None):
    """
    Resize image if it's too large to prevent CUDA OOM errors
    
    Args:
        image_path (str): Path to the image file
        max_pixels (int): Maximum number of pixels allowed (uses config default if None)
        
    Returns:
        str: Path to the processed image (original or resized)
    """
    if max_pixels is None:
        max_pixels = CUDA_MEMORY_LIMITS['initial_max_pixels']
    
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            total_pixels = width * height
            
            log_debug(f"Original image size: {width}x{height} ({total_pixels:,} pixels)")
            
            # Check file size too
            file_size = os.path.getsize(image_path)
            if file_size > MEMORY_THRESHOLDS['max_file_size']:
                log_debug(f"Warning: Large file size ({file_size:,} bytes)")
            
            # Warn if exceeding warning threshold
            if total_pixels > MEMORY_THRESHOLDS['warning_pixel_threshold']:
                log_debug(f"Warning: Image exceeds recommended size ({total_pixels:,} > {MEMORY_THRESHOLDS['warning_pixel_threshold']:,} pixels)")
            
            if total_pixels <= max_pixels:
                log_debug("Image size is acceptable, no resizing needed")
                return image_path
            
            # Calculate new dimensions maintaining aspect ratio
            scale_factor = (max_pixels / total_pixels) ** 0.5
            new_width = int(round(width * scale_factor))
            new_height = int(round(height * scale_factor))
            
            log_debug(f"Resizing image to {new_width}x{new_height} ({new_width*new_height:,} pixels)")
            
            # Resize the image
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save resized image with a new name
            base_name, ext = os.path.splitext(image_path)
            resized_path = f"{base_name}_resized{ext}"
            resized_img.save(resized_path, quality=CUDA_MEMORY_LIMITS['resize_quality'])
            
            log_debug(f"Resized image saved to: {resized_path}")
            return resized_path
            
    except Exception as e:
        log_debug(f"Error resizing image: {str(e)}")
        return image_path

def check_health(api_url):
    """
    Check if the API server is healthy
    
    Args:
        api_url (str): Base URL of the API
        
    Returns:
        bool: True if healthy, False otherwise
    """
    health_url = api_url.rstrip('/process') + '/health'
    try:
        print(f"🔍 Checking API health at {health_url}")
        response = requests.get(health_url, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Health check successful: {result}")
            return True
        else:
            print(f"❌ Health check failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.ConnectTimeout:
        print(f"❌ Connection timeout - RunPod instance may be starting or not accessible")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error - RunPod instance may be stopped or URL incorrect")
        print(f"Connection error details: {str(e)}")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Request timeout - RunPod instance may be overloaded or slow")
        return False
    except Exception as e:
        print(f"❌ Error checking API health: {str(e)}")
        return False

def process_image_with_retry(image_path, query, api_url):
    """
    Send an image to the GeoPixel API with CUDA OOM error handling and retry logic
    
    Args:
        image_path (str): Path to the image file
        query (str): Query to send with the image
        api_url (str): URL of the API endpoint
        
    Returns:
        tuple: (API response dict, prediction masks if available)
    """
    current_image_path = image_path
    max_retries = CUDA_MEMORY_LIMITS['max_retries']
    
    log_debug(f"Starting image processing with {max_retries} max retries")
    
    for attempt in range(max_retries + 1):
        try:
            # Resize image if this is a retry attempt
            if attempt > 0:
                max_pixels = get_max_pixels_for_attempt(attempt)
                log_debug(f"Attempt {attempt+1}: Trying with smaller image (max {max_pixels:,} pixels)")
                current_image_path = resize_image_if_needed(image_path, max_pixels)
            
            result = process_image(current_image_path, query, api_url)
            
            # If successful, clean up any resized images and return
            if result and current_image_path != image_path:
                try:
                    os.remove(current_image_path)
                    log_debug(f"Cleaned up resized image: {current_image_path}")
                except:
                    pass
            
            return result
            
        except Exception as e:
            error_message = str(e)
            
            # Check if this is a CUDA OOM error using configuration
            if is_oom_error(error_message):
                log_debug(f"CUDA out of memory error detected on attempt {attempt+1}: {error_message}")
                
                if attempt < max_retries:
                    log_debug(f"Retrying with smaller image...")
                    time.sleep(RATE_LIMITING['oom_recovery_delay'])  # Recovery delay
                    continue
                else:
                    log_debug("Maximum retries reached. Image is too large for available GPU memory.")
                    raise Exception("CUDA out of memory: Image too large even after downsizing")
            else:
                # For non-OOM errors, don't retry
                log_debug(f"Non-OOM error occurred: {error_message}")
                raise e
    
    return None

def process_image(image_path, query, api_url):
    """
    Send an image to the GeoPixel API and get the description
    
    Args:
        image_path (str): Path to the image file
        query (str): Query to send with the image
        api_url (str): URL of the API endpoint
        
    Returns:
        tuple: (API response dict, prediction masks if available)
    """
    # Check if the image file exists
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        return None
    
    # Check image file size
    file_size = os.path.getsize(image_path)
    print(f"Image file size: {file_size} bytes")
    if file_size == 0:
        print("Error: Image file is empty")
        return None
    
    # Try to open the image to verify it's valid
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            print(f"Image format: {img.format}")
    except Exception as e:
        print(f"Warning: Could not verify image with PIL: {str(e)}")
    
    try:
        print(f"Sending request to {api_url}")
        print(f"Image: {image_path}")
        print(f"Query: {query}")
        
        # Apply rate limiting to prevent GPU overload
        rate_limit_api_request()
        
        # Open the file to avoid closed file errors
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            data = {'query': query}
            
            # Send the POST request with configured timeout
            response = requests.post(api_url, files=files, data=data, timeout=ERROR_HANDLING['api_timeout'])
        
        # Check if the request was successful
        if response.status_code == 200:
            try:
                result = response.json()
                
                # Check for CUDA OOM error in response
                if "error" in result and "cuda out of memory" in result["error"].lower():
                    raise Exception(result["error"])
                
                # Check if the response contains prediction masks
                pred_masks = None
                if "pred_masks_base64" in result:
                    try:
                        # Convert base64 encoded masks back to numpy arrays
                        masks_encoded = result["pred_masks_base64"]
                        masks = []
                        
                        for mask_b64 in masks_encoded:
                            # Decode base64
                            mask_data = base64.b64decode(mask_b64)
                            # Convert to numpy array
                            mask_img = Image.open(BytesIO(mask_data))
                            mask_np = np.array(mask_img) > 0  # Convert to boolean mask
                            masks.append(mask_np)
                        
                        if masks:
                            pred_masks = np.stack(masks)
                            print(f"Successfully decoded {len(masks)} prediction masks")
                    except Exception as e:
                        print(f"Error decoding prediction masks: {str(e)}")
                
                # Return both the result and the prediction masks
                return result, pred_masks
            except json.JSONDecodeError as e:
                print(f"Error: Failed to parse JSON response: {str(e)}")
                print(f"Response text: {response.text[:500]}...")
                return None
        else:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
            # Check if response contains CUDA OOM error
            try:
                if is_oom_error(response.text):
                    raise Exception(f"CUDA out of memory. Tried to allocate GPU memory.")
            except:
                pass
                
            raise Exception(f"API request failed with status {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
        raise Exception("Request timed out")
        
    except Exception as e:
        error_message = str(e)
        if is_oom_error(error_message):
            raise e  # Re-raise CUDA OOM errors for retry logic
        log_debug(f"Error sending request: {error_message}")
        raise e

def post_process_mask(pred_masks):
    """
    Post-process prediction masks to clean them up
    
    Args:
        pred_masks (numpy.ndarray): Raw prediction masks
        
    Returns:
        numpy.ndarray: Post-processed masks
    """
    if pred_masks is None:
        return None
        
    # Convert to proper format if needed
    if pred_masks.ndim == 3:
        mask = pred_masks.squeeze()
    else:
        mask = pred_masks
        
    # Convert to uint8 if needed
    if mask.dtype != np.uint8:
        mask = (mask * 255).astype(np.uint8)
    
    # Apply morphological operations to clean up the mask
    kernel = np.ones((3, 3), np.uint8)
    
    # Remove small noise
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Fill small holes
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    return mask

def get_object_outlines(api_base_url, image_path, query, upscaling_config=None):
    """
    NEW MASK PROCESSING LOGIC:
    Process tiles with multi-scale approach and mask concatenation
    """
    # Set default upscaling configuration if not provided
    if upscaling_config is None:
        upscaling_config = {'scale': 1, 'label': 'x1'}
    
    requested_scale = upscaling_config.get('scale', 1)
    
    api_process_url = f"{api_base_url}/process"
    
    print(f"GeoPixel API Client - NEW MASK LOGIC")
    print(f"====================================")
    print(f"API URL: {api_base_url}")
    print(f"Image: {image_path}")
    print(f"Query: {query}")
    print(f"Requested Upscaling: {upscaling_config.get('label', 'x1')}")
    
    # Check API health first
    if not check_health(api_base_url):
        print(f"\nERROR: API health check failed for {api_base_url}")
        return None
    
    # Get original image dimensions
    with Image.open(image_path) as img:
        width, height = img.size
        print(f"Original image size: {width}x{height}")
    
    # Get MSFF flag from upscaling config
    use_msff = upscaling_config.get('msff', False)
    
    # NEW LOGIC: Multi-scale processing based on MSFF flag, not scale
    if use_msff:
        print(f"\n🔄 MULTI-SCALE FEATURE FUSION PROCESSING (MSFF enabled)")
        return process_tile_with_multiscale_masks(image_path, query, api_process_url, requested_scale, width, height)
    else:
        print(f"\n🔄 SINGLE SCALE PROCESSING (MSFF disabled)")
        return process_tile_single_scale(image_path, query, api_process_url, requested_scale, width, height)

def process_tile_with_multiscale_masks(image_path, query, api_process_url, scale, width, height):
    """
    NEW LOGIC: Process tile at multiple scales and combine masks via concatenation
    
    For upscaling factor s >= 2, process at 4 different scales:
    - s (the selected upscaling factor)
    - s/2^i (original size, where i = log2(s))
    - s/2^(i+1) (half size) 
    - s/2^(i+2) (quarter size)
    """
    print(f"Processing tile with multi-scale mask logic for scale {scale}")
    
    # Calculate the 4 scales according to the formula
    i = int(np.log2(scale))
    scales = [
        scale,                          # s
        scale / (2 ** i),              # s/2^i (original)
        scale / (2 ** (i + 1)),        # s/2^(i+1) (half)
        scale / (2 ** (i + 2))         # s/2^(i+2) (quarter)
    ]
    
    print(f"Processing at scales: {scales}")
    
    # Step 1: Build array of scaled images
    tile_array = []
    for scale_factor in scales:
        upscaled_image_path = upscale_image(image_path, scale_factor)
        tile_array.append(upscaled_image_path)
        print(f"✓ Created scaled image for factor {scale_factor}")
    
    # Step 2: Process each scaled image through GeoPixel and collect masks
    mask_array = []
    for i, scaled_image_path in enumerate(tile_array):
        scale_factor = scales[i]
        print(f"🔍 Processing scale {scale_factor} ({i+1}/{len(tile_array)})")
        
        # Call GeoPixel API
        try:
            response = process_image_with_retry(scaled_image_path, query, api_process_url)
            if response:
                result, pred_masks = response
                
                # Post-process the mask
                if pred_masks is not None:
                    processed_mask = post_process_mask(pred_masks)
                    if processed_mask is not None:
                        # Resize mask back to original dimensions for concatenation
                        resized_mask = cv2.resize(processed_mask, (width, height), interpolation=cv2.INTER_AREA)
                        mask_array.append(resized_mask)
                        print(f"✓ Processed mask for scale {scale_factor}, resized to {width}x{height}")
                    else:
                        print(f"⚠️ No valid mask from scale {scale_factor}")
                        # Add empty mask to maintain array structure
                        mask_array.append(np.zeros((height, width), dtype=np.uint8))
                else:
                    print(f"⚠️ No prediction masks from scale {scale_factor}")
                    # Add empty mask to maintain array structure
                    mask_array.append(np.zeros((height, width), dtype=np.uint8))
            else:
                print(f"❌ Failed to process scale {scale_factor}")
                # Add empty mask to maintain array structure
                mask_array.append(np.zeros((height, width), dtype=np.uint8))
                
        except Exception as e:
            print(f"❌ Error processing scale {scale_factor}: {str(e)}")
            # Add empty mask to maintain array structure
            mask_array.append(np.zeros((height, width), dtype=np.uint8))
        
        # Clean up scaled image
        if scaled_image_path != image_path:
            try:
                os.remove(scaled_image_path)
                print(f"🧹 Cleaned up scaled image: {scaled_image_path}")
            except:
                pass
    
    # Step 3: Concatenate masks and apply threshold
    print(f"🔗 Concatenating {len(mask_array)} masks...")
    
    if not mask_array:
        print("❌ No masks to concatenate")
        return None
    
    # NEW LOGIC: Concatenate masks by summing them
    combined_mask = np.zeros((height, width), dtype=np.float32)
    
    for i, mask in enumerate(mask_array):
        if mask is not None:
            # Normalize mask to 0-1 range
            normalized_mask = mask.astype(np.float32) / 255.0
            combined_mask += normalized_mask
            print(f"✓ Added mask {i+1} to combination")
    
    # Apply NEW threshold logic: if value > 0, set to 1, else 0
    print("🎯 Applying threshold: value > 0 → 1, else → 0")
    binary_mask = (combined_mask > 0).astype(np.uint8)
    
    active_pixels = np.count_nonzero(binary_mask)
    print(f"✓ Final mask: {active_pixels} active pixels out of {width*height}")
    
    # Step 4: Extract contours from the final binary mask
    print("🔍 Extracting contours from final mask...")
    print(f"🔍 Binary mask info: shape={binary_mask.shape}, dtype={binary_mask.dtype}, unique_values={np.unique(binary_mask)}")
    
    contours, hierarchy = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    print(f"🔍 Found {len(contours)} raw contours from findContours")
    
    # Filter contours by area
    min_area = max(1, int(width * height * 0.0001))  # 0.01% of image area
    print(f"🔍 Using minimum area filter: {min_area} pixels")
    
    result_contours = []
    for i, contour in enumerate(contours):
        try:
            print(f"🔍 Processing multi-scale contour {i}: type={type(contour)}, shape={contour.shape if hasattr(contour, 'shape') else 'no shape'}")
            
            # Check contour area first
            try:
                area = cv2.contourArea(contour)
                if area <= min_area:
                    print(f"⚠️ Multi-scale contour {i} area {area} too small, skipping")
                    continue
                print(f"✓ Multi-scale contour {i} area: {area}")
            except Exception as area_error:
                print(f"❌ Error calculating area for multi-scale contour {i}: {str(area_error)}")
                continue
            
            # Ensure contour is a proper numpy array
            if not isinstance(contour, np.ndarray):
                print(f"❌ Multi-scale contour {i} is not a numpy array: {type(contour)}")
                continue
            
            # Check contour shape
            if len(contour.shape) != 3 or contour.shape[2] != 2:
                print(f"❌ Multi-scale contour {i} has invalid shape: {contour.shape}")
                continue
            
            # Ensure contour has enough points
            if len(contour) < 3:
                print(f"⚠️ Multi-scale contour {i} has only {len(contour)} points, skipping")
                continue
            
            # Safely calculate perimeter
            try:
                perimeter = cv2.arcLength(contour, True)
                print(f"✓ Multi-scale contour {i} perimeter: {perimeter}")
            except Exception as arc_error:
                print(f"❌ arcLength failed for multi-scale contour {i}: {str(arc_error)}")
                print(f"   Contour details: shape={contour.shape}, dtype={contour.dtype}")
                continue
            
            # Simplify contour if perimeter is valid
            if perimeter > 0:
                epsilon = 0.002 * perimeter
                try:
                    simplified = cv2.approxPolyDP(contour, epsilon, True)
                    print(f"✓ Multi-scale contour {i} simplified: {len(contour)} → {len(simplified)} points")
                except Exception as approx_error:
                    print(f"❌ approxPolyDP failed for multi-scale contour {i}: {str(approx_error)}")
                    simplified = contour
            else:
                simplified = contour
            
            # Convert to list format
            if len(simplified) >= 3:
                try:
                    contour_points = [[int(point[0][0]), int(point[0][1])] for point in simplified]
                    result_contours.append(contour_points)
                    print(f"✅ Successfully processed multi-scale contour {i}")
                except Exception as convert_error:
                    print(f"❌ Error converting multi-scale contour {i} to points: {str(convert_error)}")
            else:
                print(f"⚠️ Simplified multi-scale contour {i} has only {len(simplified)} points, skipping")
                
        except Exception as e:
            print(f"❌ Error processing multi-scale contour {i}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"✅ Multi-scale mask processing complete: {len(result_contours)} final contours")
    
    # Return in the expected format
    return {
        'text_response': f"Multi-scale mask processing complete with {len(result_contours)} contours",
        'multi_scale_processing': True,
        'scales_used': scales,
        'mask_combination': 'concatenation_with_threshold'
    }, result_contours, binary_mask

def process_tile_single_scale(image_path, query, api_process_url, scale, width, height):
    """
    Process tile at single scale (traditional approach for scale < 2)
    """
    print(f"Processing tile with single scale {scale}")
    
    # Create upscaled image if scale != 1
    if scale != 1:
        upscaled_image_path = upscale_image(image_path, scale)
    else:
        upscaled_image_path = image_path
    
    try:
        # Process image
        response = process_image_with_retry(upscaled_image_path, query, api_process_url)
        
        if response:
            result, pred_masks = response
            
            if pred_masks is not None:
                # Post-process mask
                processed_mask = post_process_mask(pred_masks)
                
                if processed_mask is not None:
                    # Resize back to original dimensions
                    if processed_mask.shape[:2] != (height, width):
                        resized_mask = cv2.resize(processed_mask, (width, height), interpolation=cv2.INTER_AREA)
                    else:
                        resized_mask = processed_mask
                    
                    # Extract contours
                    contours, _ = cv2.findContours(resized_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    print(f"🔍 Found {len(contours)} raw contours from findContours")
                    
                    # Filter and format contours
                    min_area = max(1, int(width * height * 0.0001))
                    print(f"🔍 Using minimum area filter: {min_area} pixels")
                    
                    result_contours = []
                    for i, contour in enumerate(contours):
                        try:
                            print(f"🔍 Processing contour {i}: type={type(contour)}, shape={contour.shape if hasattr(contour, 'shape') else 'no shape'}")
                            
                            # Check contour area first
                            try:
                                area = cv2.contourArea(contour)
                                if area <= min_area:
                                    print(f"⚠️ Contour {i} area {area} too small, skipping")
                                    continue
                                print(f"✓ Contour {i} area: {area}")
                            except Exception as area_error:
                                print(f"❌ Error calculating area for contour {i}: {str(area_error)}")
                                continue
                            
                            # Ensure contour is a proper numpy array
                            if not isinstance(contour, np.ndarray):
                                print(f"❌ Contour {i} is not a numpy array: {type(contour)}")
                                continue
                            
                            # Check contour shape
                            if len(contour.shape) != 3 or contour.shape[2] != 2:
                                print(f"❌ Contour {i} has invalid shape: {contour.shape}")
                                continue
                            
                            # Ensure contour has enough points
                            if len(contour) < 3:
                                print(f"⚠️ Contour {i} has only {len(contour)} points, skipping")
                                continue
                            
                            # Safely calculate perimeter
                            try:
                                perimeter = cv2.arcLength(contour, True)
                                print(f"✓ Contour {i} perimeter: {perimeter}")
                            except Exception as arc_error:
                                print(f"❌ arcLength failed for contour {i}: {str(arc_error)}")
                                print(f"   Contour details: shape={contour.shape}, dtype={contour.dtype}")
                                continue
                            
                            # Simplify contour if perimeter is valid
                            if perimeter > 0:
                                epsilon = 0.002 * perimeter
                                try:
                                    simplified = cv2.approxPolyDP(contour, epsilon, True)
                                    print(f"✓ Contour {i} simplified: {len(contour)} → {len(simplified)} points")
                                except Exception as approx_error:
                                    print(f"❌ approxPolyDP failed for contour {i}: {str(approx_error)}")
                                    simplified = contour
                            else:
                                simplified = contour
                            
                            # Convert to list format
                            if len(simplified) >= 3:
                                try:
                                    contour_points = [[int(point[0][0]), int(point[0][1])] for point in simplified]
                                    result_contours.append(contour_points)
                                    print(f"✅ Successfully processed contour {i}")
                                except Exception as convert_error:
                                    print(f"❌ Error converting contour {i} to points: {str(convert_error)}")
                            else:
                                print(f"⚠️ Simplified contour {i} has only {len(simplified)} points, skipping")
                                
                        except Exception as e:
                            print(f"❌ Error processing contour {i}: {str(e)}")
                            import traceback
                            traceback.print_exc()
                            continue
                    
                    print(f"✅ Single scale processing complete: {len(result_contours)} contours")
                    
                    return result, result_contours, resized_mask
                else:
                    print("⚠️ No valid processed mask")
            else:
                print("⚠️ No prediction masks returned")
        else:
            print("❌ Failed to process image")
    
    except Exception as e:
        print(f"❌ Error in single scale processing: {str(e)}")
    
    finally:
        # Clean up upscaled image
        if upscaled_image_path != image_path:
            try:
                os.remove(upscaled_image_path)
                print(f"🧹 Cleaned up upscaled image: {upscaled_image_path}")
            except:
                pass
    
    return None

def upscale_image(image_path, scale_factor):
    """
    Create upscaled version of image with 4K resolution limit
    
    Args:
        image_path (str): Path to original image
        scale_factor (float): Scale factor for upscaling
        
    Returns:
        str: Path to upscaled image
    """
    if scale_factor == 1:
        return image_path
    
    # 4K resolution limits
    MAX_4K_WIDTH = 3840
    MAX_4K_HEIGHT = 2160
    MAX_4K_PIXELS = MAX_4K_WIDTH * MAX_4K_HEIGHT  # 8,294,400 pixels
    
    try:
        with Image.open(image_path) as img:
            original_width, original_height = img.size
            original_pixels = original_width * original_height
            
            # Calculate target dimensions
            target_width = int(round(original_width * scale_factor))
            target_height = int(round(original_height * scale_factor))
            target_pixels = target_width * target_height
            
            print(f"🔍 Upscaling request: {original_width}x{original_height} → {target_width}x{target_height} (scale: {scale_factor})")
            print(f"🔍 Target pixels: {target_pixels:,} (4K limit: {MAX_4K_PIXELS:,})")
            
            # Check if target exceeds 4K resolution
            if target_pixels > MAX_4K_PIXELS:
                # Calculate maximum safe scale factor for 4K
                max_safe_scale = (MAX_4K_PIXELS / original_pixels) ** 0.5
                
                # Use a slightly smaller scale for safety margin
                safe_scale = max_safe_scale * 0.95
                
                print(f"⚠️ Target resolution exceeds 4K limit!")
                print(f"🔧 Reducing scale from {scale_factor} to {safe_scale:.2f} to stay within 4K")
                
                # Recalculate with safe scale
                new_width = int(round(original_width * safe_scale))
                new_height = int(round(original_height * safe_scale))
                actual_scale = safe_scale
                
                print(f"✅ Safe upscaling: {original_width}x{original_height} → {new_width}x{new_height} (scale: {actual_scale:.2f})")
                
            else:
                # Original scale is within 4K limits
                new_width = target_width
                new_height = target_height
                actual_scale = scale_factor
                print(f"✅ Upscaling within 4K limits: {original_width}x{original_height} → {new_width}x{new_height} (scale: {actual_scale})")
            
            # Additional safety check for individual dimensions
            if new_width > MAX_4K_WIDTH or new_height > MAX_4K_HEIGHT:
                # Scale down to fit within 4K dimensions
                width_scale = MAX_4K_WIDTH / original_width if new_width > MAX_4K_WIDTH else float('inf')
                height_scale = MAX_4K_HEIGHT / original_height if new_height > MAX_4K_HEIGHT else float('inf')
                dimension_scale = min(width_scale, height_scale) * 0.95  # 5% safety margin
                
                new_width = int(round(original_width * dimension_scale))
                new_height = int(round(original_height * dimension_scale))
                actual_scale = dimension_scale
                
                print(f"🔧 Dimension limit applied: {new_width}x{new_height} (scale: {actual_scale:.2f})")
            
            # Verify final dimensions are within limits
            final_pixels = new_width * new_height
            if final_pixels > MAX_4K_PIXELS:
                print(f"❌ Error: Final dimensions still exceed 4K limit ({final_pixels:,} > {MAX_4K_PIXELS:,})")
                print(f"🔄 Falling back to original image")
                return image_path
            
            # Resize image
            upscaled_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save upscaled image
            base_name, ext = os.path.splitext(image_path)
            upscaled_path = f"{base_name}_upscaled_x{actual_scale:.2f}{ext}"
            upscaled_img.save(upscaled_path, quality=CUDA_MEMORY_LIMITS['resize_quality'])
            
            print(f"💾 Saved 4K-limited upscaled image: {upscaled_path}")
            return upscaled_path
            
    except Exception as e:
        print(f"❌ Error upscaling image: {str(e)}")
        return image_path

if __name__ == "__main__":
    get_object_outlines("https://bpds0xic8d0b7g-5000.proxy.runpod.net/", "GeoPixel/images/example1.png","Please give me a segmentation mask for grey car with different colors for each.", {'scale': 2, 'label': 'x2'})