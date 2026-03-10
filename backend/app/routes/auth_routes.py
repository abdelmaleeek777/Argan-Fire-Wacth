from flask import Blueprint, request, render_template, redirect, url_for, session
from app.config import get_db_connection
import hashlib

auth_bp = Blueprint("auth", __name__)


# =========================
# REGISTER
# =========================
@auth_bp.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        nom = request.form.get("nom")
        prenom = request.form.get("prenom")
        email = request.form.get("email")
        password = request.form.get("password")

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # vérifier si email existe
        cursor.execute("SELECT id_utilisateur FROM utilisateurs WHERE email=%s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            return "Email déjà utilisé"

        # créer utilisateur
        cursor.execute("""
        INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash)
        VALUES (%s,%s,%s,%s)
        """, (nom, prenom, email, password_hash))

        conn.commit()

        user_id = cursor.lastrowid

        # récupérer le rôle COOPERATIVE dynamiquement
        cursor.execute("SELECT id_role FROM roles WHERE libelle=%s", ("UTILISATEUR_COOP",))
        role = cursor.fetchone()

        if role:
            cursor.execute("""
            INSERT INTO utilisateurs_roles (id_utilisateur, id_role)
            VALUES (%s,%s)
            """, (user_id, role["id_role"]))

        conn.commit()

        cursor.close()
        conn.close()

        return redirect(url_for("auth.login"))

    return render_template("register.html")


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        password_hash = hashlib.sha256(password.encode()).hexdigest()

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT u.id_utilisateur,
               u.nom,
               u.prenom,
               u.email,
               u.mot_de_passe_hash,
               u.statut,
               r.libelle AS role
        FROM utilisateurs u
        JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
        JOIN roles r ON ur.id_role = r.id_role
        WHERE u.email = %s
        """

        cursor.execute(query, (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return "Utilisateur introuvable"

        # vérifier statut
        if user["statut"] != "ACTIF":
            cursor.close()
            conn.close()
            return "Compte inactif ou suspendu"

        # vérifier mot de passe
        if user["mot_de_passe_hash"] != password_hash:
            cursor.close()
            conn.close()
            return "Mot de passe incorrect"

        # mettre à jour dernière connexion
        cursor.execute("""
        UPDATE utilisateurs
        SET derniere_connexion = NOW()
        WHERE id_utilisateur=%s
        """, (user["id_utilisateur"],))

        conn.commit()

        # session utilisateur
        session["user_id"] = user["id_utilisateur"]
        session["role"] = user["role"]

        cursor.close()
        conn.close()

        # redirection selon rôle
        if user["role"] == "ADMIN":
            return "Bienvenue Admin"

        if user["role"] == "UTILISATEUR_COOP":
            return "Bienvenue Responsable Coopérative"
        if user["role"] == "POMPIER":
            return "Bienvenue POMPIER"

        return "Rôle non autorisé"

    return render_template("login.html")