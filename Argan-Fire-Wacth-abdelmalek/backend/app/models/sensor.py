"""SensorReading model — temperature, humidity, coordinates."""


class SensorReading:
    """Represents a single reading from a field sensor."""

    def __init__(self, sensor_id, temperature, humidity, latitude, longitude, timestamp=None):
        self.sensor_id = sensor_id
        self.temperature = temperature
        self.humidity = humidity
        self.latitude = latitude
        self.longitude = longitude
        self.timestamp = timestamp

    def to_dict(self):
        return {
            "sensor_id": self.sensor_id,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": str(self.timestamp) if self.timestamp else None,
        }

    def __repr__(self):
        return f"<SensorReading sensor_id={self.sensor_id} temp={self.temperature} hum={self.humidity}>"
