"""Cooperative model — zone, location, contact info."""


class Cooperative:
    """Represents an argan cooperative in a monitored zone."""

    def __init__(self, cooperative_id, name, zone, latitude, longitude,
                 contact_phone=None):
        self.cooperative_id = cooperative_id
        self.name = name
        self.zone = zone
        self.latitude = latitude
        self.longitude = longitude
        self.contact_phone = contact_phone

    def to_dict(self):
        return {
            "cooperative_id": self.cooperative_id,
            "name": self.name,
            "zone": self.zone,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "contact_phone": self.contact_phone,
        }

    def __repr__(self):
        return f"<Cooperative id={self.cooperative_id} name={self.name} zone={self.zone}>"
