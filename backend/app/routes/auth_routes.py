from flask import Blueprint, request, render_template, redirect, url_for, session,jsonify
from app.config import get_db_connection
import hashlib
import json

auth_bp = Blueprint("auth", __name__)


# =========================
# REGISTER
# =========================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    nom = data.get("nom")
    prenom = data.get("prenom")
    email = data.get("email")
    password = data.get("password")
    coop_name = data.get("coopName")
    region = data.get("region")
    address = data.get("address")
    phone = data.get("phone")
    zone_name = data.get("zoneName")
    polygon = data.get("polygon")

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ créer utilisateur
        cursor.execute("""
            INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, statut)
            VALUES (%s, %s, %s, %s, 'pending')
        """, (nom, prenom, email, password_hash))

        user_id = cursor.lastrowid

        # 2️⃣ ajouter rôle Cooperative Owner
        cursor.execute("""
            INSERT INTO utilisateurs_roles (id_utilisateur, id_role)
            VALUES (%s, %s)
        """, (user_id, 3))

        # 3️⃣ créer coopérative
        cursor.execute("""
            INSERT INTO cooperatives 
                (nom_cooperative, siege_social, email_contact, telephone, region, zone_name, polygon, id_responsable, statut)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
        """, (
            coop_name,
            address,
            email,
            phone,
            region,
            zone_name,
            json.dumps(polygon),
            user_id
        ))

        conn.commit()
        return jsonify({"message": "Demande envoyée avec succès"}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": f"Erreur: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()
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
        if user["statut"] != "approved":
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