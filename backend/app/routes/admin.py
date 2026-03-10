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
