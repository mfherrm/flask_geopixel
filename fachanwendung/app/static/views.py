from flask import Blueprint, render_template, request, jsonify
import os
from werkzeug.utils import secure_filename

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/geopixel')
def geopixel_input():
    print("HOLA")
    return render_template('index.html')

@bp.route('/receive', methods=['post'])
def receive_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.getcwd().replace("\\", "/")
        try:
            print(filepath)
            file.save(filepath)
            return jsonify({'message': 'Image received and saved successfully', 'filepath': filepath}), 200
        except Exception as e:
            return jsonify({'error': f'Error saving file: {str(e)}'}), 500
    return jsonify({'error': 'Something went wrong'}), 500


    return render_template('index.html')