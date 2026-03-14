from flask import Blueprint, jsonify
from app.config import get_db_connection

admin_bp = Blueprint("admin", __name__)


# ===============================
# GET PENDING COOPERATIVES
# ===============================
# GET — toutes les demandes pending
@admin_bp.route("/cooperatives/pending", methods=["GET"])
def get_pending():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.id_cooperative          AS _id,
            c.nom_cooperative         AS name,
            c.region,
            c.siege_social            AS address,
            c.telephone,
            c.zone_name               AS zoneName,
            c.statut,
            c.date_creation           AS createdAt,
            u.nom                     AS ownerLastName,
            u.prenom                  AS ownerFirstName,
            CONCAT(u.prenom,' ',u.nom) AS ownerName,
            u.email                   AS ownerEmail
        FROM cooperatives c
        JOIN utilisateurs u ON c.id_responsable = u.id_utilisateur
        WHERE c.statut = 'pending'
        ORDER BY c.date_creation DESC
    """)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    for r in results:
        if r.get("createdAt"):
            r["createdAt"] = r["createdAt"].isoformat()

    return jsonify(results), 200


# ===============================
# GET ALL COOPERATIVES
# ===============================
@admin_bp.route("/cooperatives", methods=["GET"])
def get_all_cooperatives():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.id_cooperative          AS _id,
            c.nom_cooperative         AS name,
            c.region,
            c.statut,
            c.date_creation           AS createdAt,
            COUNT(cap.id_capteur)     AS sensorCount
        FROM cooperatives c
        LEFT JOIN capteurs cap ON cap.id_zone = c.id_zone
        GROUP BY c.id_cooperative
        ORDER BY c.date_creation DESC
    """)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    for r in results:
        if r.get("createdAt"):
            r["createdAt"] = r["createdAt"].isoformat()

    return jsonify(results), 200

