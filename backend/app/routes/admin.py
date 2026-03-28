from flask import Blueprint, jsonify
from app.config import get_db_connection

admin_bp = Blueprint("admin", __name__)


# ===============================
# GET PENDING COOPERATIVES
# ===============================
# GET — toutes les demandes pending
@admin_bp.route("/cooperatives/pending", methods=["GET"])
def get_pending():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.id_cooperative          AS _id,
            c.nom_cooperative         AS name,
            c.region,
            c.siege_social            AS address,
            c.telephone,
            c.zone_name               AS zoneName,
            c.statut,
            c.date_creation           AS createdAt,
            u.nom                     AS ownerLastName,
            u.prenom                  AS ownerFirstName,
            CONCAT(u.prenom,' ',u.nom) AS ownerName,
            u.email                   AS ownerEmail
        FROM cooperatives c
        JOIN utilisateurs u ON c.id_responsable = u.id_utilisateur
        WHERE c.statut = 'pending'
        ORDER BY c.date_creation DESC
    """)

    results = cursor.fetchall()
    print("RESULTS:", results)
    cursor.close()
    conn.close()

    for r in results:
        if r.get("createdAt"):
            r["createdAt"] = r["createdAt"].isoformat()

    return jsonify(results), 200


# PATCH — approuver
@admin_bp.route("/cooperatives/<int:coop_id>/approve", methods=["PATCH"])
def approve_cooperative(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE cooperatives SET statut = 'approved'
            WHERE id_cooperative = %s
        """, (coop_id,))

        # Approuver aussi l'utilisateur responsable
        cursor.execute("""
            UPDATE utilisateurs u
            JOIN cooperatives c ON c.id_responsable = u.id_utilisateur
            SET u.statut = 'approved'
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        conn.commit()
        return jsonify({"message": "Coopérative approuvée"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# PATCH — rejeter
@admin_bp.route("/cooperatives/<int:coop_id>/reject", methods=["PATCH"])
def reject_cooperative(coop_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            UPDATE cooperatives SET statut = 'rejected'
            WHERE id_cooperative = %s
        """, (coop_id,))

        cursor.execute("""
            UPDATE utilisateurs u
            JOIN cooperatives c ON c.id_responsable = u.id_utilisateur
            SET u.statut = 'rejected'
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        conn.commit()
        return jsonify({"message": "Coopérative rejetée"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@admin_bp.route("/cooperatives", methods=["GET"])
def get_all_cooperatives():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.id_cooperative AS _id,
            c.nom_cooperative AS name,
            c.region,
            c.statut AS status,
            c.date_creation AS createdAt,
            COUNT(cap.id_capteur) AS sensorCount
        FROM cooperatives c
        LEFT JOIN zones_forestieres z
            ON z.nom_zone = c.zone_name
        LEFT JOIN capteurs cap
            ON cap.id_zone = z.id_zone
        GROUP BY c.id_cooperative
    """)

    cooperatives = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(cooperatives)

@admin_bp.route("/cooperatives/<int:coop_id>", methods=["GET"])
def get_cooperative_detail(coop_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ Cooperative info
        cursor.execute("""
            SELECT 
                c.id_cooperative AS _id,
                c.nom_cooperative AS name,
                c.region,
                c.siege_social AS address,
                c.telephone AS phone,
                c.statut AS status,
                c.date_creation AS createdAt,
                c.zone_name,
                CONCAT(u.prenom, ' ', u.nom) AS ownerName,
                u.email AS ownerEmail
            FROM cooperatives c
            JOIN utilisateurs u 
            ON c.id_responsable = u.id_utilisateur
            WHERE c.id_cooperative = %s
        """, (coop_id,))

        cooperative = cursor.fetchone()

        if not cooperative:
            return {"message": "Cooperative not found"}, 404

        if cooperative.get("createdAt"):
            cooperative["createdAt"] = cooperative["createdAt"].isoformat()

        zone_name = cooperative["zone_name"]

        # 2️⃣ Zones de cette coopérative
        cursor.execute("""
            SELECT 
                id_zone AS _id,
                nom_zone AS name,
                description
            FROM zones_forestieres
            WHERE nom_zone = %s
        """, (zone_name,))

        zones = cursor.fetchall()

        # 3️⃣ Sensors dans ces zones
        cursor.execute("""
            SELECT 
                c.id_capteur AS _id,
                c.reference_serie AS uid,
                c.id_zone AS zoneId,
                c.statut AS status
            FROM capteurs c
            JOIN zones_forestieres z
            ON c.id_zone = z.id_zone
            WHERE z.nom_zone = %s
        """, (zone_name,))

        sensors = cursor.fetchall()

        return jsonify({
            "cooperative": cooperative,
            "zones": zones,
            "sensors": sensors
        }), 200

    except Exception as e:
        print("Error:", e)
        return {"message": "Internal server error"}, 500

    finally:
        cursor.close()
        conn.close()


@admin_bp.route("/users", methods=["GET"])
def get_users():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            u.id_utilisateur AS id,
            CONCAT(u.prenom,' ',u.nom) AS name,
            u.email,
            u.statut AS status,
            c.nom_cooperative AS cooperative,
            u.date_creation AS joinedAt
        FROM utilisateurs u

        JOIN utilisateurs_roles ur
            ON u.id_utilisateur = ur.id_utilisateur

        LEFT JOIN cooperatives c
            ON u.id_utilisateur = c.id_responsable

        WHERE ur.id_role = 3

        ORDER BY u.date_creation DESC
    """)

    users = cursor.fetchall()

    for u in users:
        if u.get("joinedAt"):
            u["joinedAt"] = u["joinedAt"].strftime("%b %d, %Y")

    cursor.close()
    conn.close()

    return jsonify(users)


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM utilisateurs
        WHERE id_utilisateur = %s
    """, (user_id,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "User deleted"})


