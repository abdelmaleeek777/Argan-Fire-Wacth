import os

import mysql.connector

def get_db_connection():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "Abde#$Lmalek"),
        database=os.getenv("DB_NAME", "argan_fire_watch")
    )

    # Make HMAC secret available to DB triggers for integrity signatures.
    log_hmac_secret = os.getenv("LOG_HMAC_SECRET")
    if log_hmac_secret:
        cursor = connection.cursor()
        cursor.execute("SET @log_hmac_secret = %s", (log_hmac_secret,))
        cursor.close()

    return connection
