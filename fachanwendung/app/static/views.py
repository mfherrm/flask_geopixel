from flask import Blueprint, render_template, request, jsonify, current_app
import os
import sys 
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np
from flask_cors import CORS
import json
from urllib.parse import urljoin
from .call_geopixel import get_geopixel_result


bp = Blueprint('main', __name__)
CORS(bp, resources={r"/receive": {"origins": "*"}})

IMAGE_FOLDER = 'fachanwendung/app/static/images'  # Define a subfolder within static
if not os.path.exists(IMAGE_FOLDER):
    os.makedirs(IMAGE_FOLDER)

@bp.after_request
def add_cors_headers(response):
    cadenza_uri = current_app.config.get('CADENZA_URI', '')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self' http://localhost:8080 http://localhost:8080/cadenza/; connect-src 'self' http://localhost:8080 http://127.0.0.1:5000;"
    return response

@bp.route('/')
def index():
    return render_template('index.html',
                          cadenza_uri=current_app.config.get('CADENZA_URI'),
                          config=current_app.config)

@bp.route('/receive', methods=['post'])
def receive_image():
    # if 'file' not in request.files:
        # return jsonify({'error': 'No file part'}), 400
    # if 'mapExtent' not in request.form:
        # return jsonify({'error': 'No map bounds'}), 400
    
    # file = request.files['file']
    # mapBounds = json.loads(request.form['mapExtent'])

    # if file.filename == '':
    #     return jsonify({'error': 'No selected file'}), 400
    print(os.path.join(os.getcwd(),"fachanwendung/app/static/images/example1-RES.jpg"))
    img = cv2.imread(os.path.join(os.getcwd(),"fachanwendung/app/static/images/example1-RES.jpg"))

    
    imageDims = img.shape[:2]
    
    try:
        # masks = get_geopixel_result(["--version=MBZUAI/GeoPixel-7B-RES"], ['red cars'])
        outline = np.array([[[[[446, 219]], [[445, 220]], [[443, 220]], [[439, 224]], [[439, 227]], [[438, 228]], [[438, 231]], [[437, 232]], [[437, 247]], [[436, 248]], [[437, 249]], [[437, 262]], [[436, 263]], [[436, 273]], [[435, 274]], [[435, 293]], [[434, 294]], [[434, 312]], [[435, 313]], [[435, 315]], [[438, 318]], [[448, 318]], [[449, 319]], [[465, 319]], [[466, 318]], [[467, 318]], [[469, 316]], [[469, 313]], [[468, 312]], [[468, 304]], [[469, 303]], [[469, 299]], [[468, 298]], [[468, 297]], [[469, 296]], [[469, 286]], [[470, 285]], [[470, 268]], [[471, 267]], [[471, 265]], [[470, 264]], [[471, 263]], [[471, 254]], [[472, 253]], [[472, 250]], [[473, 249]], [[473, 233]], [[472, 232]], [[472, 230]], [[471, 229]], [[471, 226]], [[470, 226]], [[469, 225]], [[468, 225]], [[467, 224]], [[465, 224]], [[461, 220]], [[460, 220]], [[459, 219]]]]])
        # outline = cv2.findContours(masks.astype(np.uint8).squeeze(),cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)
        return jsonify({'message': 'Successfully retrieved outline',
                        'outline': outline[0][0].tolist(),
                        'imageDims':imageDims}), 200
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500
    # if file:
    #     img = np.array(Image.open(file))
    #     try:
    #         img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            # img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # filename = 'satellite_image.jpg'
            # filepath = os.path.join(IMAGE_FOLDER, filename)
            # cv2.imwrite(filepath, img)

            # image_url = urljoin(request.url_root, os.path.join('static/images', filename))
            # get_geopixel_result([])
            

        #     return jsonify({'message': 'Image received and saved successfully',
        #                     'image_url': image_url,
        #                     'mapExtent': mapBounds}), 200
        # except Exception as e:
        #     return jsonify({'error': f'Error processing file: {str(e)}'}), 500

    return jsonify({'error': 'Something went wrong'}), 500