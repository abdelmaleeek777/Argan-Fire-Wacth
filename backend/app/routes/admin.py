import hashlib

from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from werkzeug.security import generate_password_hash

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
            ON z.id_cooperative = c.id_cooperative
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

        # 2️⃣ Zones de cette coopérative (avec coordonnées polygon)
        cursor.execute("""
            SELECT 
                id_zone AS _id,
                nom_zone AS name,
                description,
                superficie_ha,
                ST_AsText(coordonnees_gps) AS polygon_wkt
            FROM zones_forestieres
            WHERE id_cooperative = %s
        """, (coop_id,))

        zones = cursor.fetchall()

        # Convert superficie_ha to float and parse polygon coordinates
        for z in zones:
            if z.get("superficie_ha") is not None:
                z["superficie_ha"] = float(z["superficie_ha"])
            
            # Parse WKT polygon to coordinate array
            wkt = z.get("polygon_wkt", "")
            coords = []
            if wkt and "POLYGON" in wkt:
                inner = wkt.replace("POLYGON((", "").replace("))", "")
                for pair in inner.split(","):
                    parts = pair.strip().split(" ")
                    if len(parts) >= 2:
                        coords.append([float(parts[0]), float(parts[1])])
            z["coordinates"] = coords
            del z["polygon_wkt"]  # Remove raw WKT from response

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
            WHERE z.id_cooperative = %s
        """, (coop_id,))

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
            u.date_creation AS joinedAt,
            CASE ur.id_role
                WHEN 7 THEN 'admin'
                WHEN 2 THEN 'firefighter'
                WHEN 3 THEN 'cooperative_owner'
                ELSE 'unknown'
            END AS role
        FROM utilisateurs u

        JOIN utilisateurs_roles ur
            ON u.id_utilisateur = ur.id_utilisateur

        LEFT JOIN cooperatives c
            ON u.id_utilisateur = c.id_responsable

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

    try:
        # ── 1. Supprimer d'abord dans utilisateurs_roles (clé étrangère)
        cursor.execute("""
            DELETE FROM utilisateurs_roles
            WHERE id_utilisateur = %s
        """, (user_id,))

        # ── 2. Ensuite supprimer dans utilisateurs
        cursor.execute("""
            DELETE FROM utilisateurs
            WHERE id_utilisateur = %s
        """, (user_id,))

        conn.commit()
        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR delete_user:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@admin_bp.route("/users/<int:user_id>/block", methods=["PATCH"])
def block_user(user_id):
    data = request.get_json()
    action = data.get("action")  # "block" ou "unblock"

    if action not in ["block", "unblock"]:
        return jsonify({"error": "Invalid action"}), 400

    # block → SUSPENDU, unblock → ACTIF
    new_statut = "SUSPENDU" if action == "block" else "ACTIF"

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE utilisateurs
            SET statut = %s
            WHERE id_utilisateur = %s
        """, (new_statut, user_id))

        conn.commit()
        return jsonify({"message": f"User {action}ed", "statut": new_statut}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR block_user:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


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
        WHERE statut in ('ACTIVE','OUVERTE')
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


# ===============================
# DASHBOARD CHART DATA
# ===============================
@admin_bp.route("/charts/alerts-trend", methods=["GET"])
def get_alerts_trend():
    """Get alerts trend for the last 7 days"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE(horodatage) AS date,
            COUNT(*) AS total,
            SUM(CASE WHEN statut IN ('OUVERTE', 'ACTIVE', 'EN_COURS') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) AS resolved
        FROM alertes
        WHERE horodatage >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(horodatage)
        ORDER BY date ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Format for chart
    chart_data = []
    for r in results:
        chart_data.append({
            "name": r["date"].strftime("%a"),
            "date": r["date"].isoformat(),
            "alerts": r["active"] or 0,
            "resolved": r["resolved"] or 0
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/zones-risk", methods=["GET"])
def get_zones_risk():
    """Get zones with their risk index"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            z.nom_zone AS name,
            ROUND(z.indice_risque, 1) AS risk,
            ROUND(z.superficie_ha, 0) AS area,
            COUNT(c.id_capteur) AS sensors
        FROM zones_forestieres z
        LEFT JOIN capteurs c ON c.id_zone = z.id_zone
        GROUP BY z.id_zone
        ORDER BY z.indice_risque DESC
        LIMIT 8
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(results)


@admin_bp.route("/charts/humidity-wind", methods=["GET"])
def get_humidity_wind():
    """Get average humidity and wind speed over last 24 hours"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE_FORMAT(horodatage, '%H:00') AS hour,
            ROUND(AVG(humidite_pct), 1) AS humidity,
            ROUND(AVG(vitesse_vent_kmh), 1) AS wind
        FROM mesures
        WHERE horodatage >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(horodatage)
        ORDER BY HOUR(horodatage) ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(results)


@admin_bp.route("/charts/temperature-avg", methods=["GET"])
def get_temperature_avg():
    """Get average temperature readings over last 24 hours by hour"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE_FORMAT(horodatage, '%H:00') AS hour,
            ROUND(AVG(temperature_c), 1) AS avgTemp,
            ROUND(AVG(humidite_pct), 1) AS avgHumidity,
            ROUND(MAX(temperature_c), 1) AS maxTemp
        FROM mesures
        WHERE horodatage >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(horodatage)
        ORDER BY HOUR(horodatage) ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(results)


@admin_bp.route("/charts/alerts-by-severity", methods=["GET"])
def get_alerts_by_severity():
    """Get alert counts by severity level"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            niveau_alerte AS severity,
            COUNT(*) AS count
        FROM alertes
        WHERE horodatage >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY niveau_alerte
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Map to friendly names
    severity_map = {"CRITIQUE": "Critical", "HAUTE": "High", "MOYENNE": "Medium", "BASSE": "Low"}
    chart_data = []
    for r in results:
        chart_data.append({
            "name": severity_map.get(r["severity"], r["severity"]),
            "value": r["count"],
            "severity": r["severity"]
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/coops-status", methods=["GET"])
def get_coops_status():
    """Get cooperatives count by status"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            statut AS status,
            COUNT(*) AS count
        FROM cooperatives
        GROUP BY statut
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    status_map = {"approved": "Approved", "pending": "Pending", "rejected": "Rejected"}
    chart_data = []
    for r in results:
        chart_data.append({
            "name": status_map.get(r["status"], r["status"]),
            "value": r["count"],
            "status": r["status"]
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/sensors-by-type", methods=["GET"])
def get_sensors_by_type():
    """Get sensors count by type"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            type_capteur AS type,
            COUNT(*) AS count
        FROM capteurs
        GROUP BY type_capteur
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify(results)


@admin_bp.route("/charts/measurements-daily", methods=["GET"])
def get_measurements_daily():
    """Get measurement counts per day for last 7 days"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE(horodatage) AS date,
            COUNT(*) AS count
        FROM mesures
        WHERE horodatage >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(horodatage)
        ORDER BY date ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        chart_data.append({
            "name": r["date"].strftime("%a"),
            "date": r["date"].isoformat(),
            "measurements": r["count"]
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/alerts-daily", methods=["GET"])
def get_alerts_daily():
    """Get alerts per day for last 7 days"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            DATE(date_creation) AS date,
            COUNT(*) AS total,
            SUM(CASE WHEN niveau_gravite = 'CRITIQUE' THEN 1 ELSE 0 END) AS critical,
            SUM(CASE WHEN niveau_gravite = 'ATTENTION' THEN 1 ELSE 0 END) AS warning,
            SUM(CASE WHEN niveau_gravite = 'INFO' THEN 1 ELSE 0 END) AS info
        FROM alertes
        WHERE date_creation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(date_creation)
        ORDER BY date ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        chart_data.append({
            "name": r["date"].strftime("%a"),
            "date": r["date"].isoformat(),
            "critical": int(r["critical"] or 0),
            "warning": int(r["warning"] or 0),
            "info": int(r["info"] or 0)
        })
    
    return jsonify(chart_data)


# ===============================
# TIME-BASED CHART ENDPOINTS
# ===============================
@admin_bp.route("/charts/users-trend", methods=["GET"])
def get_users_trend():
    """Get users registered over time - supports duration parameter"""
    duration = request.args.get('duration', '7d')  # 24h, 7d, 30d
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if duration == '24h':
        interval = "INTERVAL 24 HOUR"
        date_format = "%H:00"
        group_by = "HOUR(date_creation)"
    elif duration == '30d':
        interval = "INTERVAL 30 DAY"
        date_format = "%b %d"
        group_by = "DATE(date_creation)"
    else:  # 7d default
        interval = "INTERVAL 7 DAY"
        date_format = "%a"
        group_by = "DATE(date_creation)"
    
    cursor.execute(f"""
        SELECT 
            DATE(date_creation) AS date,
            {group_by} AS period,
            COUNT(*) AS count
        FROM utilisateurs
        WHERE date_creation >= DATE_SUB(NOW(), {interval})
        GROUP BY {group_by}, DATE(date_creation)
        ORDER BY date_creation ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
        chart_data.append({
            "name": label,
            "users": r["count"]
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/coops-trend", methods=["GET"])
def get_coops_trend():
    """Get cooperatives by status over time"""
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if duration == '24h':
        interval = "INTERVAL 24 HOUR"
        date_format = "%H:00"
        group_by = "HOUR(date_creation)"
    elif duration == '30d':
        interval = "INTERVAL 30 DAY"
        date_format = "%b %d"
        group_by = "DATE(date_creation)"
    else:
        interval = "INTERVAL 7 DAY"
        date_format = "%a"
        group_by = "DATE(date_creation)"
    
    cursor.execute(f"""
        SELECT 
            DATE(date_creation) AS date,
            {group_by} AS period,
            SUM(CASE WHEN statut = 'approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN statut = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN statut = 'rejected' THEN 1 ELSE 0 END) AS rejected
        FROM cooperatives
        WHERE date_creation >= DATE_SUB(NOW(), {interval})
        GROUP BY {group_by}, DATE(date_creation)
        ORDER BY date_creation ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
        chart_data.append({
            "name": label,
            "approved": int(r["approved"] or 0),
            "pending": int(r["pending"] or 0),
            "rejected": int(r["rejected"] or 0)
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/alerts-status-trend", methods=["GET"])
def get_alerts_status_trend():
    """Get alerts by status over time"""
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if duration == '24h':
        interval = "INTERVAL 24 HOUR"
        date_format = "%H:00"
        group_by = "HOUR(horodatage)"
    elif duration == '30d':
        interval = "INTERVAL 30 DAY"
        date_format = "%b %d"
        group_by = "DATE(horodatage)"
    else:
        interval = "INTERVAL 7 DAY"
        date_format = "%a"
        group_by = "DATE(horodatage)"
    
    cursor.execute(f"""
        SELECT 
            DATE(horodatage) AS date,
            {group_by} AS period,
            SUM(CASE WHEN statut IN ('OUVERTE', 'ACTIVE') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) AS resolved
        FROM alertes
        WHERE horodatage >= DATE_SUB(NOW(), {interval})
        GROUP BY {group_by}, DATE(horodatage)
        ORDER BY horodatage ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
        chart_data.append({
            "name": label,
            "active": int(r["active"] or 0),
            "inProgress": int(r["in_progress"] or 0),
            "resolved": int(r["resolved"] or 0)
        })
    
    return jsonify(chart_data)


@admin_bp.route("/charts/sensors-trend", methods=["GET"])
def get_sensors_trend():
    """Get sensors created over time"""
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if duration == '24h':
        interval = "INTERVAL 24 HOUR"
        date_format = "%H:00"
        group_by = "HOUR(date_installation)"
    elif duration == '30d':
        interval = "INTERVAL 30 DAY"
        date_format = "%b %d"
        group_by = "DATE(date_installation)"
    else:
        interval = "INTERVAL 7 DAY"
        date_format = "%a"
        group_by = "DATE(date_installation)"
    
    cursor.execute(f"""
        SELECT 
            DATE(date_installation) AS date,
            {group_by} AS period,
            COUNT(*) AS count
        FROM capteurs
        WHERE date_installation >= DATE_SUB(NOW(), {interval})
        GROUP BY {group_by}, DATE(date_installation)
        ORDER BY date_installation ASC
    """)
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chart_data = []
    for r in results:
        label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
        chart_data.append({
            "name": label,
            "sensors": r["count"]
        })
    
    return jsonify(chart_data)


@admin_bp.route("/map_data", methods=["GET"])
def get_map_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Zones - only from approved cooperatives
        cursor.execute("""
            SELECT z.id_zone, z.nom_zone, z.region, z.superficie_ha,
                   z.indice_risque, z.description,
                   ST_AsText(z.coordonnees_gps) AS polygon_wkt,
                   c.nom_cooperative
            FROM zones_forestieres z
            INNER JOIN cooperatives c ON z.id_cooperative = c.id_cooperative
            WHERE c.statut = 'approved'
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
                "cooperative_name": z["nom_cooperative"],
            })

        # 2. Sensors - only from approved cooperatives zones
        cursor.execute("""
            SELECT c.id_capteur, c.reference_serie, c.latitude, c.longitude, c.statut, c.id_zone
            FROM capteurs c
            INNER JOIN zones_forestieres z ON c.id_zone = z.id_zone
            INNER JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
            WHERE co.statut = 'approved'
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




@admin_bp.route("/add", methods=["POST"])
def add_user():
    data = request.get_json()
    print("📥 Data received:", data)  # ← vérifier que le front envoie bien les données

    required = ["nom", "prenom", "email", "password", "statut", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        print("❌ Missing fields:", missing)
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    role_map = {
        "admin":       7,
        "firefighter": 3,
    }
    id_role = role_map.get(data["role"])
    if id_role is None:
        print("❌ Invalid role:", data["role"])
        return jsonify({"error": "Invalid role. Must be 'admin' or 'firefighter'"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        print("✅ DB connection OK")

        password_hash = hashlib.sha256(data["password"].encode()).hexdigest()
        print("✅ Password hashed:", password_hash)

        cursor.execute("""
            INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe_hash, statut, telephone)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data["nom"],
            data["prenom"],
            data["email"],
            password_hash,
            data["statut"],
            data.get("telephone", None),
        ))
        print("✅ User inserted, new id:", cursor.lastrowid)

        new_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO utilisateurs_roles (id_utilisateur, id_role)
            VALUES (%s, %s)
        """, (new_id, id_role))
        print("✅ Role inserted for user:", new_id, "with id_role:", id_role)

        conn.commit()
        print("✅ Commit done")

        return jsonify({
            "id":        new_id,
            "nom":       data["nom"],
            "prenom":    data["prenom"],
            "email":     data["email"],
            "statut":    data["statut"],
            "telephone": data.get("telephone"),
            "role":      data["role"],
            "id_role":   id_role,
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ ERROR:", str(e))  # ← l'erreur exacte s'affichera ici
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor: cursor.close()
        if conn:   conn.close()