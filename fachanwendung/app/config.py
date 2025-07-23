# Implement the configuration of the app
from os import environ as env

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = env.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database connection details (individual components)
    DB_HOST = env.get('DB_HOST')
    DB_PORT = env.get('DB_PORT')
    DB_NAME = env.get('DB_NAME')
    DB_USER = env.get('DB_USER')
    DB_PASSWORD = env.get('DB_PASSWORD')
    
    # Flask configuration
    FLASK_ENV = env.get('FLASK_ENV')
    FLASK_HOST = env.get('FLASK_HOST')
    FLASK_PORT = env.get('FLASK_PORT')
    FLASK_DEBUG = env.get('FLASK_DEBUG')
    
    # Cadenza API configuration
    CADENZA_API_URL = env.get('CADENZA_API_URL')