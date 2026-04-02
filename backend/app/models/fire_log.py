"""FireLog model — immutable, append-only with hash chaining."""

import hashlib
import json


class FireLog:
    """Immutable fire event log entry with SHA-256 integrity chain."""

    def __init__(self, log_id, event_type, details, timestamp=None,
                 previous_hash=None, current_hash=None):
        self.log_id = log_id
        self.event_type = event_type
        self.details = details
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.current_hash = current_hash or self._compute_hash()

    def _compute_hash(self):
        """Compute SHA-256 hash of this log entry for chain integrity."""
        payload = json.dumps({
            "log_id": self.log_id,
            "event_type": self.event_type,
            "details": self.details,
            "timestamp": str(self.timestamp) if self.timestamp else None,
            "previous_hash": self.previous_hash,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "event_type": self.event_type,
            "details": self.details,
            "timestamp": str(self.timestamp) if self.timestamp else None,
            "previous_hash": self.previous_hash,
            "current_hash": self.current_hash,
        }

    def __repr__(self):
        return f"<FireLog id={self.log_id} type={self.event_type}>"
