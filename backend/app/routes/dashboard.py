from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from app.utils.auth import cooperative_required

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/cooperative/<int:coop_id>/dashboard", methods=["GET"])
@cooperative_required
def get_dashboard(coop_id):
    # Ownership Check
    user = getattr(request, "current_user", None)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verify ownership
    cursor.execute("SELECT id_responsable FROM cooperatives WHERE id_cooperative = %s", (coop_id,))
    coop_check = cursor.fetchone()
    if not coop_check or coop_check["id_responsable"] != user["user_id"]:
        cursor.close()
        conn.close()
        return jsonify({"message": "Forbidden: You do not own this cooperative"}), 403

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
        FROM zones_forestieres
        WHERE id_cooperative = %s
    """, (coop_id,))
    zones_total = cursor.fetchone()["total"]

    # Calculate average risk index for the cooperative
    cursor.execute("""
        SELECT AVG(indice_risque) as avg_risk
        FROM zones_forestieres
        WHERE id_cooperative = %s
    """, (coop_id,))
    risk_data = cursor.fetchone()
    fire_risk_index = round(float(risk_data["avg_risk"]), 1) if risk_data["avg_risk"] else 0

    # Capteurs actifs / inactifs
    cursor.execute("""
        SELECT 
            SUM(CASE WHEN statut='ACTIF' THEN 1 ELSE 0 END) as actifs,
            SUM(CASE WHEN statut!='ACTIF' THEN 1 ELSE 0 END) as inactifs
        FROM capteurs
        WHERE id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
    """, (coop_id,))
    capteurs = cursor.fetchone()

    # Alertes actives
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM alertes
        WHERE statut IN ('OUVERTE','EN_COURS')
        AND id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
    """, (coop_id,))
    alertes_actives = cursor.fetchone()["total"]

    # Alertes semaine
    cursor.execute("""
        SELECT COUNT(*) as total
        FROM alertes
        WHERE date_creation >= NOW() - INTERVAL 7 DAY
        AND id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
    """, (coop_id,))
    alertes_semaine = cursor.fetchone()["total"]

    # Temp max
    cursor.execute("""
        SELECT MAX(m.temperature_c) as max_temp
        FROM mesures m
        JOIN capteurs c ON m.id_capteur = c.id_capteur
        WHERE c.id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
    """, (coop_id,))
    row_temp = cursor.fetchone()
    temperature_max = float(row_temp["max_temp"]) if row_temp and row_temp["max_temp"] is not None else 0

    stats = {
        "zones_total": zones_total,
        "capteurs_actifs": capteurs["actifs"] or 0,
        "capteurs_en_panne": capteurs["inactifs"] or 0,
        "alertes_actives": alertes_actives,
        "alertes_semaine": alertes_semaine,
        "temperature_max": temperature_max,
        "fire_risk_index": fire_risk_index
    }

    # Added: Fetch zones with spatial data
    cursor.execute("""
        SELECT
            id_zone, nom_zone, superficie_ha, indice_risque,
            ST_AsGeoJSON(coordonnees_gps) as geojson
        FROM zones_forestieres
        WHERE id_cooperative = %s
    """, (coop_id,))
    zones = cursor.fetchall()

    # Process GeoJSON strings into dicts
    import json
    for z in zones:
        if z["geojson"]:
            try:
                geojson_obj = json.loads(z["geojson"])
                coordinates = geojson_obj.get("coordinates", [[]])
                z["coordinates"] = coordinates[0] if coordinates else []
            except (json.JSONDecodeError, KeyError, IndexError, TypeError):
                z["coordinates"] = []
        else:
            z["coordinates"] = []

    cursor.close()
    conn.close()

    return jsonify({
        "cooperative": cooperative,
        "stats": stats,
        "zones": zones
    })


@dashboard_bp.route("/cooperative/<int:coop_id>/readings/history", methods=["GET"])
@cooperative_required
def get_temperature_history(coop_id):
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
            DATE(m.horodatage) as date,
            c.reference_serie,
            AVG(m.temperature_c) as avg_temp
        FROM mesures m
        JOIN capteurs c ON m.id_capteur = c.id_capteur
        WHERE c.id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
        AND m.horodatage >= NOW() - INTERVAL 7 DAY
        GROUP BY date, c.reference_serie
        ORDER BY date ASC
    """, (coop_id,))
    
    raw_history = cursor.fetchall()
    
    # Process history into a format Recharts likes: [{date: '01/01', 'SensorA': 25, 'SensorB': 26}, ...]
    processed = {}
    for row in raw_history:
        date_str = row["date"].strftime("%d/%m")
        if date_str not in processed:
            processed[date_str] = {"date": date_str}
        processed[date_str][row["reference_serie"]] = round(float(row["avg_temp"]), 1)
    
    cursor.close()
    conn.close()
    return jsonify(list(processed.values()))
