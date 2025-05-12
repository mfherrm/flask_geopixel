import os
import re
import sys
import cv2
import torch
import random
import argparse
import numpy as np
import transformers 
import time
start = time.time()
# Get the absolute path to the directory containing 'fachanwendung's parent
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

# Add the project root to the Python path if it's not already there
if project_root not in sys.path:
    sys.path.append(project_root)

geopixel_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'GeoPixel'))

# Add the GeoPixel directory to the Python path if it's not already there
if geopixel_path not in sys.path:
    sys.path.append(geopixel_path)

model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '...', '...', '...', 'GeoPixel', 'model'))

# Add the GeoPixel directory to the Python path if it's not already there
if model_path not in sys.path:
    sys.path.append(model_path)

# Now you can try to import from GeoPixel.chat
from GeoPixel.chat import parse_args, rgb_color_text  # Make sure rgb_color_text is imported
from model.geopixel import GeoPixelForCausalLM

def get_geopixel_result(args, objects):
    args = parse_args(args)

    os.makedirs(args.vis_save_path, exist_ok=True)

    print(f'initialing tokenizer from: {args.version}')
    tokenizer = transformers.AutoTokenizer.from_pretrained(
        args.version,
        cache_dir=None,
        padding_side='right',
        use_fast=False,
        trust_remote_code=True,
    )
    tokenizer.pad_token = tokenizer.unk_token
    seg_token_idx, bop_token_idx, eop_token_idx = [
        tokenizer(token, add_special_tokens=False).input_ids[0] for token in ['[SEG]','<p>', '</p>']
    ]
   
    kwargs = {"torch_dtype": torch.bfloat16}    
    geo_model_args = {
        "vision_pretrained": 'facebook/sam2-hiera-large',
        "seg_token_idx" : seg_token_idx, # segmentation token index
        "bop_token_idx" : bop_token_idx, # begining of phrase token index
        "eop_token_idx" : eop_token_idx  # end of phrase token index
    }
    
    # Load model 
    print(f'Load model from: {args.version}')
    model = GeoPixelForCausalLM.from_pretrained(
        args.version, 
        low_cpu_mem_usage=True, 
        **kwargs,
        **geo_model_args
    )

    model.config.eos_token_id = tokenizer.eos_token_id
    model.config.bos_token_id = tokenizer.bos_token_id
    model.config.pad_token_id = tokenizer.pad_token_id
    model.tokenizer = tokenizer
    
    model = model.bfloat16().cuda().eval()

    query = f"Please return segmentation masks of all {', '.join(objects)}"
    print(f"Query: {query}")
    #image_path = "./satellite_image.jpg"
    image_path = "./example1-RES.jpg"
    if not os.path.exists(image_path):
        print("File not found in {}".format(image_path))

    image = [image_path]

    print("Looking at ", image)
    # Try with decreasing max_new_tokens values if we encounter sentencepiece errors
    max_tokens = 75 # Start with a higher value
    min_tokens = 5    # Minimum tokens to try
    decrement_step = 10  # Reduce by larger steps initially
    success = False
    evals = time.time()
    
    # Keep track of attempted values to avoid infinite loops
    attempted_values = set()

    while not success and max_tokens >= min_tokens:
        print(f"Failed with {max_tokens} tokens")
        # Skip if we've already tried this value
        if max_tokens in attempted_values:
            max_tokens -= 5
            continue
            
        attempted_values.add(max_tokens)
        
        try:
            print(f"Attempting with {max_tokens} tokens")
            # Reset CUDA cache before each attempt
            torch.cuda.empty_cache()
            
            with torch.autocast(device_type='cuda', dtype=torch.bfloat16):
                response, pred_masks = model.evaluate(tokenizer, query, images = image, max_new_tokens = max_tokens)
            success = True
            print(f"Success with max_new_tokens = {max_tokens}")
        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__
            
            # Log detailed error information
            print(f"Encountered error: {error_type}: {error_msg}")
            
            # Check for known error patterns
            known_error_patterns = [
                "piece id is out of range",  # Exact SentencePiece error
                "piece_id out of range",     # Alternative SentencePiece error format
                "CUDA out of memory",        # GPU memory error
                "index out of range",        # Common indexing error
                "Expected tensor",           # Type error in model
                "dimension out of range"     # Shape mismatch
            ]
            
            is_known_error = any(pattern in error_msg for pattern in known_error_patterns)
            
            if is_known_error or isinstance(e, (RuntimeError, IndexError, ValueError, TypeError)):
                print(f"Recognized error pattern, reducing max_tokens and retrying...")
                
                # Use adaptive reduction strategy
                if max_tokens > 100:
                    # Larger decrements for higher values
                    max_tokens -= decrement_step
                else:
                    # Switch to smaller decrements when getting closer to working values
                    max_tokens -= 5
                
                print(f"Reducing max_tokens to {max_tokens}")
                
                # If we're getting close to known working values, reduce step size
                if max_tokens <= 110 and decrement_step > 1:
                    decrement_step = 1
                    print("Switching to fine-grained decrements")
                
                # Force garbage collection and clear GPU memory
                import gc
                gc.collect()
                torch.cuda.empty_cache()
                
                # If we're still having issues at very low token counts, try a known working value
                if max_tokens < 50 and 100 not in attempted_values:
                    print("Trying known working value: max_tokens=100")
                    max_tokens = 100
            else:
                # If it's a different error that we don't know how to handle, re-raise it
                print(f"Encountered unexpected error type: {error_type}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                raise
    
    # If we couldn't succeed even with minimum tokens, provide a more helpful error message
    if not success:
        error_message = (
            f"Failed to generate response even with minimum tokens ({min_tokens}).\n"
            f"This is likely due to a tokenizer vocabulary mismatch with the model.\n"
            f"Possible solutions:\n"
            f"1. Try setting max_tokens=100 directly (known working value)\n"
            f"2. Check model and tokenizer compatibility\n"
            f"3. Update the model or tokenizer versions to ensure they match\n"
            f"4. Increase GPU memory if available to handle larger context windows"
        )
        print(error_message)
        raise RuntimeError(error_message)

    evale = time.time()
    print("Evaluation finished after", evale-evals)

    try:
        # First check if we have a valid response
        if not response or not isinstance(response, str):
            print(f"Warning: Received invalid response type: {type(response)}")
            print(f"Response content: {response}")
            
        # Then check if we have segmentation masks
        if pred_masks and '[SEG]' in response:
            print("Found segmentation masks in response")
            
            # Validate pred_masks structure
            if not isinstance(pred_masks, list) or len(pred_masks) == 0:
                print(f"Warning: pred_masks has unexpected structure: {type(pred_masks)}")
                print(f"pred_masks content: {pred_masks}")
            else:
                pred_masks = pred_masks[0]
                pred_masks = pred_masks.detach().cpu().numpy()
                pred_masks = pred_masks > 0
                
                # Validate image loading
                image_np = cv2.imread(image_path)
                if image_np is None:
                    print(f"Error: Could not read image from {image_path}")
                    print(f"Current working directory: {os.getcwd()}")
                    print(f"Does file exist? {os.path.exists(image_path)}")
                else:
                    image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
                    
                    save_img = image_np.copy()
                    pattern = r'<p>(.*?)</p>\s*\[SEG\]'
                    matched_text = re.findall(pattern, response)
                    phrases = [text.strip() for text in matched_text]
                    
                    print(f"Found {len(phrases)} phrases and {pred_masks.shape[0]} masks")

                for i in range(pred_masks.shape[0]):
                    mask = pred_masks[i]
                    
                    color = [random.randint(0, 255) for _ in range(3)]
                    if matched_text and i < len(phrases):
                        phrases[i] = rgb_color_text(phrases[i], color[0], color[1], color[2])
                    mask_rgb = np.stack([mask, mask, mask], axis=-1)
                    color_mask = np.array(color, dtype=np.uint8) * mask_rgb

                    save_img = np.where(mask_rgb,
                            (save_img * 0.5 + color_mask * 0.5).astype(np.uint8),
                            save_img)
                
                if matched_text:
                    split_desc = response.split('[SEG]')
                    cleaned_segments = [re.sub(r'<p>(.*?)</p>', '', part).strip() for part in split_desc]
                    reconstructed_desc = ""
                    for i, part in enumerate(cleaned_segments):
                        reconstructed_desc += part + ' '
                        if i < len(phrases):
                            reconstructed_desc += phrases[i] + ' '
                    print(reconstructed_desc)
                else:
                    print(response.replace("\n", "").replace("  ", " "))
                
                save_img = cv2.cvtColor(save_img, cv2.COLOR_RGB2BGR)
                save_path = "{}/{}_masked.jpg".format(
                    args.vis_save_path, image_path.split("/")[-1].split(".")[0]
                    )
                cv2.imwrite(save_path, save_img)
                print("{} has been saved.".format(save_path))
        else:
            print("No segmentation masks found in response")
            print(response.replace("\n", "").replace("  ", " "))
    except Exception as e:
        print(f"Error processing response: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        print(f"Response: {response[:200]}..." if isinstance(response, str) and len(response) > 200 else f"Response: {response}")
        
        # Detailed diagnostics for pred_masks
        if pred_masks is not None:
            print(f"pred_masks type: {type(pred_masks)}")
            if isinstance(pred_masks, list):
                print(f"pred_masks length: {len(pred_masks)}")
                if len(pred_masks) > 0:
                    print(f"pred_masks[0] type: {type(pred_masks[0])}")
                    if hasattr(pred_masks[0], 'shape'):
                        print(f"pred_masks[0] shape: {pred_masks[0].shape}")
            elif hasattr(pred_masks, 'shape'):
                print(f"pred_masks shape: {pred_masks.shape}")

get_geopixel_result([], ['red cars'])
end = time.time()
print("Elapsed time. ", end-start)
