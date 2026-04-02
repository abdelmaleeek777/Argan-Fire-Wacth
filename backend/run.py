from app import create_app
from flask_cors import CORS
import threading
import time
from notification import process_notifications

app = create_app()
CORS(app)

def notification_loop():
    while True:
        print("🔄 Vérification notifications...")
        process_notifications()
        time.sleep(10)  # toutes les 10 secondes

if __name__ == "__main__":
    thread = threading.Thread(target=notification_loop, daemon=True)
    thread.start()
    app.run(debug=False, port=5000)