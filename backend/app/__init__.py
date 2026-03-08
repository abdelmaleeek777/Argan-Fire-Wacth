from flask import Flask
from app.routes.auth_routes import auth_bp

def create_app():

    app = Flask(__name__, template_folder="../../frontend/templates")

    app.secret_key = "arganfirewatch"

    from app.routes.auth_routes import auth_bp
    from app.routes.mesures_routes import mesures_bp


    app.register_blueprint(mesures_bp)
    app.register_blueprint(auth_bp)

    return app