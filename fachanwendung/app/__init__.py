from flask import Flask
import os
from .config import Config

def create_app():
    app = Flask(__name__, template_folder='templates')
    app.config.from_object(Config)
    
    from .static import views
    app.register_blueprint(views.bp)

    return app