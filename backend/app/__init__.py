from flask import Flask
from flask_cors import CORS
from app.routes.auth_routes import auth_bp
from app.routes.admin import admin_bp
from app.routes.mesures_routes import mesures_bp

def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")
    CORS(app) # Enable CORS for all routes

    app.secret_key = "arganfirewatch"

    app.register_blueprint(mesures_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix="/admin")

    return app