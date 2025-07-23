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
import concurrent.futures
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from .cuda_config import (
    CUDA_MEMORY_LIMITS, RATE_LIMITING, MEMORY_THRESHOLDS, ERROR_HANDLING,
    get_max_pixels_for_attempt, is_oom_error, log_debug
)

# Global rate limiting for GPU requests (ultra-fast mode enabled by default)
_api_lock = threading.Lock()
_last_request_time = 0
_min_request_interval = 0.5  # Balanced: 500ms minimum interval for stability

# Global optimized session for connection pooling
_optimized_session = None
_session_lock = threading.Lock()

class OptimizedAPISession:
    """Ultra-fast session management for maximum throughput"""
    
    def __init__(self, max_retries=2, pool_connections=30, pool_maxsize=100):
        self.session = requests.Session()
        
        # Configure aggressive retry strategy
        retry_strategy = Retry(
            total=max_retries,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "POST"],
            backoff_factor=0.5  # Faster backoff
        )
        
        # Configure high-performance adapter with large connection pool
        adapter = HTTPAdapter(
            pool_connections=pool_connections,
            pool_maxsize=pool_maxsize,
            max_retries=retry_strategy
        )
        
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Aggressive timeout settings for maximum speed
        self.session_timeout = 180  # 3 minutes - reduced from 5
        
        log_debug(f"Initialized OptimizedAPISession with connection pooling")
    
    def close(self):
        """Close the session"""
        if self.session:
            self.session.close()
            self.session = None

# Balanced batch processing configuration for Docker environments
BATCH_PROCESSING_CONFIG = {
    'enabled': True,                    # Enable batch processing
    'max_batch_size': 6,               # Optimized for typical 6-tile scenarios
    'min_batch_size': 2,               # Keep minimum at 2
    'max_parallel_workers': 4,         # Balanced for Docker containers
    'batch_timeout_multiplier': 2.0,   # More reasonable timeouts
    'prefer_batch_over_parallel': True,# Prefer batch processing over parallel individual requests
    'auto_fallback': True,             # Automatically fallback to individual processing if batch fails
}


def get_optimized_session():
    """Get or create the global optimized session"""
    global _optimized_session
    with _session_lock:
        if _optimized_session is None:
            _optimized_session = OptimizedAPISession()
        return _optimized_session

def choose_processing_strategy(num_images):
    """
    Choose the optimal processing strategy based on configuration and image count
    
    Args:
        num_images (int): Number of images to process
        
    Returns:
        str: Processing strategy ('batch', 'parallel', 'individual')
    """
    if not BATCH_PROCESSING_CONFIG['enabled']:
        log_debug("Batch processing disabled, using individual processing")
        return 'individual'
    
    if num_images < BATCH_PROCESSING_CONFIG['min_batch_size']:
        log_debug(f"Image count ({num_images}) below minimum batch size, using individual processing")
        return 'individual'
    
    if num_images <= BATCH_PROCESSING_CONFIG['max_batch_size']:
        if BATCH_PROCESSING_CONFIG['prefer_batch_over_parallel']:
            log_debug(f"Using batch processing for {num_images} images")
            return 'batch'
        else:
            log_debug(f"Using parallel processing for {num_images} images")
            return 'parallel'
    
    # For very large numbers, we might want to split into smaller batches or use parallel
    log_debug(f"Large image count ({num_images}), using parallel processing with workers")
    return 'parallel'

