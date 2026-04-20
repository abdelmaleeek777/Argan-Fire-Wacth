import mysql.connector
import sys
import os

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "Abde#$Lmalek"),
        database=os.getenv("DB_NAME", "argan_fire_watch")
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

    # ---- logs_securite hardening ----
    for statement in [
        "ALTER TABLE logs_securite ADD COLUMN prev_hash VARCHAR(64) NULL;",
        "ALTER TABLE logs_securite ADD COLUMN entry_hash VARCHAR(64) NULL;",
        "ALTER TABLE logs_securite ADD COLUMN hmac_signature VARCHAR(128) NULL;",
    ]:
        try:
            cursor.execute(statement)
        except mysql.connector.errors.ProgrammingError as e:
            print("Log integrity column might exist:", e)

    # Recreate triggers safely
    cursor.execute("DROP TRIGGER IF EXISTS trg_logs_securite_integrite_insert;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_logs_securite_block_update;")
    cursor.execute("DROP TRIGGER IF EXISTS trg_logs_securite_block_delete;")

    cursor.execute("""
        CREATE TRIGGER trg_logs_securite_integrite_insert
        BEFORE INSERT ON logs_securite
        FOR EACH ROW
        BEGIN
            DECLARE v_prev_hash VARCHAR(64);
            SELECT entry_hash INTO v_prev_hash
            FROM logs_securite
            ORDER BY id_log DESC
            LIMIT 1;

            SET NEW.prev_hash = IFNULL(v_prev_hash, REPEAT('0', 64));
            SET NEW.entry_hash = SHA2(
                CONCAT(
                    IFNULL(NEW.action, ''),
                    IFNULL(NEW.table_cible, ''),
                    IFNULL(DATE_FORMAT(NEW.horodatage, '%Y-%m-%d %H:%i:%s.%f'), ''),
                    IFNULL(CAST(NEW.nouvelle_valeur AS CHAR), '')
                ),
                256
            );
            SET NEW.hmac_signature = SHA2(
                CONCAT(IFNULL(@log_hmac_secret, ''), '|', NEW.entry_hash, '|', NEW.prev_hash),
                256
            );
        END
    """)
    cursor.execute("""
        CREATE TRIGGER trg_logs_securite_block_update
        BEFORE UPDATE ON logs_securite
        FOR EACH ROW
        BEGIN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'UPDATE on logs_securite is forbidden';
        END
    """)
    cursor.execute("""
        CREATE TRIGGER trg_logs_securite_block_delete
        BEFORE DELETE ON logs_securite
        FOR EACH ROW
        BEGIN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DELETE on logs_securite is forbidden';
        END
    """)

    # Revoke UPDATE/DELETE privileges from app DB user (best effort)
    app_user = os.getenv("DB_APP_USER")
    app_host = os.getenv("DB_APP_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "argan_fire_watch")
    if app_user:
        try:
            revoke_sql = "REVOKE UPDATE, DELETE ON `{}`.`logs_securite` FROM '{}'@'{}'".format(
                db_name, app_user, app_host
            )
            cursor.execute(revoke_sql)
            print(f"Privileges revoked for {app_user}@{app_host} on logs_securite.")
        except Exception as e:
            print("Privilege revoke failed (check DB user/grants):", e)
    else:
        print("DB_APP_USER not set, skipping REVOKE.")

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
