"""Dashboard routes — map data for the frontend."""

from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/map-data", methods=["GET"])
def get_map_data():
    """GET /dashboard/map-data — return sensor locations, alerts, and zones."""
    # TODO: aggregate data from sensors, alerts, and cooperatives tables
    map_data = {
        "sensors": [],
        "alerts": [],
        "cooperatives": [],
    }

    return jsonify(map_data), 200
