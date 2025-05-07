import os
import re
import sys
import cv2
import torch
import random
import argparse
import numpy as np
import transformers 
import PIL
import torchvision as tv

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
from GeoPixel.chat import parse_args
from model.geopixel import GeoPixelForCausalLM

args = []
objects = "bridges"
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
print(os.path.join("./satellite_image.jpg"))
image_path = "./satellite_image.jpg"
if not os.path.exists(image_path):
    print("File not found in {}".format(image_path))

image = [image_path]

with torch.autocast(device_type='cuda', dtype=torch.bfloat16):
    response, pred_masks = model.evaluate(tokenizer, query, images = image, max_new_tokens = 300)