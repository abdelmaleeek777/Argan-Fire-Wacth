# app/routes/pompier.py
from flask import Blueprint, jsonify, request
from app.config import get_db_connection

pompier_bp = Blueprint("pompier", __name__)


# ── GET /api/pompiers ─────────────────────────────────────────
# Liste de tous les pompiers avec leur statut
@pompier_bp.route("/pompiers", methods=["GET"])
def get_pompiers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                u.id_utilisateur   AS id_pompier,
                u.nom,
                u.prenom,
                u.telephone,
                u.statut,
                p.matricule,
                p.grade,
                p.specialite,
                p.statut_service   AS statut,
                e.nom_equipe       AS equipe
            FROM utilisateurs u
            JOIN pompiers p 
                ON u.id_utilisateur = p.id_utilisateur
            LEFT JOIN equipes e 
                ON p.id_equipe = e.id_equipe
            JOIN utilisateurs_roles ur 
                ON u.id_utilisateur = ur.id_utilisateur
            WHERE ur.id_role = 3
            ORDER BY u.nom ASC
        """)
        pompiers = cursor.fetchall()
        return jsonify(pompiers), 200

    except Exception as e:
        print("❌ ERROR get_pompiers:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/equipes/<id>/missions ───────────────────────────
# Missions récentes d'une équipe
@pompier_bp.route("/equipes/<int:equipe_id>/missions", methods=["GET"])
def get_missions_equipe(equipe_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                m.id_mission,
                z.nom_zone          AS zone,
                m.temperature_max   AS temp,
                m.statut,
                DATE(m.date_debut)  AS date,
                CONCAT(
                    TIMESTAMPDIFF(HOUR, m.date_debut, 
                        COALESCE(m.date_fin, NOW())),
                    'h ',
                    MOD(TIMESTAMPDIFF(MINUTE, m.date_debut, 
                        COALESCE(m.date_fin, NOW())), 60),
                    'm'
                )                   AS duree
            FROM missions m
            JOIN zones_forestieres z 
                ON m.id_zone = z.id_zone
            WHERE m.id_equipe = %s
            ORDER BY m.date_debut DESC
            LIMIT 10
        """, (equipe_id,))

        missions = cursor.fetchall()

        # Formater la date
        for mission in missions:
            if mission.get("date"):
                from datetime import date
                today = date.today()
                if mission["date"] == today:
                    mission["date"] = "Aujourd'hui"
                else:
                    mission["date"] = mission["date"].strftime("%Y-%m-%d")

            # Formater la température
            if mission.get("temp"):
                mission["temp"] = f"{mission['temp']}°C"

        return jsonify(missions), 200

    except Exception as e:
        print("❌ ERROR get_missions_equipe:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/incidents ────────────────────────────────────────
# Incidents actifs (alertes ouvertes) avec infos zone
@pompier_bp.route("/incidents", methods=["GET"])
def get_incidents():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte,
                a.type_alerte,
                a.niveau_gravite    AS niveau_urgence,
                a.statut,
                a.date_creation,
                a.message,
                z.id_zone,
                z.nom_zone,
                z.region
            FROM alertes a
            JOIN zones_forestieres z 
                ON a.id_zone = z.id_zone
            WHERE a.statut IN ('ACTIVE', 'OUVERTE')
            ORDER BY a.date_creation DESC
        """)

        rows = cursor.fetchall()

        # Structurer la zone comme objet imbriqué
        # (le front accède à incident.zone.nom_zone)
        incidents = []
        for row in rows:
            incidents.append({
                "id_alerte":     row["id_alerte"],
                "type_alerte":   row["type_alerte"],
                "niveau_urgence": row["niveau_urgence"],
                "statut":        row["statut"],
                "message":       row["message"],
                "date_creation": row["date_creation"].isoformat() if row["date_creation"] else None,
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
# Mettre à jour le statut d'un pompier
@pompier_bp.route("/pompiers/<int:pompier_id>/statut", methods=["PATCH"])
def update_statut_pompier(pompier_id):
    data = request.get_json()
    new_statut = data.get("statut")

    valid_statuts = ["disponible", "en_intervention", "repos", "absent"]
    if new_statut not in valid_statuts:
        return jsonify({"error": f"Statut invalide. Valeurs acceptées: {valid_statuts}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE pompiers 
            SET statut_service = %s
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


# ── PATCH /api/incidents/<id>/accept ─────────────────────────
# Accepter une mission / incident
@pompier_bp.route("/incidents/<int:incident_id>/accept", methods=["PATCH"])
def accept_mission(incident_id):
    data = request.get_json()
    pompier_id = data.get("pompier_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Marquer l'alerte comme prise en charge
        cursor.execute("""
            UPDATE alertes 
            SET statut = 'EN_COURS'
            WHERE id_alerte = %s
        """, (incident_id,))

        # Mettre le pompier en intervention
        if pompier_id:
            cursor.execute("""
                UPDATE pompiers 
                SET statut_service = 'en_intervention'
                WHERE id_utilisateur = %s
            """, (pompier_id,))

        conn.commit()
        return jsonify({"message": "Mission acceptée"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR accept_mission:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── PATCH /api/incidents/<id>/refuse ─────────────────────────
# Refuser une mission / incident
@pompier_bp.route("/incidents/<int:incident_id>/refuse", methods=["PATCH"])
def refuse_mission(incident_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE alertes 
            SET statut = 'REFUSEE'
            WHERE id_alerte = %s
        """, (incident_id,))

        conn.commit()
        return jsonify({"message": "Mission refusée"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR refuse_mission:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()