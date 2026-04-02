import mysql.connector
import sys

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Abde#$Lmalek",
        database="argan_fire_watch"
    )
    cursor = conn.cursor()

    # Alter utilisateurs
    cursor.execute("ALTER TABLE utilisateurs MODIFY COLUMN statut ENUM('ACTIF','INACTIF','SUSPENDU','approved','pending','rejected') NOT NULL DEFAULT 'ACTIF';")
    
    # Alter cooperatives
    # We must check if columns exist first or just try and ignore duplicates
    try:
        cursor.execute("ALTER TABLE cooperatives ADD COLUMN statut ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending';")
    except mysql.connector.errors.ProgrammingError as e:
        print("Column statut might exist:", e)

    try:
        cursor.execute("ALTER TABLE cooperatives ADD COLUMN region VARCHAR(100);")
    except mysql.connector.errors.ProgrammingError as e:
        print("Column region might exist:", e)

    try:
        cursor.execute("ALTER TABLE cooperatives ADD COLUMN zone_name VARCHAR(150);")
    except mysql.connector.errors.ProgrammingError as e:
        print("Column zone_name might exist:", e)

    conn.commit()
    print("Database updated successfully.")
except Exception as e:
    print("Error:", e)
    sys.exit(1)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
