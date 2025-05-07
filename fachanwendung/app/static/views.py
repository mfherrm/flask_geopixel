from flask import Blueprint, render_template, request, jsonify
import os
import sys 
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np
from flask_cors import CORS
import json
from urllib.parse import urljoin
# from .call_geopixel import get_geopixel_result


bp = Blueprint('main', __name__)
CORS(bp, resources={r"/receive": {"origins": "*"}})

IMAGE_FOLDER = 'fachanwendung/app/static/images'  # Define a subfolder within static
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)

@bp.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/receive', methods=['post'])
def receive_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    if 'mapExtent' not in request.form:
        return jsonify({'error': 'No map bounds'}), 400
    
    file = request.files['file']
    mapBounds = json.loads(request.form['mapExtent'])

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        img = np.array(Image.open(file))
        try:
            #img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            filename = 'satellite_image.jpg'
            filepath = os.path.join(IMAGE_FOLDER, filename)
            cv2.imwrite(filepath, img)

            image_url = urljoin(request.url_root, os.path.join('static/images', filename))
            # get_geopixel_result([])
            

            return jsonify({'message': 'Image received and saved successfully',
                            'image_url': image_url,
                            'mapExtent': mapBounds}), 200
        except Exception as e:
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500

    return jsonify({'error': 'Something went wrong'}), 500