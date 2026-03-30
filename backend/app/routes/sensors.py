from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from app.utils.auth import cooperative_required

sensors_bp = Blueprint("sensors", __name__)


@sensors_bp.route("/cooperative/<int:coop_id>/sensors", methods=["GET"])
@cooperative_required
def get_cooperative_sensors(coop_id):
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
            c.id_capteur,
            c.reference_serie,
            c.type_capteur,
            c.modele,
            c.latitude,
            c.longitude,
            c.statut,
            c.id_zone,
            m.temperature_c,
            m.humidite_pct,
            m.horodatage as last_reading_time
        FROM capteurs c
        LEFT JOIN mesures m ON m.id_capteur = c.id_capteur
        AND m.horodatage = (
            SELECT MAX(m2.horodatage)
            FROM mesures m2
            WHERE m2.id_capteur = c.id_capteur
        )
        WHERE c.id_zone IN (
            SELECT id_zone FROM zones_forestieres WHERE id_cooperative = %s
        )
    """, (coop_id,))

    sensors = cursor.fetchall()
    
    # Format for frontend expectance (latest_reading object)
    formatted = []
    for s in sensors:
        s_data = dict(s)
        if s["temperature_c"] is not None:
            s_data["latest_reading"] = {
                "temperature_c": float(s["temperature_c"]),
                "humidite_pct": float(s["humidite_pct"]),
                "horodatage": s["last_reading_time"]
            }
        else:
            s_data["latest_reading"] = None
        formatted.append(s_data)

    cursor.close()
    conn.close()
    return jsonify(formatted)


@sensors_bp.route("/sensors", methods=["GET"])
def get_sensors():
    # ... (existing admin route)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
    c.id_capteur AS id,
    c.reference_serie AS location,
    CONCAT(c.latitude, ',', c.longitude) AS coordinates,
    LOWER(c.statut) AS status,
    m.temperature_c AS temperature,
    m.humidite_pct AS humidity,

    CASE
        WHEN m.qualite_signal >= 80 THEN 'excellent'
        WHEN m.qualite_signal >= 50 THEN 'good'
        WHEN m.qualite_signal >= 20 THEN 'weak'
        ELSE 'offline'
    END AS connectivity,

    m.qualite_signal AS battery,
    m.horodatage AS lastPing

FROM capteurs c
LEFT JOIN mesures m 
ON m.id_capteur = c.id_capteur
AND m.horodatage = (
    SELECT MAX(m2.horodatage)
    FROM mesures m2
    WHERE m2.id_capteur = c.id_capteur
)
ORDER BY m.horodatage DESC
    """)

    sensors = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(sensors)