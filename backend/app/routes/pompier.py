# app/routes/pompier.py
from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from flask_jwt_extended import jwt_required, get_jwt_identity

pompier_bp = Blueprint("pompier", __name__)


# ── GET /api/dashboard/pompier/stats ─────────────────────────
@pompier_bp.route("/dashboard/pompier/stats", methods=["GET"])
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        user_id = request.args.get("user_id")  # ou JWT plus tard

        cursor.execute("""
    SELECT COUNT(*) AS count
    FROM alertes a
    JOIN alertes_utilisateurs au ON a.id_alerte = au.id_alerte
    WHERE 
        au.id_utilisateur = %s
        AND a.statut IN ('ACTIVE', 'OUVERTE')
""", (user_id,))

        alertes_actives = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) AS count FROM incendies WHERE statut_incendie != 'ETEINT'")
        incendies = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(DISTINCT id_zone) AS count FROM incendies WHERE statut_incendie != 'ETEINT'")
        zones = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count 
            FROM utilisateurs u
            JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
            JOIN roles r ON ur.id_role = r.id_role
            WHERE r.libelle = 'POMPIER'
            AND u.statut = 'ACTIF'
        """)
        pompiers_dispo = cursor.fetchone()["count"]

        return jsonify({
            "alertesActives": alertes_actives,
            "incendiesEnCours": incendies,
            "pompiersDisponibles": pompiers_dispo,
            "zonesSurveillees": zones
        }), 200

    except Exception as e:
        print("❌ ERROR get_dashboard_stats:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/dashboard/pompier/incendies ─────────────────────
@pompier_bp.route("/dashboard/pompier/incendies", methods=["GET"])
def get_incendies_carte():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte AS id_incendie,
                a.niveau_gravite AS niveau,
                z.nom_zone,
                AVG(c.latitude) AS lat,
                AVG(c.longitude) AS lng
            FROM alertes a
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            JOIN capteurs c ON c.id_zone = z.id_zone
            WHERE a.statut IN ('ACTIVE', 'OUVERTE')
            GROUP BY a.id_alerte, a.niveau_gravite, z.nom_zone
            ORDER BY a.date_creation DESC
        """)
        return jsonify(cursor.fetchall()), 200

    except Exception as e:
        print("❌ ERROR get_incendies_carte:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/dashboard/pompier/alertes-critiques ─────────────
@pompier_bp.route("/dashboard/pompier/alertes-critiques", methods=["GET"])
def get_alertes_critiques():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte,
                z.nom_zone AS zone,
                m.temperature_c AS temperature,
                a.date_creation AS date
            FROM alertes a
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            LEFT JOIN mesures m ON a.id_mesure = m.id_mesure
            WHERE a.statut IN ('ACTIVE', 'OUVERTE')
            AND a.niveau_gravite = 'CRITIQUE'
            ORDER BY a.date_creation DESC
            LIMIT 3
        """)
        rows = cursor.fetchall()
        for row in rows:
            if row.get("date"):
                row["date"] = row["date"].isoformat()
        return jsonify(rows), 200

    except Exception as e:
        print("❌ ERROR get_alertes_critiques:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/pompiers ─────────────────────────────────────────
@pompier_bp.route("/pompiers", methods=["GET"])
def get_pompiers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                u.id_utilisateur AS id_pompier,
                u.nom,
                u.prenom,
                u.telephone,
                u.statut
            FROM utilisateurs u
            JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
            JOIN roles r ON ur.id_role = r.id_role
            WHERE r.libelle = 'POMPIER'
            ORDER BY u.nom ASC
        """)
        return jsonify(cursor.fetchall()), 200

    except Exception as e:
        print("❌ ERROR get_pompiers:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/incidents ────────────────────────────────────────
@pompier_bp.route("/incidents", methods=["GET"])
def get_incidents():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                i.id_incendie,
                i.statut_incendie,
                i.date_debut,
                i.date_fin,
                i.cause_presumee,
                i.superficie_brulee_ha,
                z.id_zone,
                z.nom_zone,
                z.region
            FROM incendies i
            JOIN zones_forestieres z ON i.id_zone = z.id_zone
            ORDER BY i.date_debut DESC
        """)
        rows = cursor.fetchall()
        incidents = []
        for row in rows:
            incidents.append({
                "id_alerte":      row["id_incendie"],
                "type_alerte":    row["cause_presumee"] or "AUTOMATIQUE",
                "niveau_urgence": row["statut_incendie"],
                "statut":         row["statut_incendie"],
                "message":        f"Superficie brûlée: {row['superficie_brulee_ha']} ha" if row['superficie_brulee_ha'] else "",
                "date_creation":  row["date_debut"].isoformat() if row["date_debut"] else None,
                "zone": {
                    "id_zone":  row["id_zone"],
                    "nom_zone": row["nom_zone"],
                    "region":   row["region"],
                }
            })
        return jsonify(incidents), 200

    except Exception as e:
        print("❌ ERROR get_incidents:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── PATCH /api/pompiers/<id>/statut ──────────────────────────
@pompier_bp.route("/pompiers/<int:pompier_id>/statut", methods=["PATCH"])
def update_statut_pompier(pompier_id):
    data = request.get_json()
    new_statut = data.get("statut")

    valid_statuts = ["ACTIF", "INACTIF"]
    if new_statut not in valid_statuts:
        return jsonify({"error": f"Statut invalide. Valeurs acceptées: {valid_statuts}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE utilisateurs 
            SET statut = %s
            WHERE id_utilisateur = %s
        """, (new_statut, pompier_id))
        conn.commit()
        return jsonify({"message": "Statut mis à jour", "statut": new_statut}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR update_statut:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/notifications ────────────────────────────────────
@pompier_bp.route("/notifications", methods=["GET"])
@jwt_required()  # ← protège la route
def get_notifications():
    user_id = get_jwt_identity() 
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    
    print(user_id)  
    try:
        cursor.execute("""
            SELECT 
                a.id_alerte AS id_notif,
                'Alert' AS type,
                CONCAT(
                    '🚨 Fire detected in ', 
                    z.nom_zone, 
                    ' | Severity: ', a.niveau_gravite,
                    ' | Spread risk: ', a.probabilite_propagation, '%'
                ) AS message,
                au.envoye AS is_read,
                au.date_notification AS date,
                a.id_alerte AS linked_alert
            FROM alertes a
            JOIN alertes_utilisateurs au ON a.id_alerte = au.id_alerte
            JOIN utilisateurs u ON au.id_utilisateur = u.id_utilisateur
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            WHERE 
                u.id_utilisateur = %s
                AND a.statut IN ('ACTIVE', 'OUVERTE')
            ORDER BY au.date_notification DESC
        """, (user_id,))

        rows = cursor.fetchall()

        for r in rows:
            if r["date"]:
                r["date"] = r["date"].isoformat()

        return jsonify(rows), 200

    except Exception as e:
        print("❌ ERROR notifications:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()