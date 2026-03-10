"""Tests — log tampering detection via hash chain verification."""

import unittest
from app.services.integrity_service import IntegrityService
from app.models.fire_log import FireLog


class TestLogIntegrity(unittest.TestCase):
    """Verify SHA-256 hash chaining detects tampered log entries."""

    def setUp(self):
        self.service = IntegrityService()

    def _build_chain(self, count=3):
        """Build a valid chain of FireLog entries."""
        logs = []
        prev_hash = None
        for i in range(count):
            log = FireLog(
                log_id=i + 1,
                event_type="fire_detected",
                details=f"Event {i + 1} details",
                timestamp=f"2026-03-0{i + 1} 12:00:00",
                previous_hash=prev_hash,
            )
            logs.append(log)
            prev_hash = log.current_hash
        return logs

    def test_valid_chain(self):
        """A properly built chain should pass verification."""
        logs = self._build_chain()
        result = self.service.verify_chain([l.to_dict() for l in logs])
        self.assertTrue(result["valid"])
        self.assertIsNone(result["broken_at"])

    def test_tampered_entry(self):
        """Modifying a log entry should break the chain."""
        logs = self._build_chain()
        dicts = [l.to_dict() for l in logs]
        # Tamper with the second entry
        dicts[1]["details"] = "TAMPERED DATA"

        result = self.service.verify_chain(dicts)
        self.assertFalse(result["valid"])
        self.assertEqual(result["broken_at"], 2)

    def test_single_entry(self):
        """A chain with one entry should be valid."""
        logs = self._build_chain(count=1)
        result = self.service.verify_chain([logs[0].to_dict()])
        self.assertTrue(result["valid"])


if __name__ == "__main__":
    unittest.main()
