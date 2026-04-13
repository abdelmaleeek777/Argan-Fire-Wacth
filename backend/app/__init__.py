from flask import Flask, request, make_response
from flask_cors import CORS
import os
from collections import defaultdict
import time

# Simple in-memory rate limiter (IP -> [(timestamp, count)])
RATE_LIMIT_STORE = defaultdict(list)
RATE_LIMIT_REQUESTS = 10  # max 10 requests
RATE_LIMIT_WINDOW = 300   # per 5 minutes (300 seconds)


def check_rate_limit(ip_address):
    """Check if IP has exceeded rate limit. Returns (allowed, remaining)."""
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW
    
    # Clean old entries
    RATE_LIMIT_STORE[ip_address] = [ts for ts in RATE_LIMIT_STORE[ip_address] if ts > cutoff]
    
    current_count = len(RATE_LIMIT_STORE[ip_address])
    if current_count >= RATE_LIMIT_REQUESTS:
        return False, 0
    
    # Record this request
    RATE_LIMIT_STORE[ip_address].append(now)
    remaining = RATE_LIMIT_REQUESTS - current_count - 1
    return True, remaining


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
    
    # Store app-level rate limiter for use in routes
    app.check_rate_limit = check_rate_limit
    
    return app