<<<<<<< HEAD
=======
import os
>>>>>>> 9d68e17c4a608decdae4c67419c623286f47545d
from twilio.rest import Client
from dotenv import load_dotenv

<<<<<<< HEAD
ACCOUNT_SID = "ACdc8a9cdacad72a5f6e42436389a31ed7"
# AUTH_TOKEN = "d247a1b0ae21d0fd17b9963fe6e7703a"
AUTH_TOKEN = "e361f2820c79a6723f67d139ff66a690"
client = Client(ACCOUNT_SID, AUTH_TOKEN)

WHATSAPP_NUMBER = "whatsapp:+14155238886"


def send_whatsapp(phone, message):
=======
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
>>>>>>> 9d68e17c4a608decdae4c67419c623286f47545d
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