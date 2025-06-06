import requests
import json
import cv2
import base64
import os
import numpy as np
from PIL import Image
from io import BytesIO

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
    
    # Prepare the request
    
    try:
        print(f"Sending request to {api_url}")
        print(f"Image: {image_path}")
        print(f"Query: {query}")
        
        # Open the file to avoid closed file errors
        with open(image_path, 'rb') as img_file:
            files = {'image': img_file}
            data = {'query': query}
            
            # Send the POST request with a longer timeout
            response = requests.post(api_url, files=files, data=data, timeout=300)
        
        # Check if the request was successful
        if response.status_code == 200:
            try:
                result = response.json()
                
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
        else:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            raise
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
        
    except Exception as e:
        print(f"Error sending request: {str(e)}")

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
        proceed = input("Do you want to proceed anyway? (y/n): ")
        if proceed.lower() != 'y':
            print("Exiting.")
            return
    
    # Process the image
    print("\nProcessing image...")
    result, pred_masks = process_image(image_path, query, api_process_url)
    
    if result:
        # Check for errors in the result
        if "error" in result:
            print(f"\nError from API: {result['error']}")
            return
        
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
        
        # If we have prediction masks, print information about them
        filtered_contours = None
        if pred_masks is not None:
            print("\n--- Prediction Masks ---")
            print(f"Prediction masks available: {pred_masks is not None}")
            if hasattr(pred_masks, "shape"):
                print(f"Mask shape: {pred_masks.shape}")
                print(f"Number of masks: {pred_masks.shape[0]}")
            
            # Process the mask for contour detection
            print("Processing mask for improved contour detection...")
            mask_uint8 = pred_masks.astype(np.uint8).squeeze()
            
           
            contours, hierarchy = cv2.findContours(mask_uint8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1)
            
            # Filter contours by area to remove tiny noise contours
            min_contour_area = 5  
            filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]
            
            print(f"Found {len(filtered_contours)} significant contours after filtering")

        print("\nProcessing complete!")

        # Return the prediction masks for potential further processing
        print(type(filtered_contours))
        return result, filtered_contours, mask_uint8
    else:
        print("\nFailed to process the image. Please check the API server logs for more details.")
        raise

if __name__ == "__main__":
    get_object_outlines("https://bpds0xic8d0b7g-5000.proxy.runpod.net/", "GeoPixel/images/example1.png","Please give me a segmentation mask for grey car with different colors for each.")