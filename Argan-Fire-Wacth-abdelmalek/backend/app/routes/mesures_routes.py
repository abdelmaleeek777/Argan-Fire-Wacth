from flask import Blueprint, request, jsonify
from app.config import get_db_connection

mesures_bp = Blueprint("mesures", __name__)

@mesures_bp.route("/mesures", methods=["POST"])
def ajouter_mesure():

    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.callproc("sp_ajouter_mesure", (
        data["id_capteur"],
        data["temperature"],
        data["humidite"],
        data["vent"]
    ))

    conn.commit()

    return jsonify({"message": "Mesure ajoutée"})