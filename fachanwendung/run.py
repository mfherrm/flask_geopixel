import sys
import os

from app import create_app # type: ignore

# Configuration for database persistence
# Set to True to keep existing data on startup, False to clear all tables
persistData = False

app = create_app(persistent_data=persistData)

if __name__ == '__main__':
    # Use environment variables for Docker compatibility
    host = os.environ.get('FLASK_HOST')
    port = int(os.environ.get('FLASK_PORT'))
    debug = os.environ.get('FLASK_DEBUG').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)