import os
import sys
import time
import torch
import argparse
import gc
from call_geopixel import get_geopixel_result

def check_image_exists(image_path):
    """
    Check if the image exists and print helpful information if it doesn't.
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        bool: True if the image exists, False otherwise
    """
    if os.path.exists(image_path):
        print(f"Image found: {image_path}")
        return True
    
    print(f"ERROR: Image not found at {image_path}")
    
    # Try to list files in the directory to help debugging
    try:
        image_dir = os.path.dirname(image_path)
        if os.path.exists(image_dir):
            print(f"Files in {image_dir}:")
            for file in os.listdir(image_dir):
                print(f"  - {file}")
        else:
            print(f"Directory {image_dir} does not exist")
            
            # Try to create the directory
            try:
                os.makedirs(image_dir, exist_ok=True)
                print(f"Created directory: {image_dir}")
            except Exception as e:
                print(f"Failed to create directory: {str(e)}")
    except Exception as e:
        print(f"Error listing directory: {str(e)}")
    
    return False

def run_test(model_version, objects):
    """
    Run a test of the GeoPixel model with optimizations.
    
    Args:
        model_version (str): The model version to use
        objects (list): List of objects to detect
    """
    print(f"\n===== Testing GeoPixel with optimizations =====\n")
    
    try:
        # Record start time
        start_time = time.time()
        
        # Get the image path
        image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "images", "example1-RES.jpg"))
        print(f"Image path: {image_path}")
        
        # Check if the image exists
        if not check_image_exists(image_path):
            print("Cannot proceed without the image file")
            return None, 0, 0
        
        # Get GPU memory usage before running
        memory_before = 0
        if torch.cuda.is_available():
            try:
                torch.cuda.synchronize()
                memory_before = torch.cuda.memory_allocated() / (1024 ** 3)  # Convert to GB
                print(f"GPU Memory Usage Before: {memory_before:.2f} GB")
            except Exception as e:
                print(f"Error getting GPU memory usage: {str(e)}")
        else:
            print("CUDA is not available. Running on CPU.")
        
        # Run the model
        print(f"\nRunning model with objects: {', '.join(objects)}")
        args = [f"--version={model_version}"]
        masks = get_geopixel_result(args, objects)
        
        if masks is None:
            print("WARNING: Model returned None for masks")
        
        # Get GPU memory usage after running
        memory_after = 0
        if torch.cuda.is_available():
            try:
                torch.cuda.synchronize()
                memory_after = torch.cuda.memory_allocated() / (1024 ** 3)  # Convert to GB
                print(f"GPU Memory Usage After: {memory_after:.2f} GB")
                print(f"Memory Change: {memory_after - memory_before:.2f} GB")
            except Exception as e:
                print(f"Error getting GPU memory usage: {str(e)}")
        
        # Record end time and calculate duration
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\nTotal execution time: {duration:.2f} seconds")
        print(f"Test completed with optimizations")
        
        return duration, memory_before, memory_after
    
    except Exception as e:
        print(f"ERROR: Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, 0, 0

def main():
    try:
        parser = argparse.ArgumentParser(description="Test GeoPixel with optimizations")
        parser.add_argument("--model", default="MBZUAI/GeoPixel-7B-RES", help="Model version to use")
        parser.add_argument("--objects", default="red cars", help="Objects to detect (comma-separated)")
        parser.add_argument("--debug", action="store_true", help="Enable debug mode with extra logging")
        args = parser.parse_args()
        
        if args.debug:
            print("Debug mode enabled")
            print(f"Python version: {sys.version}")
            print(f"PyTorch version: {torch.__version__}")
            if torch.cuda.is_available():
                print(f"CUDA version: {torch.version.cuda}")
                print(f"GPU: {torch.cuda.get_device_name(0)}")
        
        objects = [obj.strip() for obj in args.objects.split(",")]
        
        # Clear memory before starting
        print("Clearing memory before starting...")
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Run the test
        result = run_test(args.model, objects)
        
        if result[0] is None:
            print("\nTest failed to complete successfully")
            sys.exit(1)
        else:
            print("\nTest completed successfully")
    
    except Exception as e:
        print(f"ERROR: An unexpected error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()