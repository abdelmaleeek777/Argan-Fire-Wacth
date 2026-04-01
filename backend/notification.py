import time
from app.config import get_db_connection
from twilio.rest import Client

# ===== TWILIO CONFIG =====
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
        print("WA SENT:", msg.sid)
        return True
    except Exception as e:
        print("WA ERROR:", str(e))
        return False


def process_notifications():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM alertes_utilisateurs
        WHERE envoye = 0
        LIMIT 1
    """)

    notif = cursor.fetchone()

    if notif:
        print("✅ Notification trouvée")

        success = send_whatsapp("+212606436042", "test")

        if success:
            cursor.execute("""
                UPDATE alertes_utilisateurs
                SET envoye = 1
                WHERE id_alerte = %s AND id_utilisateur = %s
            """, (notif["id_alerte"], notif["id_utilisateur"]))

            conn.commit()
            print("✅ Marqué comme envoyé")
        else:
            print("❌ Échec envoi, pas de mise à jour")

    else:
        print("❌ Aucune notification")

    cursor.close()
    conn.close()