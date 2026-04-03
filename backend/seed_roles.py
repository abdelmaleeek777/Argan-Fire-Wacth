from app.config import get_db_connection

def seed_roles():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        roles = [
            ('ADMIN', 'Administrateur — gestion complète de la plateforme'),
            ('POMPIER', 'Pompier — réception alertes, consultation zones'),
            ('UTILISATEUR_COOP', 'Responsable coopérative argan')
        ]
        
        for role in roles:
            cursor.execute("INSERT IGNORE INTO roles (libelle, description) VALUES (%s, %s)", role)
            
        # Also assign UTILISATEUR_COOP role to existing users for testing
        cursor.execute("SELECT id_role FROM roles WHERE libelle='UTILISATEUR_COOP'")
        coop_role_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id_utilisateur FROM utilisateurs")
        users = cursor.fetchall()
        for u in users:
            cursor.execute("INSERT IGNORE INTO utilisateurs_roles (id_utilisateur, id_role) VALUES (%s, %s)", (u[0], coop_role_id))
            
        conn.commit()
        print("Roles seeded and assigned successfully.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_roles()
