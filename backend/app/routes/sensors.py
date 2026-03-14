from flask import Blueprint, jsonify
from app.config import get_db_connection

sensors_bp = Blueprint("sensors", __name__)


@sensors_bp.route("/sensors", methods=["GET"])
def get_sensors():

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