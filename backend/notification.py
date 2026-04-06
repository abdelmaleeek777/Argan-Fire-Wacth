import os
import time
from app.config import get_db_connection
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

ACCOUNT_SID       = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN        = os.getenv("TWILIO_AUTH_TOKEN")
WHATSAPP_NUMBER   = os.getenv("TWILIO_WHATSAPP_NUMBER")

# Initialize Twilio client only if all credentials are present
client = None
if all([ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER]):
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    print("✅ Twilio client initialized")
else:
    print("⚠️  Twilio credentials not set - WhatsApp notifications disabled")



def send_whatsapp(phone, message):
    if not client:
        print(f"⚠️  Twilio not configured - skipping WhatsApp to {phone}")
        return False
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
        # ✅ Récupérer uniquement les notifications non envoyées (envoye = 0)
        cursor.execute("""
            SELECT 
                au.id_alerte, 
                au.id_utilisateur,
                u.telephone, 
                a.message, 
                a.niveau_gravite, 
                z.nom_zone
            FROM alertes_utilisateurs au
            JOIN utilisateurs u ON au.id_utilisateur = u.id_utilisateur
            JOIN alertes a ON au.id_alerte = a.id_alerte
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            WHERE au.envoye = 0
        """)

        notifications = cursor.fetchall()

        if not notifications:
            print("✅ Aucune notification en attente")
            return

        for notif in notifications:
            print(f"📨 Envoi à {notif['telephone']}...")

            message = f"""🔥 CRITICAL FIRE ALERT
Zone: {notif['nom_zone']}
{notif['message']}
Please intervene immediately!"""

            success = send_whatsapp(notif["telephone"], message)

            if success:
                # ✅ Marquer comme envoyé dans la DB
                cursor.execute("""
                    UPDATE alertes_utilisateurs 
                    SET envoye = 1
                    WHERE id_alerte = %s AND id_utilisateur = %s
                """, (notif["id_alerte"], notif["id_utilisateur"]))
                conn.commit()
                print(f"✅ Message envoyé à {notif['telephone']} — marqué envoye=1")
            else:
                print(f"❌ Échec pour {notif['telephone']} — envoye reste 0")

    except Exception as e:
        conn.rollback()
        print(f"❌ Notification error: {e}")
    finally:
        cursor.close()
        conn.close()