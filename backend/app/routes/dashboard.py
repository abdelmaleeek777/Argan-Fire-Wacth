from flask import Blueprint, jsonify
from  app.config import get_db_connection

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/cooperative/<int:coop_id>/dashboard", methods=["GET"])
def get_dashboard(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ==============================
    # 1. Cooperative info
    # ==============================
    cursor.execute("""
        SELECT 
            c.nom_cooperative,
            c.siege_social,
            c.region,
            c.telephone,
            c.date_creation,
            CONCAT(u.nom, ' ', u.prenom) AS responsable
        FROM cooperatives c
        LEFT JOIN utilisateurs u ON c.id_responsable = u.id_utilisateur
        WHERE c.id_cooperative = %s
    """, (coop_id,))
    cooperative = cursor.fetchone()
        # Zones liées à la coop
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM zones_forestieres z
        JOIN cooperatives c ON c.id_zone = z.id_zone
        WHERE c.id_cooperative = %s
    """, (coop_id,))
    zones_total = cursor.fetchone()["total"]

    # Capteurs actifs / inactifs
    cursor.execute("""
        SELECT 
            SUM(CASE WHEN statut='ACTIF' THEN 1 ELSE 0 END) as actifs,
            SUM(CASE WHEN statut!='ACTIF' THEN 1 ELSE 0 END) as inactifs
        FROM capteurs
        WHERE id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))
    capteurs = cursor.fetchone()

    # Alertes actives
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM alertes
        WHERE statut IN ('OUVERTE','EN_COURS')
        AND id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))
    alertes_actives = cursor.fetchone()["total"]

    # Alertes semaine
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM alertes
        WHERE date_creation >= NOW() - INTERVAL 7 DAY
        AND id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))
    alertes_semaine = cursor.fetchone()["total"]

    # Temp max
    cursor.execute("""
        SELECT MAX(m.temperature_c) as max_temp
        FROM mesures m
        JOIN capteurs c ON m.id_capteur = c.id_capteur
        WHERE c.id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))
    temperature_max = cursor.fetchone()["max_temp"] or 0

    stats = {
        "zones_total": zones_total,
        "capteurs_actifs": capteurs["actifs"] or 0,
        "capteurs_en_panne": capteurs["inactifs"] or 0,
        "alertes_actives": alertes_actives,
        "alertes_semaine": alertes_semaine,
        "temperature_max": float(temperature_max)
    }
    cursor.execute("""
        SELECT 
            z.id_zone,
            z.nom_zone,
            z.superficie_ha,
            z.indice_risque,
            CASE 
                WHEN indice_risque < 3 THEN 'faible'
                WHEN indice_risque < 6 THEN 'moyen'
                WHEN indice_risque < 8 THEN 'élevé'
                ELSE 'critique'
            END AS niveau_risque_base
        FROM zones_forestieres z
        WHERE z.id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))
    zones = cursor.fetchall()
    cursor.execute("""
        SELECT 
            c.*,
            m.temperature_c,
            m.humidite_pct,
            m.horodatage
        FROM capteurs c
        LEFT JOIN mesures m ON m.id_capteur = c.id_capteur
        AND m.horodatage = (
            SELECT MAX(m2.horodatage)
            FROM mesures m2
            WHERE m2.id_capteur = c.id_capteur
        )
        WHERE c.id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
    """, (coop_id,))

    sensors_raw = cursor.fetchall()

    sensors = []
    for s in sensors_raw:
        sensors.append({
            "id_capteur": s["id_capteur"],
            "reference_serie": s["reference_serie"],
            "type_capteur": s["type_capteur"],
            "modele": s["modele"],
            "statut": s["statut"],
            "latest_reading": {
                "temperature_c": float(s["temperature_c"]) if s["temperature_c"] else None,
                "humidite_pct": float(s["humidite_pct"]) if s["humidite_pct"] else None,
                "horodatage": s["horodatage"]
            } if s["temperature_c"] else None
        })
    cursor.execute("""
        SELECT 
            a.id_alerte,
            a.niveau_gravite,
            a.statut,
            a.message,
            a.date_creation,
            z.nom_zone,
            m.temperature_c
        FROM alertes a
        LEFT JOIN zones_forestieres z ON a.id_zone = z.id_zone
        LEFT JOIN mesures m ON a.id_mesure = m.id_mesure
        WHERE a.id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
        ORDER BY a.date_creation DESC
        LIMIT 10
    """, (coop_id,))

    alerts_raw = cursor.fetchall()

    alerts = []
    for a in alerts_raw:
        alerts.append({
            "id_alerte": a["id_alerte"],
            "niveau_urgence": a["niveau_gravite"],
            "statut": a["statut"],
            "zone": a["nom_zone"],
            "temperature_detectee": float(a["temperature_c"]) if a["temperature_c"] else None,
            "date_heure_declenchement": a["date_creation"]
        })
    cursor.execute("""
        SELECT 
            DATE_FORMAT(horodatage, '%H:%i') as time,
            AVG(temperature_c) as temp
        FROM mesures m
        JOIN capteurs c ON m.id_capteur = c.id_capteur
        WHERE m.horodatage >= NOW() - INTERVAL 24 HOUR
        AND c.id_zone = (
            SELECT id_zone FROM cooperatives WHERE id_cooperative = %s
        )
        GROUP BY time
        ORDER BY time ASC
    """, (coop_id,))

    temp_history_raw = cursor.fetchall()

    temperature_history = [
        {"time": t["time"], "temp": float(t["temp"])}
        for t in temp_history_raw
    ]
    cursor.close()
    conn.close()

    return jsonify({
        "cooperative": cooperative,
        "stats": stats,
        "zones": zones,
        "sensors": sensors,
        "alerts": alerts,
        "temperature_history": temperature_history
    })
