from flask import Flask
from flask_cors import CORS

def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")
    CORS(app) # Enable CORS for all routes

    app.secret_key = "arganfirewatch"


    from app.routes.auth_routes import auth_bp
    from app.routes.mesures_routes import mesures_bp
    from app.routes.admin import admin_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.sensors import sensors_bp
    from app.routes.alerts import alerts_bp

    app.register_blueprint(mesures_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(sensors_bp)
    app.register_blueprint(alerts_bp)
    return app