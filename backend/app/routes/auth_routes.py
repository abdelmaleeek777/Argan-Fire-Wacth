from flask import Blueprint, request, jsonify,render_template
from app.config import get_db_connection
import hashlib

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        nom = request.form.get("nom")
        prenom = request.form.get("prenom")
        email = request.form.get("email")
        password = request.form.get("password")

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash)
        VALUES (%s, %s, %s, %s)
        """

        cursor.execute(query, (nom, prenom, email, password_hash))
        conn.commit()

        return "Utilisateur créé avec succès"

    return render_template("register.html")



@auth_bp.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        print(email, password)

        return "Connexion réussie"

    return render_template("login.html")