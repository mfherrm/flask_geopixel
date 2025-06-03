import requests
import json
import cv2
import base64
import os
import sys
import time
import numpy as np
from PIL import Image
from io import BytesIO
from matplotlib import pyplot as plt

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
        
    
    return None, None

def plot_outline(image_path, pred_masks, output_path=None):
    """
    Plot the outline of prediction masks on the original image
    
    Args:
        image_path (str): Path to the original image
        pred_masks (numpy.ndarray): Prediction masks
        output_path (str, optional): Path to save the plot. If None, the plot is displayed
    
    Returns:
        None
    """
    try:
        # Load the original image
        original_img = cv2.imread(image_path)
        if original_img is None:
            print(f"Error: Could not load image {image_path}")
            return
            
        # Convert BGR to RGB (OpenCV loads as BGR, matplotlib expects RGB)
        original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        
        # Create a figure with two subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
        
        # Plot original image
        ax1.imshow(original_img)
        ax1.set_title('Original Image')
        ax1.axis('off')
        
        # Plot image with outlines
        ax2.imshow(original_img)
        
        # Convert mask to uint8
        mask_uint8 = pred_masks.astype(np.uint8).squeeze()
        
        contours, _ = cv2.findContours(mask_uint8, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)
        
        print(f"Found {len(contours)} contours in plot_outline")
        
        # Filter contours by area to remove tiny contours
        min_contour_area = 10
        filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]
        
        # Plot each contour with a different color
        for i, contour in enumerate(filtered_contours):
            # Generate a random color for each contour
            color = np.random.rand(3,)
            # Convert contour to the format expected by matplotlib
            contour_reshaped = contour.reshape(-1, 2)
            ax2.plot(contour_reshaped[:, 0], contour_reshaped[:, 1], color=color, linewidth=2)
        
        ax2.set_title('Image with Outlines')
        ax2.axis('off')
        
        plt.tight_layout()

        plt.show()
            
    except Exception as e:
        print(f"Error plotting outline: {str(e)}")

def save_masked_image(base64_image, output_path):
    """
    Save a base64-encoded image to a file
    
    Args:
        base64_image (str): Base64-encoded image data
        output_path (str): Path to save the image
    """
    try:
        # Decode the base64 image
        image_data = base64.b64decode(base64_image)
        
        # Create an image from the binary data
        image = Image.open(BytesIO(image_data))
        
        # Save the image
        image.save(output_path)
        print(f"Masked image saved to: {output_path}")
        
        return True
    except Exception as e:
        print(f"Error saving masked image: {str(e)}")
        return False

def main():
    # Configuration
    api_base_url = "https://bpds0xic8d0b7g-5000.proxy.runpod.net/"
    api_process_url = f"{api_base_url}/process"
    image_path = "GeoPixel/images/example1.png"
    query = "Please give me a segmentation mask for grey car with different colors for each."
    output_dir = "output"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    if len(sys.argv) > 2:
        query = sys.argv[2]
    
    print(f"GeoPixel API Client")
    print(f"==================")
    print(f"API URL: {api_base_url}")
    print(f"Image: {image_path}")
    print(f"Query: {query}")
    print(f"==================\n")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
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
        
        # Save the masked image if available
        if "masked_image_base64" in result:
            print("\n--- Masked Image ---")
            output_path = os.path.join(output_dir, f"masked_{os.path.basename(image_path)}")
            save_masked_image(result["masked_image_base64"], output_path)
        elif "masked_image_path" in result:
            print(f"\nMasked image saved on server at: {result['masked_image_path']}")
        
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
            min_contour_area = 10  
            filtered_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > min_contour_area]
            
            print(f"Found {len(filtered_contours)} significant contours after filtering")
            
            # Plot the outline
            outline_path = os.path.join(output_dir, f"outline_{os.path.basename(image_path)}")
            # plot_outline(image_path, pred_masks, outline_path)

        print("\nProcessing complete!")

        # Return the prediction masks for potential further processing
        return result, filtered_contours
    else:
        print("\nFailed to process the image. Please check the API server logs for more details.")
        return None, None

if __name__ == "__main__":
    # Call main() without unpacking the return value
    main()