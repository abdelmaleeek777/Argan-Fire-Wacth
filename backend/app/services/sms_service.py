"""SMS service — Twilio / OrangeSMS integration."""

from flask import current_app


class SMSService:
    """Send SMS alerts to cooperative contacts."""

    def __init__(self):
        self.api_key = None
        self.api_secret = None
        self.from_number = None

    def init_app(self, app=None):
        """Load credentials from app config."""
        _app = app or current_app
        self.api_key = _app.config.get("SMS_API_KEY")
        self.api_secret = _app.config.get("SMS_API_SECRET")
        self.from_number = _app.config.get("SMS_FROM_NUMBER")

    def send_alert(self, to_number, message):
        """
        Send an SMS alert.

        TODO: implement actual Twilio / OrangeSMS API call.
        """
        if not self.api_key:
            raise RuntimeError("SMS service not configured — call init_app() first")

        # TODO: integrate with Twilio or OrangeSMS
        # client = TwilioClient(self.api_key, self.api_secret)
        # client.messages.create(to=to_number, from_=self.from_number, body=message)

        print(f"[SMS] To: {to_number} | Message: {message}")
        return {"status": "sent", "to": to_number, "message": message}
