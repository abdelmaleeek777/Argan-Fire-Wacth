"""Input sanitization and validation helpers."""

import re


def sanitize_string(value, max_length=255):
    """Strip and truncate a string value."""
    if not isinstance(value, str):
        return value
    return value.strip()[:max_length]


def validate_coordinates(latitude, longitude):
    """Check that latitude and longitude are within valid ranges."""
    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        return False, "Coordinates must be numeric"

    if not (-90 <= lat <= 90):
        return False, "Latitude must be between -90 and 90"
    if not (-180 <= lon <= 180):
        return False, "Longitude must be between -180 and 180"

    return True, None


def validate_sensor_reading(data):
    """
    Validate a sensor reading payload.

    Returns (is_valid: bool, errors: list[str]).
    """
    errors = []

    if not isinstance(data, dict):
        return False, ["Request body must be a JSON object"]

    required_fields = ["sensor_id", "temperature", "humidity", "latitude", "longitude"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if not errors:
        try:
            temp = float(data["temperature"])
            if not (-50 <= temp <= 80):
                errors.append("Temperature must be between -50 and 80 °C")
        except (TypeError, ValueError):
            errors.append("Temperature must be numeric")

        try:
            hum = float(data["humidity"])
            if not (0 <= hum <= 100):
                errors.append("Humidity must be between 0 and 100 %")
        except (TypeError, ValueError):
            errors.append("Humidity must be numeric")

        valid_coords, coord_err = validate_coordinates(data["latitude"], data["longitude"])
        if not valid_coords:
            errors.append(coord_err)

    return len(errors) == 0, errors
