from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    CORS(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.sensors import sensors_bp
    from app.routes.alerts import alerts_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.admin import admin_bp
    from app.routes.propagation import propagation_bp
    from app.routes.logs import logs_bp

    app.register_blueprint(auth_bp,        url_prefix="/auth")
    app.register_blueprint(sensors_bp,     url_prefix="/sensors")
    app.register_blueprint(alerts_bp,      url_prefix="/alerts")
    app.register_blueprint(dashboard_bp,   url_prefix="/cooperative")
    app.register_blueprint(admin_bp,       url_prefix="/admin")
    app.register_blueprint(propagation_bp, url_prefix="/propagation")
    app.register_blueprint(logs_bp,        url_prefix="/logs")

    return app