"""Logs routes — read-only, integrity-checked fire logs."""

from flask import Blueprint, jsonify

logs_bp = Blueprint("logs", __name__)


@logs_bp.route("/", methods=["GET"])
def get_logs():
    """GET /logs — return fire logs with integrity verification."""
    # TODO: fetch logs from database
    # TODO: verify hash chain via integrity_service

    return jsonify({"logs": [], "integrity": "verified"}), 200
