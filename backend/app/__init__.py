from flask import Flask
from flask_cors import CORS

def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    app.secret_key = "arganfirewatch"


    from app.routes.auth_routes import auth_bp
    from app.routes.mesures_routes import mesures_bp
    from app.routes.admin import admin_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.sensors import sensors_bp
    from app.routes.alerts import alerts_bp
    from app.routes.zones import zones_bp
    from app.routes.pompier import pompier_bp
    from app.routes.cooperative_routes import coop_bp

    app.register_blueprint(mesures_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(sensors_bp, url_prefix='/api')
    app.register_blueprint(alerts_bp, url_prefix='/api')
    app.register_blueprint(zones_bp, url_prefix='/api')
    app.register_blueprint(pompier_bp, url_prefix='/api')
    app.register_blueprint(coop_bp, url_prefix='/api')
    return app