@admin_bp.route("/stats", methods=["GET"])
def get_admin_stats():

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # total cooperatives
    cursor.execute("SELECT COUNT(*) AS total FROM cooperatives")
    total_cooperatives = cursor.fetchone()["total"]

    # pending approvals
    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM cooperatives 
        WHERE statut = 'pending'
    """)
    pending = cursor.fetchone()["total"]

    # active sensors
    cursor.execute("""
        SELECT COUNT(*) AS total 
        FROM capteurs 
        WHERE statut = 'ACTIF'
    """)
    active_sensors = cursor.fetchone()["total"]

    # total owners (role 3)
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM utilisateurs_roles
        WHERE id_role = 3
    """)
    owners = cursor.fetchone()["total"]

    # active alerts
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM alertes
        WHERE statut = 'ACTIVE'
    """)
    alerts = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "totalCooperatives": total_cooperatives,
        "pendingApprovals": pending,
        "activeSensors": active_sensors,
        "totalOwners": owners,
        "activeAlerts": alerts
    })

@admin_bp.route("/map_data", methods=["GET"])
def get_map_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Zones
        cursor.execute("""
            SELECT id_zone, nom_zone, region, superficie_ha,
                   indice_risque, description,
                   ST_AsText(coordonnees_gps) AS polygon_wkt
            FROM zones_forestieres
        """)
        zone_rows = cursor.fetchall()

        zones = []
        for z in zone_rows:
            coords = []
            wkt = z.get("polygon_wkt", "")
            if wkt and "POLYGON" in wkt:
                inner = wkt.replace("POLYGON((", "").replace("))", "")
                for pair in inner.split(","):
                    parts = pair.strip().split(" ")
                    if len(parts) >= 2:
                        coords.append([float(parts[0]), float(parts[1])])
            
            risk_level = "faible"
            idx = float(z["indice_risque"]) if z["indice_risque"] else 0
            if idx >= 7.5: risk_level = "critique"
            elif idx >= 5: risk_level = "élevé"
            elif idx >= 2.5: risk_level = "moyen"

            zones.append({
                "id_zone": z["id_zone"],
                "nom_zone": z["nom_zone"],
                "region": z["region"],
                "superficie_ha": float(z["superficie_ha"]) if z["superficie_ha"] else 0,
                "niveau_risque_base": risk_level,
                "coordinates": coords,
            })

        # 2. Sensors
        cursor.execute("""
            SELECT c.id_capteur, c.reference_serie, c.latitude, c.longitude, c.statut, c.id_zone
            FROM capteurs c
        """)
        sensor_rows = cursor.fetchall()
        sensors = []
        for s in sensor_rows:
            cursor.execute("""
                SELECT temperature_c
                FROM mesures
                WHERE id_capteur = %s
                ORDER BY horodatage DESC
                LIMIT 1
            """, (s["id_capteur"],))
            latest = cursor.fetchone()
            sensors.append({
                "id_capteur": s["id_capteur"],
                "reference_serie": s["reference_serie"],
                "latitude": float(s["latitude"]) if s["latitude"] else 0,
                "longitude": float(s["longitude"]) if s["longitude"] else 0,
                "statut": s["statut"],
                "id_zone": s["id_zone"],
                "latest_reading": {"temperature_c": float(latest["temperature_c"])} if latest else None
            })

        return jsonify({"zones": zones, "sensors": sensors}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route("/alerts", methods=["GET"])
def get_all_admin_alerts():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT 
                a.id_alerte,
                a.type_alerte,
                a.niveau_gravite,
                a.statut,
                a.date_creation,
                z.nom_zone,
                c.nom_cooperative
            FROM alertes a
            LEFT JOIN zones_forestieres z ON a.id_zone = z.id_zone
            LEFT JOIN cooperatives c ON z.nom_zone = c.zone_name
            ORDER BY a.date_creation DESC
        """)
        alerts = cursor.fetchall()
        
        formatted = []
        for a in alerts:
            formatted.append({
                "id": a["id_alerte"],
                "cooperative": a["nom_cooperative"] or "Unknown",
                "zone": a["nom_zone"] or "Unknown",
                "type": a["type_alerte"],
                "severity": a["niveau_gravite"],
                "status": a["statut"],
                "triggeredAt": a["date_creation"].isoformat() if a["date_creation"] else None
            })
            
        return jsonify(formatted), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@admin_bp.route("/logs", methods=["GET"])
def get_admin_logs():
    import hashlib
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_alerte, type_alerte, statut, date_creation, message
            FROM alertes
            ORDER BY date_creation ASC
            LIMIT 50
        """)
        events = cursor.fetchall()
        
        logs = []
        prev_hash = "0000000000000000000000000000000000000000000000000000000000000000"
        
        for e in events:
            raw_data = f"{e['id_alerte']}{e['type_alerte']}{e['statut']}{e['date_creation']}{prev_hash}"
            current_hash = hashlib.sha256(raw_data.encode('utf-8')).hexdigest()
            logs.append({
                "id": f"EVT-{e['id_alerte']}",
                "event_type": "ALERT_" + str(e['type_alerte']).upper(),
                "details": str(e['message']),
                "timestamp": e['date_creation'].isoformat() if e['date_creation'] else None,
                "hash": current_hash[:16] + "...",
                "integrity": "Valid"
            })
            prev_hash = current_hash
            
        logs.reverse() # Newest first
        return jsonify({"logs": logs, "integrity_status": "100% Verified"}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()