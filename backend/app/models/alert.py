"""Alert model — type, timestamp, status."""


class Alert:
    """Represents a fire alert triggered by sensor thresholds."""

    STATUS_PENDING = "pending"
    STATUS_ACKNOWLEDGED = "acknowledged"
    STATUS_RESOLVED = "resolved"

    def __init__(self, alert_id, alert_type, status=None, sensor_id=None, timestamp=None):
        self.alert_id = alert_id
        self.alert_type = alert_type
        self.status = status or self.STATUS_PENDING
        self.sensor_id = sensor_id
        self.timestamp = timestamp

    def to_dict(self):
        return {
            "alert_id": self.alert_id,
            "alert_type": self.alert_type,
            "status": self.status,
            "sensor_id": self.sensor_id,
            "timestamp": str(self.timestamp) if self.timestamp else None,
        }

    def __repr__(self):
        return f"<Alert id={self.alert_id} type={self.alert_type} status={self.status}>"