def rate_limit_api_request():
    """
    Rate limiting for stable API performance
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
    API health check for reliability
    """
    health_url = api_url.rstrip('/process') + '/health'
    try:
        print(f"🔍 Checking API health at {health_url}")
        response = requests.get(health_url, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Health check successful: {result}")
            return True
        else:
            print(f"❌ Health check failed with status code {response.status_code}")
            return False
    except:
        print(f"❌ Health check failed")
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

def process_images_smart(image_paths, query, api_url):
    """
    🎯 SMART PROCESSING: Automatically choose the best processing strategy based on configuration
    
    Args:
        image_paths (list): List of paths to image files
        query (str): Query to send with the images
        api_url (str): URL of the API endpoint
        
    Returns:
        list: List of tuples (API response dict, prediction masks if available) for each image
    """
    if not image_paths:
        return []
    
    num_images = len(image_paths)
    strategy = choose_processing_strategy(num_images)
    
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"🎯 SMART PROCESSING: Processing {num_images} images using '{strategy}' strategy")
    
    if strategy == 'batch':
        return process_images_batch(image_paths, query, api_url)
    elif strategy == 'parallel':
        max_workers = min(num_images, BATCH_PROCESSING_CONFIG['max_parallel_workers'])
        return process_images_parallel(image_paths, query, api_url, max_workers)
    else:  # individual
        return process_images_individual(image_paths, query, api_url)

def process_images_batch(image_paths, query, api_url):
    """
    🚀 BATCH PROCESSING: Send multiple images to the GeoPixel API in a single batch request
    This dramatically improves performance for tiling scenarios.
    
    Args:
        image_paths (list): List of paths to image files
        query (str): Query to send with the images
        api_url (str): URL of the API endpoint
        
    Returns:
        list: List of tuples (API response dict, prediction masks if available) for each image
    """
    if not image_paths:
        return []
    
    num_images = len(image_paths)
    max_batch_size = BATCH_PROCESSING_CONFIG['max_batch_size']
    
    # If we have more images than max batch size, split into smaller batches
    if num_images > max_batch_size:
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"🔀 SPLITTING BATCH: {num_images} images exceeds max batch size ({max_batch_size}), splitting")
        
        all_results = []
        for i in range(0, num_images, max_batch_size):
            batch_paths = image_paths[i:i + max_batch_size]
            batch_num = (i // max_batch_size) + 1
            total_batches = (num_images + max_batch_size - 1) // max_batch_size
            
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"🚀 BATCH PROCESSING {batch_num}/{total_batches}: Sending {len(batch_paths)} images")
            batch_results = process_images_batch_internal(batch_paths, query, api_url)
            all_results.extend(batch_results)
        
        return all_results
    
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"🚀 BATCH PROCESSING: Sending {len(image_paths)} images in single request")
    return process_images_batch_internal(image_paths, query, api_url)

