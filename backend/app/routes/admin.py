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
    print("RESULTS:", results)
    cursor.close()
    conn.close()

    for r in results:
        if r.get("createdAt"):
            r["createdAt"] = r["createdAt"].isoformat()

    return jsonify(results), 200


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


@admin_bp.route("/cooperatives", methods=["GET"])
def get_all_cooperatives():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.id_cooperative AS _id,
            c.nom_cooperative AS name,
            c.region,
            c.statut AS status,
            c.date_creation AS createdAt,
            COUNT(cap.id_capteur) AS sensorCount
        FROM cooperatives c
        LEFT JOIN zones_forestieres z
            ON z.nom_zone = c.zone_name
        LEFT JOIN capteurs cap
            ON cap.id_zone = z.id_zone
        GROUP BY c.id_cooperative
    """)

    cooperatives = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(cooperatives)

@admin_bp.route("/cooperatives/<int:coop_id>", methods=["GET"])
def get_cooperative_detail(coop_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ Cooperative info
        cursor.execute("""
            SELECT 
                c.id_cooperative AS _id,
                c.nom_cooperative AS name,
                c.region,
                c.siege_social AS address,
                c.telephone AS phone,
                c.statut AS status,
                c.date_creation AS createdAt,
                c.zone_name,
                CONCAT(u.prenom, ' ', u.nom) AS ownerName,
                u.email AS ownerEmail
            FROM cooperatives c
            JOIN utilisateurs u 
            ON c.id_responsable = u.id_utilisateur
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        cooperative = cursor.fetchone()

        if not cooperative:
            return {"message": "Cooperative not found"}, 404

        if cooperative.get("createdAt"):
            cooperative["createdAt"] = cooperative["createdAt"].isoformat()

        zone_name = cooperative["zone_name"]

        # 2️⃣ Zones de cette coopérative
        cursor.execute("""
            SELECT 
                id_zone AS _id,
                nom_zone AS name,
                description
            FROM zones_forestieres
            WHERE nom_zone = %s
        """, (zone_name,))

        zones = cursor.fetchall()

        # 3️⃣ Sensors dans ces zones
        cursor.execute("""
            SELECT 
                c.id_capteur AS _id,
                c.reference_serie AS uid,
                c.id_zone AS zoneId,
                c.statut AS status
            FROM capteurs c
            JOIN zones_forestieres z
            ON c.id_zone = z.id_zone
            WHERE z.nom_zone = %s
        """, (zone_name,))

        sensors = cursor.fetchall()

        return jsonify({
            "cooperative": cooperative,
            "zones": zones,
            "sensors": sensors
        }), 200

    except Exception as e:
        print("Error:", e)
        return {"message": "Internal server error"}, 500

    finally:
        cursor.close()
        conn.close()


@admin_bp.route("/users", methods=["GET"])
def get_users():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            u.id_utilisateur AS id,
            CONCAT(u.prenom,' ',u.nom) AS name,
            u.email,
            u.statut AS status,
            c.nom_cooperative AS cooperative,
            u.date_creation AS joinedAt
        FROM utilisateurs u

        JOIN utilisateurs_roles ur
            ON u.id_utilisateur = ur.id_utilisateur

        LEFT JOIN cooperatives c
            ON u.id_utilisateur = c.id_responsable

        WHERE ur.id_role = 3

        ORDER BY u.date_creation DESC
    """)

    users = cursor.fetchall()

    for u in users:
        if u.get("joinedAt"):
            u["joinedAt"] = u["joinedAt"].strftime("%b %d, %Y")

    cursor.close()
    conn.close()

    return jsonify(users)


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM utilisateurs
        WHERE id_utilisateur = %s
    """, (user_id,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "User deleted"})


@admin_bp.route("/stats", methods=["GET"])
def get_admin_stats():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # total cooperatives
    cursor.execute("SELECT COUNT(*) AS total FROM cooperatives")
    total_cooperatives = cursor.fetchone()["total"]

    # pending approvals
    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM cooperatives 
        WHERE statut = 'EN_ATTENTE'
    """)
    pending = cursor.fetchone()["total"]

    # active sensors
    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM capteurs 
        WHERE statut = 'ACTIF'
    """)
    active_sensors = cursor.fetchone()["total"]

    # total owners (role 3)
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM utilisateurs_roles
        WHERE id_role = 3
    """)
    owners = cursor.fetchone()["total"]

    # active alerts
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM alertes
        WHERE statut = 'ACTIVE'
    """)
    alerts = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "totalCooperatives": total_cooperatives,
        "pendingApprovals": pending,
        "activeSensors": active_sensors,
        "totalOwners": owners,
        "activeAlerts": alerts
    })