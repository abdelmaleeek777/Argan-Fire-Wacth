import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_SID       = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN        = os.getenv("TWILIO_AUTH_TOKEN")
WHATSAPP_NUMBER   = os.getenv("TWILIO_WHATSAPP_NUMBER")

# Validation au démarrage
if not all([ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER]):
    raise EnvironmentError("❌ Variables Twilio manquantes dans le fichier .env")

client = Client(ACCOUNT_SID, AUTH_TOKEN)


def send_whatsapp(phone: str, message: str) -> bool:
    """
    Envoie un message WhatsApp.
    Retourne True si succès, False sinon.
    """
    try:
        msg = client.messages.create(
            body=message,
            from_=WHATSAPP_NUMBER,
            to=f"whatsapp:{phone}"
        )
        print(f"✅ WhatsApp envoyé à {phone} — SID: {msg.sid}")
        return True
    except Exception as e:
        print(f"❌ Erreur WhatsApp pour {phone}: {e}")
        return False


if __name__ == "__main__":
    send_whatsapp("+212627946380", "🚀 Test WhatsApp réussi !")