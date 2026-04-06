import json
import os
from datetime import datetime
from urllib import request as urlrequest

from app.config import get_db_connection


def _read_last_exported_id(state_file):
    try:
        with open(state_file, "r", encoding="utf-8") as f:
            return int(f.read().strip() or "0")
    except Exception:
        return 0


def _write_last_exported_id(state_file, last_id):
    with open(state_file, "w", encoding="utf-8") as f:
        f.write(str(last_id))


def _post_to_siem(url, token, payload):
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urlrequest.Request(url, data=data, headers=headers, method="POST")
    with urlrequest.urlopen(req, timeout=10):
        return True


def export_security_logs_batch():
    """Export new rows from logs_securite to external sink."""
    sink_url = os.getenv("LOG_EXPORT_SIEM_URL")
    sink_token = os.getenv("LOG_EXPORT_SIEM_TOKEN")
    sink_file = os.getenv("LOG_EXPORT_FILE")
    state_file = os.getenv("LOG_EXPORT_STATE_FILE", ".log_export_state")
    batch_size = int(os.getenv("LOG_EXPORT_BATCH_SIZE", "200"))

    if not sink_url and not sink_file:
        return

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        last_id = _read_last_exported_id(state_file)
        cursor.execute(
            """
            SELECT
                id_log, action, table_cible, id_enregistrement,
                ancienne_valeur, nouvelle_valeur, adresse_ip, horodatage,
                id_utilisateur, prev_hash, entry_hash, hmac_signature
            FROM logs_securite
            WHERE id_log > %s
            ORDER BY id_log ASC
            LIMIT %s
            """,
            (last_id, batch_size),
        )
        rows = cursor.fetchall()
        if not rows:
            return

        payload = {
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "count": len(rows),
            "logs": rows,
        }

        if sink_url:
            _post_to_siem(sink_url, sink_token, payload)

        if sink_file:
            with open(sink_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(payload, default=str) + "\n")

        _write_last_exported_id(state_file, rows[-1]["id_log"])
    finally:
        cursor.close()
        conn.close()
