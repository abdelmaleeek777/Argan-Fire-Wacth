import os
import time
from app.config import get_db_connection
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

twilio_sid = os.getenv("SID")
twilio_token = os.getenv("TOKEN")

client = Client(twilio_sid, twilio_token)

WHATSAPP_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


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

    try:
        # Check if 'envoye' column exists, if not use date_notification as filter
        cursor.execute("""
            SELECT au.id_alerte, au.id_utilisateur, au.date_notification,
                   u.telephone, a.message, a.niveau_gravite, z.nom_zone
            FROM alertes_utilisateurs au
            JOIN utilisateurs u ON au.id_utilisateur = u.id_utilisateur
            JOIN alertes a ON au.id_alerte = a.id_alerte
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            WHERE au.date_notification >= NOW() - INTERVAL 5 MINUTE
        """)

        notifications = cursor.fetchall()

        if notifications:
            for notif in notifications:
                print(f"📨 Envoi à {notif['telephone']}...")

                message = f"""🔥 CRITICAL FIRE ALERT
Zone: {notif['nom_zone']}
{notif['message']}
Please intervene immediately!"""

                success = send_whatsapp(notif["telephone"], message)

                if success:
                    print("✅ Message envoyé")
                else:
                    print(f"❌ Échec pour {notif['telephone']}")
        else:
            print("❌ Aucune notification en attente")
    except Exception as e:
        print(f"❌ Notification error: {e}")
    finally:
        cursor.close()
        conn.close()