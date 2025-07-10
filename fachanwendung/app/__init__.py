from flask import Flask
import os
from .config import Config

def create_app(persistent_data=False):
    # Load environment variables from .env file if it exists
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    app = Flask(__name__, template_folder='templates')
    app.config.from_object(Config)
    
    from .static import views
    from . import runpod
    
    app.register_blueprint(views.bp)
    app.register_blueprint(runpod.runpod_bp)

    # Initialize database on startup with persistence setting
    from .database import initialize_database
    with app.app_context():
        initialize_database(clear_data=not persistent_data)

    return app