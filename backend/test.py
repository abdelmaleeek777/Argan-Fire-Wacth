from twilio.rest import Client

ACCOUNT_SID = "ACdc8a9cdacad72a5f6e42436389a31ed7"
AUTH_TOKEN = "d247a1b0ae21d0fd17b9963fe6e7703a"

client = Client(ACCOUNT_SID, AUTH_TOKEN)

WHATSAPP_NUMBER = "whatsapp:+14155238886"


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