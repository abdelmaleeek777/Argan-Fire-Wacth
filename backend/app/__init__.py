import os

from flask import Flask
from flask_cors import CORS

from .config import config_by_name


def create_app():
    """Application factory — creates and configures the Flask app."""
    env = os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[env])

    # Enable CORS so the frontend can talk to this API
    CORS(app)

    # ------------------------------------------------------------------
    # Register blueprints
    # ------------------------------------------------------------------
    from .routes.sensors import sensors_bp
    from .routes.alerts import alerts_bp
    from .routes.propagation import propagation_bp
    from .routes.dashboard import dashboard_bp
    from .routes.logs import logs_bp

    app.register_blueprint(sensors_bp, url_prefix="/sensors")
    app.register_blueprint(alerts_bp, url_prefix="/alerts")
    app.register_blueprint(propagation_bp, url_prefix="/propagation")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(logs_bp, url_prefix="/logs")

    # Root health-check
    @app.route("/")
    def index():
        from flask import jsonify
        return jsonify({"message": "Argan Fire Watch API is running"}), 200

    return app
