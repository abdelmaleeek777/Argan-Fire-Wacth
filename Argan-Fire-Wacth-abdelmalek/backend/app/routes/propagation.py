"""Propagation routes — fire spread simulation."""

from flask import Blueprint, request, jsonify

propagation_bp = Blueprint("propagation", __name__)


@propagation_bp.route("/simulate", methods=["GET"])
def simulate():
    """GET /propagation/simulate — run fire propagation simulation."""
    wind_speed = request.args.get("wind_speed", type=float)
    wind_direction = request.args.get("wind_direction", type=float)
    humidity = request.args.get("humidity", type=float)
    latitude = request.args.get("latitude", type=float)
    longitude = request.args.get("longitude", type=float)

    if None in (wind_speed, humidity, latitude, longitude):
        return jsonify({
            "error": "Required query params: wind_speed, humidity, latitude, longitude"
        }), 400

    # TODO: call propagation_engine service
    result = {
        "probability": 0.0,
        "wind_speed": wind_speed,
        "wind_direction": wind_direction,
        "humidity": humidity,
        "origin": {"latitude": latitude, "longitude": longitude},
    }

    return jsonify({"simulation": result}), 200
