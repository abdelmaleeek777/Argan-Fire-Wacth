import os

from twilio.rest import Client

twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
twilio_token = os.getenv("TWILIO_AUTH_TOKEN")

client = Client(twilio_sid, twilio_token)

WHATSAPP_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def send_whatsapp(phone, message):
    try:
        msg = client.messages.create(
            body=message,
            from_=WHATSAPP_NUMBER,
            to=f"whatsapp:{phone}"
        )
        print("SENT:", msg.sid)
    except Exception as e:
        print("WA ERROR:", e)


# ✅ TEST DIRECT
if __name__ == "__main__":
    send_whatsapp("+212606436042", "🚀 Test WhatsApp réussi !")