# Implement the configuration of the app
from os import environ as env

class Config:
    # Database configuration
    SECRET_KEY = env.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = env.get('DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CADENZA_URI = env.get('CADENZA_URI')
    CADENZA_REPOSITORY_NAME = env.get('CADENZA_REPOSITORY_NAME')
    CADENZA_EXTERNAL_LINK_ID = env.get('CADENZA_EXTERNAL_LINK_ID')
    
    # GeoPixel API configuration
    GEOPIXEL_API_URL = env.get('GEOPIXEL_API_URL')
    RUNPOD_API_KEY = env.get('RUNPOD_API_KEY')