from app import create_app
from flask_cors import CORS
import threading
import time
import os
from notification import process_notifications
from log_export import export_security_logs_batch

app = create_app()
CORS(app)

def notification_loop():
    last_log_export = 0
    export_interval = int(os.getenv("LOG_EXPORT_INTERVAL_SECONDS", "300"))

    while True:
        print("🔄 Vérification notifications...")
        process_notifications()

        now = time.time()
        if now - last_log_export >= export_interval:
            try:
                export_security_logs_batch()
                last_log_export = now
            except Exception as e:
                print("❌ Log export error:", e)

        time.sleep(10)  # toutes les 10 secondes

if __name__ == "__main__":
    thread = threading.Thread(target=notification_loop, daemon=True)
    thread.start()
    app.run(debug=False, port=5000)
