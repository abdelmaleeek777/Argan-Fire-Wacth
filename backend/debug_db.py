from app.config import get_db_connection

def check_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        print("--- All Users ---")
        cursor.execute("SELECT id_utilisateur, email, nom, prenom FROM utilisateurs")
        users = cursor.fetchall()
        for u in users:
            print(u)
            
        print("\n--- Roles Table ---")
        cursor.execute("SELECT * FROM roles")
        roles_list = cursor.fetchall()
        for rl in roles_list:
            print(rl)

        print("\n--- User Roles ---")
        cursor.execute("""
            SELECT ur.id_utilisateur, r.libelle 
            FROM utilisateurs_roles ur 
            JOIN roles r ON ur.id_role = r.id_role
        """)
        roles = cursor.fetchall()
        for r in roles:
            print(r)
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
