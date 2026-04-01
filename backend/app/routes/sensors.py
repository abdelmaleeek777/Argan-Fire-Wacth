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
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT DISTINCT
            c.id_capteur AS id,
            c.reference_serie AS location,
            CONCAT(c.latitude, ',', c.longitude) AS coordinates,
            c.statut AS status,
            c.modele AS model,
            c.type_capteur AS type,
            c.altitude_m AS altitude,
            c.latitude,
            c.longitude,
            m.temperature_c AS temperature,
            m.humidite_pct AS humidity,
            m.vitesse_vent_kmh AS windSpeed,
            m.qualite_signal AS signalQuality,
            m.horodatage AS lastPing,
            co.nom_cooperative AS cooperative,
            z.nom_zone AS zoneName,
            CASE
                WHEN m.qualite_signal >= 80 THEN 'excellent'
                WHEN m.qualite_signal >= 50 THEN 'good'
                WHEN m.qualite_signal >= 20 THEN 'weak'
                ELSE 'offline'
            END AS connectivity
        FROM capteurs c
        LEFT JOIN zones_forestieres z ON c.id_zone = z.id_zone
        LEFT JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
        LEFT JOIN mesures m ON m.id_capteur = c.id_capteur
            AND m.id_mesure = (
                SELECT m2.id_mesure
                FROM mesures m2
                WHERE m2.id_capteur = c.id_capteur
                ORDER BY m2.horodatage DESC
                LIMIT 1
            )
        ORDER BY co.nom_cooperative, c.reference_serie
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





