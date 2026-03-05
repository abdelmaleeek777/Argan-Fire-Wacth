"""Sensors routes — ingest sensor data."""

from flask import Blueprint, request, jsonify

sensors_bp = Blueprint("sensors", __name__)


@sensors_bp.route("/reading", methods=["POST"])
def ingest_reading():
    """POST /sensors/reading — receive a sensor reading."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    required_fields = ["sensor_id", "temperature", "humidity", "latitude", "longitude"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # TODO: persist reading to database
    # TODO: check thresholds and trigger alert if needed

    return jsonify({"message": "Reading received", "data": data}), 201
