from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    app.secret_key = "arganfirewatch"
    app.config["JWT_SECRET_KEY"] = "arganfirewatch"
    jwt=JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
       return jsonify({"error": "Token expiré, veuillez vous reconnecter"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
       return jsonify({"error": "Token invalide"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
       return jsonify({"error": "Token manquant"}), 401



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