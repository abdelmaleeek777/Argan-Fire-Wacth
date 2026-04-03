from app.config import get_db_connection
import hashlib

def seed_pompier():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Create pompier user
        email = "pompier@arganfire.com"
        password = "pompier123"
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Check if user already exists
        cursor.execute("SELECT id_utilisateur FROM utilisateurs WHERE email=%s", (email,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"User {email} already exists!")
            user_id = existing["id_utilisateur"]
        else:
            # Create user
            cursor.execute("""
                INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, statut)
                VALUES (%s, %s, %s, %s, %s)
            """, ("El Idrissi", "Karim", email, password_hash, "ACTIF"))
            user_id = cursor.lastrowid
            print(f"Created user: {email}")
        
        # Ensure POMPIER role exists
        cursor.execute("SELECT id_role FROM roles WHERE libelle='POMPIER'")
        role = cursor.fetchone()
        
        if not role:
            cursor.execute("INSERT INTO roles (libelle, description) VALUES (%s, %s)", 
                          ("POMPIER", "Pompier — réception alertes, consultation zones"))
            role_id = cursor.lastrowid
            print("Created POMPIER role")
        else:
            role_id = role["id_role"]
        
        # Assign POMPIER role to user
        cursor.execute("""
            INSERT IGNORE INTO utilisateurs_roles (id_utilisateur, id_role)
            VALUES (%s, %s)
        """, (user_id, role_id))
        
        conn.commit()
        
        print("\n✅ Pompier user created successfully!")
        print("=" * 40)
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print(f"Role:     POMPIER")
        print("=" * 40)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_pompier()
