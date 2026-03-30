from flask import Blueprint, jsonify, request
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

@sensors_bp.route("/sensors", methods=["POST"])
def add_sensor():
    data = request.get_json()

    # Validation des champs obligatoires
    required_fields = ["id", "type", "model", "latitude", "longitude", "altitude", "status", "cooperative"]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO capteurs (
                reference_serie,
                type_capteur,
                modele,
                latitude,
                longitude,
                altitude_m,
                statut,
                cooperative
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data["id"],           # reference_serie  → affiché comme "id" côté front
            data["type"],         # type_capteur
            data["model"],        # modele
            float(data["latitude"]),
            float(data["longitude"]),
            float(data["altitude"]),
            data["status"],       # statut  (active / inactive / maintenance)
            data["cooperative"],
        ))

        conn.commit()
        new_id = cursor.lastrowid  # id_capteur auto-généré par MySQL

        # On retourne l'objet dans le même format que GET /sensors
        # pour que le front puisse l'ajouter directement dans la liste
        new_sensor = {
            "id":           new_id,
            "location":     data["id"],          # reference_serie
            "coordinates":  f"{data['latitude']},{data['longitude']}",
            "status":       data["status"].lower(),
            "temperature":  None,
            "humidity":     None,
            "connectivity": "offline",            # pas encore de mesure
            "battery":      None,
            "lastPing":     None,
        }

        cursor.close()
        conn.close()
        return jsonify(new_sensor), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500





