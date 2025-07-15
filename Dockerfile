FROM python:3.10-slim

# Install system dependencies for OpenCV and PostgreSQL
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgthread-2.0-0 \
    libfontconfig1 \
    libgtk-3-0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Set environment variables for Flask
ENV FLASK_APP=fachanwendung/run.py
ENV FLASK_ENV=production

# Run the application
CMD ["python3", "-c", "import sys; sys.path.insert(0, '.'); from fachanwendung.app import create_app; app = create_app(); app.run(host='0.0.0.0', port=5000, debug=False)"]