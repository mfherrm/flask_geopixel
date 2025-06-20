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
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            
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
        print(f"Checking API health at {health_url}")
        response = requests.get(health_url, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"Health check result: {result}")
            return True
        else:
            print(f"Health check failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error checking API health: {str(e)}")
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

def get_object_outlines(api_base_url, image_path, query):
    api_process_url = f"{api_base_url}/process"
    
    print(f"GeoPixel API Client")
    print(f"==================")
    print(f"API URL: {api_base_url}")
    print(f"Image: {image_path}")
    print(f"Query: {query}")
    print(f"==================\n")
       
    # Check API health first
    if not check_health(api_base_url):
        print("\nWARNING: API health check failed. The server might not be ready.")
        # In web application context, don't prompt user - just proceed with a warning
        print("Proceeding anyway...")
    
    # Process the image with retry logic for CUDA OOM errors
    log_debug("Processing image with CUDA OOM protection...")
    try:
        # First resize image if needed to prevent initial OOM
        # processed_image_path = resize_image_if_needed(image_path)  # Uses config default

        
        with Image.open(image_path) as img:
            width, height = img.size
            print("Original image size: ", width, "x", height)
            
            processed_image = img.resize((width*2, height*2), Image.Resampling.LANCZOS)
            base_name, ext = os.path.splitext(image_path)
            processed_image_path = f"{base_name}_resized{ext}"
            processed_image.save(processed_image_path, quality=CUDA_MEMORY_LIMITS['resize_quality'])
        
        response = process_image_with_retry(processed_image_path, query, api_process_url)
        
        # Clean up resized image if created
        if processed_image_path != image_path:
            try:
                os.remove(processed_image_path)
                print(f"Cleaned up preprocessed image: {processed_image_path}")
            except:
                pass
        
        # Check if response is valid
        if response is None:
            print("No response received from API")
            return None
            
        result, pred_masks = response
                
    except Exception as e:
        print(f"\nFailed to process image: {str(e)}")
        return None
    
    if result:
        # Check for errors in the result
        if "error" in result:
            print(f"\nError from API: {result['error']}")
            return None
        
        # Print the text response
        print("\n--- Text Response ---")
        print(result.get("text_response", "No text response"))
        
        # Print any error messages
        for key in result:
            if key.endswith('_error'):
                print(f"\n--- Error: {key} ---")
                print(result[key])
        
        # Print the reconstructed text if available
        if "reconstructed_text" in result:
            print("\n--- Reconstructed Text ---")
            print(result["reconstructed_text"])
        
        # Initialize default values
        filtered_contours = []
        mask_uint8 = None
        
        # If we have prediction masks, print information about them
        if pred_masks is not None:
            print("\n--- Prediction Masks ---")
            print(f"Prediction masks available: {pred_masks is not None}")
            if hasattr(pred_masks, "shape"):
                print(f"Mask shape: {pred_masks.shape}")
                print(f"Number of masks: {pred_masks.shape[0]}")
            
            # Process the mask for contour detection
            print("Processing mask for improved contour detection...")
            mask_uint8 = pred_masks.astype(np.uint8).squeeze()

            mask_uint8 = cv2.resize(mask_uint8, (width, height), interpolation=cv2.INTER_AREA)
            
            # Debug: Check mask content
            unique_values = np.unique(mask_uint8)
            non_zero_pixels = np.count_nonzero(mask_uint8)
            print(f"Mask debug: unique values = {unique_values}, non-zero pixels = {non_zero_pixels}, total pixels = {mask_uint8.size}")
            
            # If mask is completely empty, provide helpful feedback
            if non_zero_pixels == 0:
                print("WARNING: Mask is completely empty - no objects detected. This could be due to:")
                print("  1. No matching objects in the image")
                print("  2. Image resolution too low after tiling")
                print("  3. Query format not optimal for the AI model")
                print("  4. Objects too small to detect in tile")
            
            contours, hierarchy = cv2.findContours(mask_uint8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1)
            print(f"Found {len(contours)} total contours before filtering")
            
            # Debug: Show contour areas before filtering
            if len(contours) > 0:
                contour_areas = [cv2.contourArea(cnt) for cnt in contours]
                print(f"Contour areas: {contour_areas}")
            
            # Filter contours by area to remove tiny noise contours
            # Make minimum area proportional to image size for tile processing
            image_area = mask_uint8.shape[0] * mask_uint8.shape[1]
            min_contour_area = max(1, int(image_area * 0.000001))  # 0.0001% of image area, minimum 1 pixel
            print(f"Using minimum contour area: {min_contour_area} pixels (image area: {image_area})")
            filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]
            
            print(f"Found {len(filtered_contours)} significant contours after filtering")
        else:
            print("\n--- No Prediction Masks ---")
            print("No prediction masks available from API response")

        print("\nProcessing complete!")

        # Return the prediction masks for potential further processing
        print(f"Returning: result, {len(filtered_contours)} contours, mask shape: {mask_uint8.shape if mask_uint8 is not None else 'None'}")
        return result, filtered_contours, mask_uint8
    else:
        print("\nFailed to process the image. Please check the API server logs for more details.")
        return None

if __name__ == "__main__":
    get_object_outlines("https://bpds0xic8d0b7g-5000.proxy.runpod.net/", "GeoPixel/images/example1.png","Please give me a segmentation mask for grey car with different colors for each.")