def process_images_batch_internal(image_paths, query, api_url):
    """
    Internal batch processing function that handles a single batch within size limits
    """
    
    # Get optimized session
    session = get_optimized_session()
    
    # Validate all image files exist and prepare batch data
    tiles_data = []
    for i, image_path in enumerate(image_paths):
        if not os.path.exists(image_path):
            print(f"Error: Image file not found: {image_path}")
            continue
        
        # Check image file size
        file_size = os.path.getsize(image_path)
        if file_size == 0:
            print(f"Error: Image file is empty: {image_path}")
            continue
        
        # Encode image as base64
        try:
            with open(image_path, 'rb') as img_file:
                image_data = base64.b64encode(img_file.read()).decode('utf-8')
            
            tiles_data.append({
                'query': query,
                'image_base64': image_data,
                'tile_id': f'tile_{i}'
            })
            
        except Exception as e:
            print(f"⚠️  Error encoding image {i}: {str(e)}")
            continue
    
    if not tiles_data:
        print("Error: No valid images to process")
        return []
    
    # Send batch request to API
    try:
        # Use unified endpoint that can handle both single and batch requests
        batch_url = api_url
        
        payload = {'tiles': tiles_data}
        
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"Sending batch request to {batch_url}")
        start_time = time.time()
        
        timeout_multiplier = BATCH_PROCESSING_CONFIG['batch_timeout_multiplier']
        batch_timeout = int(session.session_timeout * timeout_multiplier)
        
        # High-performance headers
        headers = {
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate'
        }
        
        response = session.session.post(
            batch_url,
            json=payload,
            headers=headers,
            timeout=batch_timeout
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"✅ Batch processing completed in {processing_time:.2f} seconds")
            
            # Convert batch result to individual results format
            individual_results = []
            if 'tile_results' in result:
                for tile_result in result['tile_results']:
                    if 'error' not in tile_result:
                        # Process prediction masks if available
                        pred_masks = None
                        if "pred_masks_base64" in tile_result:
                            try:
                                masks_encoded = tile_result["pred_masks_base64"]
                                masks = []
                                for mask_b64 in masks_encoded:
                                    mask_data = base64.b64decode(mask_b64)
                                    mask_img = Image.open(BytesIO(mask_data))
                                    mask_np = np.array(mask_img) > 0
                                    masks.append(mask_np)
                                
                                if masks:
                                    pred_masks = np.stack(masks)
                                    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                                        print(f"✅ Successfully decoded {len(masks)} prediction masks")
                            except Exception as e:
                                if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                                    print(f"⚠️  Error decoding prediction masks: {str(e)}")
                        
                        individual_results.append((tile_result, pred_masks))
                    else:
                        individual_results.append((tile_result, None))
            
            return individual_results
        else:
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"❌ Batch request failed with status code {response.status_code}")
                print(f"Response: {response.text[:500]}...")
            
            # Fallback to individual processing
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print("🔄 Falling back to individual processing...")
            if BATCH_PROCESSING_CONFIG['auto_fallback']:
                return process_images_individual(image_paths, query, api_url)
            else:
                if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                    print("⚠️ Auto-fallback disabled, returning failed batch results")
                return [({"error": f"Batch processing failed with status {response.status_code}"}, None) for _ in image_paths]
            
    except Exception as e:
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"❌ Error in batch processing: {str(e)}")
            
            # Enhanced error handling with categorization
            error_type = type(e).__name__
            if "timeout" in str(e).lower():
                print("⏱️ Batch processing timeout detected")
            elif "connection" in str(e).lower():
                print("🌐 Network connection error in batch processing")
            elif "memory" in str(e).lower() or "oom" in str(e).lower():
                print("💾 Memory error in batch processing")
        
        if BATCH_PROCESSING_CONFIG['auto_fallback']:
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print("🔄 Auto-fallback enabled, switching to individual processing...")
            return process_images_individual(image_paths, query, api_url)
        else:
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print("⚠️ Auto-fallback disabled, returning error results")
            return [({"error": f"Batch processing error: {str(e)}"}, None) for _ in image_paths]

def process_images_individual(image_paths, query, api_url):
    """
    Fallback function to process images individually when batch processing fails
    """
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"🔄 Processing {len(image_paths)} images individually")
    results = []
    
    for i, image_path in enumerate(image_paths):
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"Processing image {i+1}/{len(image_paths)}: {os.path.basename(image_path)}")
        try:
            result = process_image_with_retry(image_path, query, api_url)
            results.append(result if result else ({"error": f"Failed to process {image_path}"}, None))
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            results.append(({"error": f"Error processing {image_path}: {str(e)}"}, None))
    
    return results

