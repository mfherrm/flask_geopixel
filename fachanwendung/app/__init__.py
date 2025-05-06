from flask import Flask
import os
print(os.getcwd())
def create_app():
    app = Flask(__name__, template_folder='templates')
    print("Template folder:", app.template_folder)
    from .static import views
    app.register_blueprint(views.bp)

    return app