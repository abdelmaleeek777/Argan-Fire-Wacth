"""Alerts routes — list and trigger alerts."""

from flask import Blueprint, request, jsonify

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/", methods=["GET"])
def list_alerts():
    """GET /alerts — return all alerts."""
    # TODO: fetch alerts from database
    return jsonify({"alerts": []}), 200


@alerts_bp.route("/trigger", methods=["POST"])
def trigger_alert():
    """POST /alerts/trigger — manually trigger an alert."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body is required"}), 400

    required_fields = ["alert_type", "sensor_id"]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # TODO: create alert in database
    # TODO: send SMS notification via sms_service

    return jsonify({"message": "Alert triggered", "data": data}), 201
