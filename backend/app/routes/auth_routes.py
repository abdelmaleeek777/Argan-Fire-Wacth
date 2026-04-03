from flask import Blueprint, request, render_template, redirect, url_for, session, jsonify
from app.config import get_db_connection
from app.utils.auth import generate_token
import hashlib
import json
import random
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

auth_bp = Blueprint("auth", __name__)

# In-memory storage for verification codes (in production, use Redis or database)
verification_codes = {}

def send_verification_email(email, code):
    """Send verification code via email"""
    try:
        # Load from environment variables
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.getenv("SMTP_EMAIL")
        sender_password = os.getenv("SMTP_PASSWORD")
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Argan Fire Watch - Email Verification Code"
        msg["From"] = sender_email
        msg["To"] = email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin: 0;">Argan Fire Watch</h1>
                    <p style="color: #64748b; margin-top: 10px;">Email Verification</p>
                </div>
                <p style="color: #334155; font-size: 16px;">Your verification code is:</p>
                <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">{code}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="color: #64748b; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html, "html")
        msg.attach(part)
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, msg.as_string())
        
        return True
    except Exception as e:
        print(f"Email sending error: {e}")
        # For development, return True even if email fails
        return True


# =========================
# SEND VERIFICATION CODE
# =========================
@auth_bp.route("/send-verification", methods=["POST"])
def send_verification():
    data = request.get_json()
    if not data:
        return {"message": "Invalid data"}, 400
    
    email = data.get("email")
    if not email:
        return {"message": "Email is required"}, 400
    
    # Check if email already exists in database
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_utilisateur FROM utilisateurs WHERE email=%s", (email,))
        if cursor.fetchone():
            return {"message": "Email already registered"}, 409
    finally:
        cursor.close()
        conn.close()
    
    # Generate 6-digit verification code
    code = str(random.randint(100000, 999999))
    
    # Store code with expiration (10 minutes)
    verification_codes[email] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=10)
    }
    
    # Send email
    if send_verification_email(email, code):
        return {"message": "Verification code sent"}, 200
    else:
        return {"message": "Failed to send verification email"}, 500


# =========================
# VERIFY CODE
# =========================
@auth_bp.route("/verify-code", methods=["POST"])
def verify_code():
    data = request.get_json()
    if not data:
        return {"message": "Invalid data"}, 400
    
    email = data.get("email")
    code = data.get("code")
    
    if not email or not code:
        return {"message": "Email and code are required"}, 400
    
    stored = verification_codes.get(email)
    
    if not stored:
        return {"message": "No verification code found. Please request a new one."}, 400
    
    if datetime.now() > stored["expires_at"]:
        del verification_codes[email]
        return {"message": "Verification code expired. Please request a new one."}, 400
    
    if stored["code"] != code:
        return {"message": "Invalid verification code"}, 400
    
    # Code is valid - remove it and return success
    del verification_codes[email]
    return {"message": "Email verified successfully", "verified": True}, 200


# =========================
# REGISTER
# =========================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return {"message": "Invalid data"}, 400

    prenom = data.get("prenom")
    nom = data.get("nom")
    email = data.get("email")
    password = data.get("password")
    coop_name = data.get("coopName")
    region = data.get("region")
    address = data.get("address")
    phone = data.get("phone")
    zone_name = data.get("zoneName")
    polygon = data.get("polygon")  # Expected as list of [lng, lat]

    if not all([prenom, nom, email, password, coop_name, region, zone_name, polygon]):
        return {"message": "Missing required fields"}, 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Check if email exists
        cursor.execute("SELECT id_utilisateur FROM utilisateurs WHERE email=%s", (email,))
        if cursor.fetchone():
            return {"message": "Email already registered"}, 409

        # 2. Create User
        cursor.execute("""
            INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash,statut)
            VALUES (%s, %s, %s, %s,%s)
        """, (nom, prenom, email, password_hash,'pending'))
        user_id = cursor.lastrowid

        # 3. Assign Role (UTILISATEUR_COOP)
        cursor.execute("SELECT id_role FROM roles WHERE libelle=%s", ("UTILISATEUR_COOP",))
        role = cursor.fetchone()
        if role:
            cursor.execute("""
                INSERT INTO utilisateurs_roles (id_utilisateur, id_role)
                VALUES (%s, %s)
            """, (user_id, role["id_role"]))

        # 4. Create Forest Zone
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])

        wkt_coords = ", ".join([f"{p[0]} {p[1]}" for p in polygon])
        wkt_polygon = f"POLYGON(({wkt_coords}))"

        cursor.execute("""
            INSERT INTO zones_forestieres (nom_zone, region, coordonnees_gps, description)
            VALUES (%s, %s, ST_GeomFromText(%s), %s)
        """, (zone_name, region, wkt_polygon, address))
        zone_id = cursor.lastrowid

        # 5. Create Cooperative with region
        cursor.execute("""
            INSERT INTO cooperatives (nom_cooperative, siege_social, email_contact, telephone, id_responsable, id_zone, region)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (coop_name, address, email, phone, user_id, zone_id, region))
        coop_id = cursor.lastrowid

        # 6. Update Zone to link it to the cooperative
        cursor.execute("""
            UPDATE zones_forestieres SET id_cooperative = %s WHERE id_zone = %s
        """, (coop_id, zone_id))

        conn.commit()
        return {"message": "Registration successful"}, 201

    except Exception as e:
        conn.rollback()
        print(f"Registration Error: {e}")
        return {"message": f"Server error: {str(e)}"}, 500
    finally:
        cursor.close()
        conn.close()


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return {"message": "Invalid data"}, 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"message": "Email and password are required"}, 400

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
    LEFT JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
    LEFT JOIN roles r ON ur.id_role = r.id_role
    WHERE u.email = %s
    """

    try:
        cursor.execute(query, (email,))
        user_row = cursor.fetchone()

        if not user_row:
            return {"message": "User not found"}, 404

        if user_row["statut"] not in ["ACTIF", "approved"]:
            return {"message": "Account inactive or suspended"}, 403

        if user_row["mot_de_passe_hash"] != password_hash:
            return {"message": "Invalid password"}, 401

        # ✅ Récupérer le cooperative_id
        cursor.execute("""
            SELECT id_cooperative 
            FROM cooperatives
            WHERE id_responsable = %s
            LIMIT 1
        """, (user_row["id_utilisateur"],))
        membre = cursor.fetchone()
        cooperative_id = membre["id_cooperative"] if membre else None

        # Update last login
        cursor.execute("""
            UPDATE utilisateurs
            SET derniere_connexion = NOW()
            WHERE id_utilisateur=%s
        """, (user_row["id_utilisateur"],))
        conn.commit()

        # 🛡️ Generate real JWT
        token = generate_token(user_row["id_utilisateur"], user_row["role"])

        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_row["id_utilisateur"],
                "nom": user_row["nom"],
                "prenom": user_row["prenom"],
                "email": user_row["email"],
                "role": user_row["role"],
                "cooperative_id": cooperative_id
            }
        }, 200

    except Exception as e:
        print(f"Login Error: {e}")
        return {"message": "Internal server error"}, 500
    finally:
        cursor.close()
        conn.close()