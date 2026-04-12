from flask import Flask, request, make_response
from flask_cors import CORS
import os


def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")
    
    # Configure CORS properly - no wildcard with credentials
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    CORS(app, 
         resources={r"/api/*": {"origins": allowed_origins}}, 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])

    app.secret_key = os.getenv("FLASK_SECRET_KEY", "arganfirewatch-default")

    # Global OPTIONS handler for CORS preflight
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin", allowed_origins[0]))
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Remove Server header to avoid exposing framework version
        if "Server" in response.headers:
            del response.headers["Server"]
        return response

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