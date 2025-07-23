#!/usr/bin/env python3
"""
Production WSGI entry point for Flask GeoPixel application
Optimized for high-performance tile processing
"""

import os
import sys
from fachanwendung.app import create_app

# Configuration for database persistence
# Set to True to keep existing data on startup, False to clear all tables
persistData = False

# Create the Flask application instance
application = create_app(persistent_data=persistData)

# For debugging in production (remove in final deployment)
if __name__ == "__main__":
    # Fallback to development server if run directly
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print("⚠️  Running with development server. Use Gunicorn for production!")
    application.run(host=host, port=port, debug=debug)