def process_images_parallel(image_paths, query, api_url, max_workers=4):
    """
    Process images using thread pool for parallel execution when batch processing is not available
    Enhanced with robust error handling and resource management
    """
    if len(image_paths) <= 1:
        return process_images_individual(image_paths, query, api_url)
    
    # Apply configuration limits
    max_workers = min(max_workers, BATCH_PROCESSING_CONFIG['max_parallel_workers'])
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"⚡ Processing {len(image_paths)} images in parallel with {max_workers} workers")
    
    def process_single_image_worker(image_path):
        try:
            return process_image_with_retry(image_path, query, api_url)
        except Exception as e:
            print(f"Error in worker processing {image_path}: {str(e)}")
            return ({"error": f"Worker error: {str(e)}"}, None)
    
    results = []
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_path = {
            executor.submit(process_single_image_worker, image_path): image_path
            for image_path in image_paths
        }
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(future_to_path):
            image_path = future_to_path[future]
            try:
                result = future.result()
                results.append(result if result else ({"error": f"Failed to process {image_path}"}, None))
                if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                    print(f"✅ Completed: {os.path.basename(image_path)}")
            except Exception as exc:
                if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                    print(f"❌ {image_path} generated an exception: {exc}")
                results.append(({"error": f"Exception: {str(exc)}"}, None))
    
    processing_time = time.time() - start_time
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"✅ Parallel processing completed in {processing_time:.2f} seconds")
    
    return results

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
    
    # Try to open the image to verify it's valid (only when verbose logging is enabled)
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                print(f"Image dimensions: {width}x{height}")
                print(f"Image format: {img.format}")
        except Exception as e:
            print(f"Warning: Could not verify image with PIL: {str(e)}")
    
    try:
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"Sending request to {api_url}")
            print(f"Image: {image_path}")
            print(f"Query: {query}")
        
        # Skip internet connectivity test for performance unless verbose logging is enabled
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False) and not BATCH_PROCESSING_CONFIG.get('skip_health_checks', False):
            try:
                print("🔍 Testing internet connectivity...")
                test_response = requests.get("https://httpbin.org/get", timeout=5)  # Reduced timeout
                print(f"🔍 Internet test result: {test_response.status_code}")
            except Exception as e:
                print(f"❌ Internet connectivity test failed: {str(e)}")
        
        # Apply rate limiting to prevent GPU overload
        rate_limit_api_request()
        
        # Open the file to avoid closed file errors
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            data = {'query': query}
            
            # Send the POST request with configured timeout
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"🔍 Making request to: {api_url}")
                print(f"🔍 Request data: {data}")
                print(f"🔍 Files: {list(files.keys())}")
            
            response = requests.post(api_url, files=files, data=data, timeout=ERROR_HANDLING['api_timeout'])
            
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"🔍 Response status: {response.status_code}")
        
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
                            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                                print(f"Successfully decoded {len(masks)} prediction masks")
                    except Exception as e:
                        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
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
    
    api_process_url = f"{api_base_url.rstrip('/')}/process"
    
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
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
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"Original image size: {width}x{height}")
    
    # Get MSFF flag from upscaling config
    use_msff = upscaling_config.get('msff', False)
    
    # NEW LOGIC: Multi-scale processing based on MSFF flag, not scale
    if use_msff:
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"\n🔄 MULTI-SCALE FEATURE FUSION PROCESSING (MSFF enabled)")
        return process_tile_with_multiscale_masks(image_path, query, api_process_url, requested_scale, width, height)
    else:
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
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
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"Processing tile with multi-scale mask logic for scale {scale}")
    
    # Calculate the 4 scales according to the formula
    i = int(np.log2(scale))
    scales = [
        scale,                          # s
        scale / (2 ** i),              # s/2^i (original)
        scale / (2 ** (i + 1)),        # s/2^(i+1) (half)
        scale / (2 ** (i + 2))         # s/2^(i+2) (quarter)
    ]
    
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"Processing at scales: {scales}")
    
    # Step 1: Build array of scaled images
    tile_array = []
    for scale_factor in scales:
        upscaled_image_path = upscale_image(image_path, scale_factor)
        tile_array.append(upscaled_image_path)
        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
            print(f"✓ Created scaled image for factor {scale_factor}")
    
    # Step 2: 🚀 BATCH PROCESS all scaled images through GeoPixel for maximum efficiency
    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
        print(f"🚀 BATCH PROCESSING: Processing {len(tile_array)} scales simultaneously")
    
    try:
        # Use smart processing for all scales at once - this is the key optimization!
        batch_results = process_images_smart(tile_array, query, api_process_url)
        
        if batch_results and len(batch_results) == len(tile_array):
            if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                print(f"✅ Batch processing successful for all {len(batch_results)} scales")
            mask_array = []
            
            for i, (result, pred_masks) in enumerate(batch_results):
                scale_factor = scales[i]
                
                if 'error' not in result and pred_masks is not None:
                    # Post-process the mask
                    processed_mask = post_process_mask(pred_masks)
                    if processed_mask is not None:
                        # Resize mask back to original dimensions for concatenation
                        resized_mask = cv2.resize(processed_mask, (width, height), interpolation=cv2.INTER_AREA)
                        mask_array.append(resized_mask)
                        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                            print(f"✓ Processed mask for scale {scale_factor}, resized to {width}x{height}")
                    else:
                        if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                            print(f"⚠️ No valid mask from scale {scale_factor}")
                        mask_array.append(np.zeros((height, width), dtype=np.uint8))
                else:
                    if not BATCH_PROCESSING_CONFIG.get('disable_verbose_logging', False):
                        print(f"⚠️ No prediction masks from scale {scale_factor}")
                    mask_array.append(np.zeros((height, width), dtype=np.uint8))
            
        else:
            print(f"⚠️ Batch processing failed or incomplete, falling back to individual processing")
            # Fallback to individual processing
            mask_array = []
            for i, scaled_image_path in enumerate(tile_array):
                scale_factor = scales[i]
                print(f"🔍 Processing scale {scale_factor} individually ({i+1}/{len(tile_array)})")
                
                try:
                    response = process_image_with_retry(scaled_image_path, query, api_process_url)
                    if response:
                        result, pred_masks = response
                        
                        if pred_masks is not None:
                            processed_mask = post_process_mask(pred_masks)
                            if processed_mask is not None:
                                resized_mask = cv2.resize(processed_mask, (width, height), interpolation=cv2.INTER_AREA)
                                mask_array.append(resized_mask)
                                print(f"✓ Processed mask for scale {scale_factor}")
                            else:
                                mask_array.append(np.zeros((height, width), dtype=np.uint8))
                        else:
                            mask_array.append(np.zeros((height, width), dtype=np.uint8))
                    else:
                        mask_array.append(np.zeros((height, width), dtype=np.uint8))
                        
                except Exception as e:
                    print(f"❌ Error processing scale {scale_factor}: {str(e)}")
                    mask_array.append(np.zeros((height, width), dtype=np.uint8))
        
    except Exception as e:
        print(f"❌ Error in batch processing multi-scale: {str(e)}")
        # Final fallback to individual processing
        mask_array = []
        for i, scaled_image_path in enumerate(tile_array):
            scale_factor = scales[i]
            try:
                response = process_image_with_retry(scaled_image_path, query, api_process_url)
                if response:
                    result, pred_masks = response
                    if pred_masks is not None:
                        processed_mask = post_process_mask(pred_masks)
                        if processed_mask is not None:
                            resized_mask = cv2.resize(processed_mask, (width, height), interpolation=cv2.INTER_AREA)
                            mask_array.append(resized_mask)
                        else:
                            mask_array.append(np.zeros((height, width), dtype=np.uint8))
                    else:
                        mask_array.append(np.zeros((height, width), dtype=np.uint8))
                else:
                    mask_array.append(np.zeros((height, width), dtype=np.uint8))
            except Exception as e2:
                print(f"❌ Error processing scale {scale_factor}: {str(e2)}")
                mask_array.append(np.zeros((height, width), dtype=np.uint8))
    
    # Clean up scaled images after processing
    for scaled_image_path in tile_array:
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
    Enhanced with smart processing capability for future batch optimization
    """
    print(f"Processing tile with single scale {scale}")
    
    # Create upscaled image if scale != 1
    if scale != 1:
        upscaled_image_path = upscale_image(image_path, scale)
    else:
        upscaled_image_path = image_path
    
    try:
        # 🎯 FUTURE ENHANCEMENT: If processing multiple tiles at same scale,
        # we could batch them here using process_images_smart([upscaled_image_path], query, api_process_url)
        # For now, single image processing is maintained for compatibility
        
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
