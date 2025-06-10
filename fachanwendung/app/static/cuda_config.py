"""
CUDA Memory Management Configuration for GeoPixel Integration

This file contains configurable parameters for managing CUDA out of memory errors.
Adjust these values based on your GPU specifications and requirements.
"""

# Image size limits for CUDA OOM prevention
# These values represent maximum pixels before resizing
CUDA_MEMORY_LIMITS = {
    # Primary limit - first attempt
    'initial_max_pixels': 2048 * 2048,  # ~4MP
    
    # Progressive downscaling for retries
    'retry_limits': [
        1536 * 1536,  # ~2.4MP - 1st retry
        1024 * 1024,  # ~1MP   - 2nd retry  
        512 * 512,     # ~0.25MP - 3rd retry (emergency)
    ],
    
    # Maximum number of retry attempts
    'max_retries': 3,
    
    # Quality setting for resized images (1-100)
    'resize_quality': 95,
}

# Rate limiting configuration
RATE_LIMITING = {
    # Minimum seconds between API requests
    'min_request_interval': 1.0,
    
    # Additional delay after CUDA OOM error (seconds)
    'oom_recovery_delay': 3.0,
}

# Memory monitoring thresholds
MEMORY_THRESHOLDS = {
    # File size limits (bytes)
    'max_file_size': 50 * 1024 * 1024,  # 50MB
    
    # Warn if image exceeds this pixel count
    'warning_pixel_threshold': 3000 * 3000,  # 9MP
}

# Error handling configuration
ERROR_HANDLING = {
    # CUDA OOM error keywords to detect
    'oom_keywords': [
        'cuda out of memory',
        'out of memory',
        'cudart out of memory',
        'gpu memory',
        'allocation failed'
    ],
    
    # Request timeout (seconds)
    'api_timeout': 300,
    
    # Enable debug logging
    'debug_mode': True,
}

def get_max_pixels_for_attempt(attempt_number):
    """
    Get the maximum pixel count for a given retry attempt
    
    Args:
        attempt_number (int): 0 for initial, 1+ for retries
        
    Returns:
        int: Maximum pixels allowed for this attempt
    """
    if attempt_number == 0:
        return CUDA_MEMORY_LIMITS['initial_max_pixels']
    
    retry_index = attempt_number - 1
    if retry_index < len(CUDA_MEMORY_LIMITS['retry_limits']):
        return CUDA_MEMORY_LIMITS['retry_limits'][retry_index]
    
    # Return the smallest limit if we exceed retry attempts
    return CUDA_MEMORY_LIMITS['retry_limits'][-1]

def is_oom_error(error_message):
    """
    Check if an error message indicates CUDA out of memory
    
    Args:
        error_message (str): Error message to check
        
    Returns:
        bool: True if this appears to be a CUDA OOM error
    """
    error_lower = error_message.lower()
    return any(keyword in error_lower for keyword in ERROR_HANDLING['oom_keywords'])

def log_debug(message):
    """
    Log debug message if debug mode is enabled
    
    Args:
        message (str): Debug message to log
    """
    if ERROR_HANDLING['debug_mode']:
        print(f"[CUDA_DEBUG] {message}")