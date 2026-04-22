from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from app.utils.auth import cooperative_required

alerts_bp = Blueprint("alerts", __name__)

@alerts_bp.route("/cooperative/<int:coop_id>/alerts", methods=["GET"])
@cooperative_required
def get_alerts(coop_id):
    user = getattr(request, "current_user", None)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Ownership Check
    cursor.execute("SELECT id_responsable FROM cooperatives WHERE id_cooperative = %s", (coop_id,))
    coop_check = cursor.fetchone()
    if not coop_check or coop_check["id_responsable"] != user["user_id"]:
        cursor.close()
        conn.close()
        return jsonify({"message": "Forbidden"}), 403

    cursor.execute("""
        SELECT 
            a.id_alerte,
            a.niveau_gravite,
            a.statut,
            a.date_creation,
            z.nom_zone,
            c.reference_serie,
            m.temperature_c
        FROM alertes a
        LEFT JOIN zones_forestieres z ON a.id_zone = z.id_zone
        LEFT JOIN mesures m ON a.id_mesure = m.id_mesure
        LEFT JOIN capteurs c ON m.id_capteur = c.id_capteur
        WHERE a.id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
        ORDER BY a.date_creation DESC
    """, (coop_id,))

    alerts = cursor.fetchall()

    cursor.close()
    conn.close()

    # 🔁 Transformation pour correspondre au frontend
    formatted_alerts = []

    for a in alerts:
        # Mapping niveau_gravite → niveau_urgence
        if a["niveau_gravite"] == "INFO":
            niveau_urgence = "vigilance"
        elif a["niveau_gravite"] == "ATTENTION":
            niveau_urgence = "alerte"
        else:
            niveau_urgence = "urgence_maximale"

        # Mapping statut backend → frontend
        if a["statut"] in ["OUVERTE", "EN_COURS"]:
            statut = "active"
        elif a["statut"] == "RESOLUE":
            statut = "traitée"
        else:
            statut = "fausse_alerte"

        formatted_alerts.append({
            "id_alerte": a["id_alerte"],
            "zone": a["nom_zone"],
            "id_zone": None,  # optionnel (non fourni ici)
            "capteur": a["reference_serie"],
            "temperature_detectee": float(a["temperature_c"]) if a["temperature_c"] else None,
            "niveau_urgence": niveau_urgence,
            "statut": statut,
            "date_heure_declenchement": a["date_creation"],

            # ⚠️ Champs non présents en BD → valeurs par défaut
            "probabilite_propagation_pct": 0,
            "direction_propagation_deg": 0,
            "vitesse_propagation_ha_h": 0,
            "sms_envoye": False,
            "equipe": None
        })

    return jsonify(formatted_alerts)



#**************************************
@alerts_bp.route("/api/alerts/<int:alert_id>/notify", methods=["POST"])
def notify_alert(alert_id):
    send_notifications_for_alert(alert_id)
    return jsonify({"message": "Notifications sent"})
