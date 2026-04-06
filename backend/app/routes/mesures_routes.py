from flask import Blueprint, request, jsonify
from app.config import get_db_connection
from app.utils.auth import token_required

mesures_bp = Blueprint("mesures", __name__)

@mesures_bp.route("/mesures", methods=["POST"])
@token_required
def ajouter_mesure():
    """Add a sensor measurement with input validation."""
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid request body"}), 400
        
        # Input validation
        id_capteur = data.get("id_capteur")
        temperature = data.get("temperature")
        humidite = data.get("humidite")
        vent = data.get("vent")
        
        # Validate id_capteur is positive integer
        try:
            id_capteur = int(id_capteur)
            if id_capteur <= 0:
                return jsonify({"error": "Invalid id_capteur: must be positive integer"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid id_capteur: must be an integer"}), 400
        
        # Validate temperature: -50 to 85°C
        try:
            temperature = float(temperature)
            if temperature < -50 or temperature > 85:
                return jsonify({"error": "Invalid temperature: must be between -50 and 85°C"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid temperature: must be a number"}), 400
        
        # Validate humidity: 0 to 100%
        try:
            humidite = float(humidite)
            if humidite < 0 or humidite > 100:
                return jsonify({"error": "Invalid humidity: must be between 0 and 100%"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid humidity: must be a number"}), 400
        
        # Validate wind: 0 to 200 km/h
        try:
            vent = float(vent)
            if vent < 0 or vent > 200:
                return jsonify({"error": "Invalid wind speed: must be between 0 and 200 km/h"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid wind speed: must be a number"}), 400
        
        # All validations passed - store measurement
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.callproc("sp_ajouter_mesure", (
                id_capteur,
                temperature,
                humidite,
                vent
            ))
            conn.commit()
            return jsonify({"message": "Mesure ajoutée"}), 201
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "Internal error"}), 500
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        return jsonify({"error": "Internal error"}), 500