# ===============================
# GET COOPERATIVE DETAILS
# ===============================
@admin_bp.route("/cooperatives/<int:coop_id>", methods=["GET"])
def get_cooperative_details(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch Cooperative & Owner Info
        cursor.execute("""
            SELECT 
                c.id_cooperative          AS _id,
                c.nom_cooperative         AS name,
                c.region,
                c.siege_social            AS address,
                c.telephone               AS phone,
                c.statut                  AS status,
                c.date_creation           AS createdAt,
                CONCAT(u.prenom, ' ', u.nom) AS ownerName,
                u.email                   AS ownerEmail
            FROM cooperatives c
            JOIN utilisateurs u ON c.id_responsable = u.id_utilisateur
            WHERE c.id_cooperative = %s
        """, (coop_id,))
        
        cooperative = cursor.fetchone()
        if not cooperative:
            return jsonify({"message": "Cooperative not found"}), 404
            
        if cooperative.get("createdAt"):
            cooperative["createdAt"] = cooperative["createdAt"].isoformat()

        # Fetch Zones alongside Polygon Geometry
        cursor.execute("""
            SELECT 
                z.id_zone AS _id,
                z.nom_zone AS name,
                z.description,
                ST_AsGeoJSON(z.coordonnees_gps) AS geojson
            FROM zones_forestieres z
            JOIN cooperatives c ON z.id_zone = c.id_zone
            WHERE c.id_cooperative = %s
        """, (coop_id,))
        
        zones = cursor.fetchall()
        
        # Load stringified GeoJSON to dict
        import json
        for z in zones:
            if z.get("geojson"):
                try:
                    z["geojson"] = json.loads(z["geojson"])
                except:
                    pass

        # Fetch Sensors
        cursor.execute("""
            SELECT 
                cap.id_capteur AS _id,
                cap.reference_serie AS uid,
                cap.type_capteur AS type,
                cap.id_zone AS zoneId,
                cap.statut AS status
            FROM capteurs cap
            JOIN cooperatives c ON cap.id_zone = c.id_zone
            WHERE c.id_cooperative = %s
        """, (coop_id,))
        
        sensors = cursor.fetchall()

        # Simulate missing sensor stats like battery/activity (optional based on your db later)
        for s in sensors:
            if s.get("status") == "ACTIF":
                s["status"] = "active"
            else:
                s["status"] = "inactive"
            s["batteryLevel"] = 100 # Default/mock

        return jsonify({
            "cooperative": cooperative,
            "zones": zones,
            "sensors": sensors
        }), 200

    except Exception as e:
        print(f"Detail Fetch Error: {e}")
        return jsonify({"message": "Server error"}), 500

    finally:
        cursor.close()
        conn.close()

# PATCH — approuver
@admin_bp.route("/cooperatives/<int:coop_id>/approve", methods=["PATCH"])
def approve_cooperative(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE cooperatives SET statut = 'approved'
            WHERE id_cooperative = %s
        """, (coop_id,))

        # Approuver aussi l'utilisateur responsable
        cursor.execute("""
            UPDATE utilisateurs u
            JOIN cooperatives c ON c.id_responsable = u.id_utilisateur
            SET u.statut = 'approved'
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        conn.commit()
        return jsonify({"message": "Coopérative approuvée"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# PATCH — rejeter
@admin_bp.route("/cooperatives/<int:coop_id>/reject", methods=["PATCH"])
def reject_cooperative(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE cooperatives SET statut = 'rejected'
            WHERE id_cooperative = %s
        """, (coop_id,))

        cursor.execute("""
            UPDATE utilisateurs u
            JOIN cooperatives c ON c.id_responsable = u.id_utilisateur
            SET u.statut = 'rejected'
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        conn.commit()
        return jsonify({"message": "Coopérative rejetée"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ===============================
# GET ALL COOPERATIVE USERS
# ===============================
@admin_bp.route("/users", methods=["GET"])
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                u.id_utilisateur AS id,
                CONCAT(u.prenom, ' ', u.nom) AS name,
                u.email,
                u.statut AS status,
                u.date_creation AS joinedAt,
                c.nom_cooperative AS cooperative
            FROM utilisateurs u
            LEFT JOIN cooperatives c ON c.id_responsable = u.id_utilisateur
            LEFT JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
            LEFT JOIN roles r ON ur.id_role = r.id_role
            WHERE r.libelle = 'UTILISATEUR_COOP' OR c.id_cooperative IS NOT NULL
            ORDER BY u.date_creation DESC
        """)
        users = cursor.fetchall()

        for u in users:
            if u.get("joinedAt"):
                u["joinedAt"] = u["joinedAt"].isoformat()
            # Normalize status for frontend
            raw = (u.get("status") or "").lower()
            if raw in ["actif", "approved"]:
                u["status"] = "active"
            elif raw in ["inactif", "suspendu", "rejected"]:
                u["status"] = "blocked"
            elif raw == "pending":
                u["status"] = "pending"
            else:
                u["status"] = "active"

        return jsonify(users), 200

    except Exception as e:
        print(f"Users Fetch Error: {e}")
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ===============================
# TOGGLE BLOCK/UNBLOCK USER
# ===============================
@admin_bp.route("/users/<int:user_id>/toggle-block", methods=["PATCH"])
def toggle_block_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT statut FROM utilisateurs WHERE id_utilisateur = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404

        current = user["statut"]
        if current in ["INACTIF", "SUSPENDU"]:
            new_status = "approved"
        else:
            new_status = "INACTIF"

        cursor.execute(
            "UPDATE utilisateurs SET statut = %s WHERE id_utilisateur = %s",
            (new_status, user_id)
        )
        conn.commit()
        return jsonify({"message": f"User status changed to {new_status}"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ===============================
# DELETE USER
# ===============================
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Delete cooperatives first (FK constraint)
        cursor.execute("DELETE FROM cooperatives WHERE id_responsable = %s", (user_id,))
        # Delete role assignments
        cursor.execute("DELETE FROM utilisateurs_roles WHERE id_utilisateur = %s", (user_id,))
        # Delete user
        cursor.execute("DELETE FROM utilisateurs WHERE id_utilisateur = %s", (user_id,))

        conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        print(f"Delete User Error: {e}")
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
