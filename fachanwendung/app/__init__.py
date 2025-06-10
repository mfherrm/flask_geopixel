from flask import Flask
import os
from .config import Config

def create_app():
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
    app.register_blueprint(views.bp)

    return app