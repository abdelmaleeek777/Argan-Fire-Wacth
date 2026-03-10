"""Integrity service — SHA-256 hash chaining for fire logs."""

import hashlib
import json


class IntegrityService:
    """Verify and maintain the hash chain of fire log entries."""

    @staticmethod
    def compute_hash(log_id, event_type, details, timestamp, previous_hash):
        """Compute the SHA-256 hash for a single log entry."""
        payload = json.dumps({
            "log_id": log_id,
            "event_type": event_type,
            "details": details,
            "timestamp": str(timestamp) if timestamp else None,
            "previous_hash": previous_hash,
        }, sort_keys=True)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def verify_chain(logs):
        """
        Verify the integrity of an ordered list of log dicts.

        Returns a dict with 'valid' (bool) and 'broken_at' (log_id or None).
        """
        for i, log in enumerate(logs):
            expected_hash = IntegrityService.compute_hash(
                log["log_id"],
                log["event_type"],
                log["details"],
                log.get("timestamp"),
                log.get("previous_hash"),
            )
            if expected_hash != log.get("current_hash"):
                return {"valid": False, "broken_at": log["log_id"]}

            # Check chain link
            if i > 0 and log.get("previous_hash") != logs[i - 1].get("current_hash"):
                return {"valid": False, "broken_at": log["log_id"]}

        return {"valid": True, "broken_at": None}
