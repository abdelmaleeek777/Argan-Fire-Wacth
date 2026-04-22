from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from app.utils.auth import cooperative_required, admin_required

coop_bp = Blueprint("cooperative", __name__)

def _ensure_cooperative_owner(coop_id):
    """Return (allowed, response, status) after ownership check."""
    user = getattr(request, "current_user", None)
    if not user:
        return False, jsonify({"error": "Missing authentication context"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_responsable FROM cooperatives WHERE id_cooperative = %s",
            (coop_id,),
        )
        coop_check = cursor.fetchone()
        if not coop_check or coop_check["id_responsable"] != user["user_id"]:
            return False, jsonify({"error": "Unauthorized"}), 403
        return True, None, None
    finally:
        cursor.close()
        conn.close()


@coop_bp.route("/cooperative/<int:coop_id>/dashboard", methods=["GET"])
@cooperative_required
def cooperative_dashboard(coop_id):
    """Get cooperative dashboard - ownership check required."""
    allowed, resp, status = _ensure_cooperative_owner(coop_id)
    if not allowed:
        return resp, status
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # ── 1. Cooperative info ──
        cursor.execute("""
            SELECT c.id_cooperative, c.nom_cooperative, c.siege_social,
                   c.email_contact, c.telephone, c.region, c.zone_name,
                   c.date_creation, c.statut, c.id_zone,
                   u.nom, u.prenom
            FROM cooperatives c
            JOIN utilisateurs u ON c.id_responsable = u.id_utilisateur
            WHERE c.id_cooperative = %s
        """, (coop_id,))
        coop = cursor.fetchone()

        if not coop:
            return jsonify({"message": "Cooperative not found"}), 404

        cooperative_info = {
            "id_cooperative": coop["id_cooperative"],
            "nom_cooperative": coop["nom_cooperative"],
            "responsable": f"{coop['prenom']} {coop['nom']}",
            "siege_social": coop["siege_social"],
            "email_contact": coop["email_contact"],
            "telephone": coop["telephone"],
            "region": coop["region"],
            "date_creation": str(coop["date_creation"]) if coop["date_creation"] else None,
            "statut": coop["statut"],
        }

        zone_id = coop["id_zone"]

        # ── 2. Zone info with polygon coordinates ──
        zones = []
        if zone_id:
            cursor.execute("""
                SELECT id_zone, nom_zone, region, superficie_ha,
                       indice_risque, description,
                       ST_AsText(coordonnees_gps) AS polygon_wkt
                FROM zones_forestieres
                WHERE id_zone = %s
            """, (zone_id,))
            zone_rows = cursor.fetchall()

            for z in zone_rows:
                # Parse WKT POLYGON((lng lat, ...)) into [[lng, lat], ...]
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
                if idx >= 7.5:
                    risk_level = "critique"
                elif idx >= 5:
                    risk_level = "élevé"
                elif idx >= 2.5:
                    risk_level = "moyen"

                zones.append({
                    "id_zone": z["id_zone"],
                    "nom_zone": z["nom_zone"],
                    "region": z["region"],
                    "superficie_ha": float(z["superficie_ha"]) if z["superficie_ha"] else 0,
                    "indice_risque": float(z["indice_risque"]) if z["indice_risque"] else 0,
                    "niveau_risque_base": risk_level,
                    "coordinates": coords,
                })

        # ── 3. Sensors with latest reading ──
        sensors = []
        if zone_id:
            cursor.execute("""
                SELECT c.id_capteur, c.reference_serie, c.type_capteur,
                       c.modele, c.latitude, c.longitude, c.altitude_m,
                       c.statut, c.date_installation, c.id_zone
                FROM capteurs c
                WHERE c.id_zone = %s
            """, (zone_id,))
            sensor_rows = cursor.fetchall()

            for s in sensor_rows:
                # Latest reading for this sensor
                cursor.execute("""
                    SELECT temperature_c, humidite_pct, vitesse_vent_kmh,
                           horodatage, qualite_signal
                    FROM mesures
                    WHERE id_capteur = %s
                    ORDER BY horodatage DESC
                    LIMIT 1
                """, (s["id_capteur"],))
                latest = cursor.fetchone()

                sensors.append({
                    "id_capteur": s["id_capteur"],
                    "reference_serie": s["reference_serie"],
                    "type_capteur": s["type_capteur"],
                    "modele": s["modele"],
                    "latitude": float(s["latitude"]),
                    "longitude": float(s["longitude"]),
                    "altitude_m": float(s["altitude_m"]) if s["altitude_m"] else None,
                    "statut": s["statut"],
                    "date_installation": str(s["date_installation"]),
                    "id_zone": s["id_zone"],
                    "latest_reading": {
                        "temperature_c": float(latest["temperature_c"]),
                        "humidite_pct": float(latest["humidite_pct"]) if latest["humidite_pct"] else None,
                        "vitesse_vent_kmh": float(latest["vitesse_vent_kmh"]) if latest["vitesse_vent_kmh"] else None,
                        "horodatage": latest["horodatage"].isoformat() if latest["horodatage"] else None,
                        "qualite_signal": latest["qualite_signal"],
                    } if latest else None,
                })

        # ── 4. Stats ──
        capteurs_actifs = sum(1 for s in sensors if s["statut"] == "ACTIF")
        capteurs_en_panne = sum(1 for s in sensors if s["statut"] != "ACTIF")

        # Active alerts count
        active_alerts_count = 0
        alerts_week_count = 0
        temp_max = 0
        derniere_mesure = None

        if zone_id:
            cursor.execute("""
                SELECT COUNT(*) AS cnt FROM alertes
                WHERE id_zone = %s AND statut IN ('OUVERTE', 'EN_COURS')
            """, (zone_id,))
            row = cursor.fetchone()
            active_alerts_count = row["cnt"] if row else 0

            cursor.execute("""
                SELECT COUNT(*) AS cnt FROM alertes
                WHERE id_zone = %s AND date_creation >= NOW() - INTERVAL 7 DAY
            """, (zone_id,))
            row = cursor.fetchone()
            alerts_week_count = row["cnt"] if row else 0

            # Max temp in last 24h
            sensor_ids = [s["id_capteur"] for s in sensors]
            if sensor_ids:
                placeholders = ",".join(["%s"] * len(sensor_ids))
                query = """
                    SELECT MAX(temperature_c) AS max_temp,
                           MAX(horodatage) AS last_reading
                    FROM mesures
                    WHERE id_capteur IN ({})
                      AND horodatage >= NOW() - INTERVAL 24 HOUR
                """.format(placeholders)
                cursor.execute(query, tuple(sensor_ids))
                row = cursor.fetchone()
                if row and row["max_temp"]:
                    temp_max = float(row["max_temp"])
                if row and row["last_reading"]:
                    derniere_mesure = row["last_reading"].isoformat()

        stats = {
            "zones_total": len(zones),
            "capteurs_actifs": capteurs_actifs,
            "capteurs_en_panne": capteurs_en_panne,
            "alertes_actives": active_alerts_count,
            "alertes_semaine": alerts_week_count,
            "temperature_max": temp_max,
            "derniere_mesure": derniere_mesure,
        }

        # ── 5. Active + recent alerts ──
        alerts = []
        if zone_id:
            cursor.execute("""
                SELECT a.id_alerte, a.type_alerte, a.niveau_gravite,
                       a.message, a.statut, a.date_creation, a.date_resolution,
                       a.id_zone, z.nom_zone,
                       m.temperature_c
                FROM alertes a
                JOIN zones_forestieres z ON a.id_zone = z.id_zone
                LEFT JOIN mesures m ON a.id_mesure = m.id_mesure
                WHERE a.id_zone = %s
                ORDER BY a.date_creation DESC
                LIMIT 20
            """, (zone_id,))
            alert_rows = cursor.fetchall()

            # Map DB gravite to frontend urgence keys
            gravite_map = {
                "INFO": "vigilance",
                "ATTENTION": "alerte",
                "CRITIQUE": "urgence_maximale",
            }
            statut_map = {
                "OUVERTE": "active",
                "EN_COURS": "active",
                "RESOLUE": "traitée",
                "ANNULEE": "fausse_alerte",
            }

            for a in alert_rows:
                alerts.append({
                    "id_alerte": a["id_alerte"],
                    "zone": a["nom_zone"],
                    "temperature_detectee": float(a["temperature_c"]) if a["temperature_c"] else None,
                    "niveau_urgence": gravite_map.get(a["niveau_gravite"], "vigilance"),
                    "statut": statut_map.get(a["statut"], "active"),
                    "date_heure_declenchement": a["date_creation"].isoformat() if a["date_creation"] else None,
                    "message": a["message"],
                })

        # ── 6. Temperature history (last 24h) ──
        temperature_history = []
        if zone_id:
            sensor_ids = [s["id_capteur"] for s in sensors]
            if sensor_ids:
                placeholders = ",".join(["%s"] * len(sensor_ids))
                query = """
                    SELECT DATE_FORMAT(horodatage, '%%H:00') AS time_label,
                           ROUND(AVG(temperature_c), 1) AS temp,
                           ROUND(AVG(humidite_pct), 1) AS hum
                    FROM mesures
                    WHERE id_capteur IN ({})
                      AND horodatage >= NOW() - INTERVAL 24 HOUR
                    GROUP BY time_label
                    ORDER BY MIN(horodatage)
                """.format(placeholders)
                cursor.execute(query, tuple(sensor_ids))
                temperature_history = []
                for row in cursor.fetchall():
                    temperature_history.append({
                        "time": row["time_label"],
                        "temp": float(row["temp"]) if row["temp"] else 0,
                        "hum": float(row["hum"]) if row["hum"] else 0,
                    })

        return jsonify({
            "cooperative": cooperative_info,
            "zones": zones,
            "sensors": sensors,
            "stats": stats,
            "alerts": alerts,
            "temperature_history": temperature_history,
        }), 200

    except Exception as e:
        print(f"Cooperative Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Server error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()


# ===============================
# COOPERATIVE CHART ENDPOINTS
# ===============================
@coop_bp.route("/cooperative/<int:coop_id>/charts/temperature", methods=["GET"])
@cooperative_required
def get_cooperative_temperature_chart(coop_id):
    """Get temperature data for cooperative charts - ownership check required."""
    allowed, resp, status = _ensure_cooperative_owner(coop_id)
    if not allowed:
        return resp, status
    
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get cooperative's sensors
        cursor.execute("""
            SELECT c.id_capteur FROM capteurs c
            JOIN zones_forestieres z ON c.id_zone = z.id_zone
            WHERE z.id_cooperative = %s
        """, (coop_id,))
        sensor_ids = [row['id_capteur'] for row in cursor.fetchall()]
        
        if not sensor_ids:
            return jsonify([])
            
        if duration == '24h':
            interval = "INTERVAL 24 HOUR"
            date_format = "%H:00"
            group_by = "HOUR(horodatage)"
        elif duration == '30d':
            interval = "INTERVAL 30 DAY"
            date_format = "%b %d"
            group_by = "DATE(horodatage)"
        else:  # 7d default
            interval = "INTERVAL 7 DAY"
            date_format = "%a"
            group_by = "DATE(horodatage)"
        
        placeholders = ",".join(["%s"] * len(sensor_ids))
        query = """
            SELECT 
                DATE(horodatage) AS date,
                {} AS period,
                ROUND(AVG(temperature_c), 1) AS avgTemp,
                ROUND(MAX(temperature_c), 1) AS maxTemp,
                ROUND(AVG(humidite_pct), 1) AS humidity
            FROM mesures
            WHERE id_capteur IN ({})
            AND horodatage >= DATE_SUB(NOW(), {})
            GROUP BY {}, DATE(horodatage)
            ORDER BY horodatage ASC
        """.format(group_by, placeholders, interval, group_by)
        cursor.execute(query, tuple(sensor_ids))
        
        results = cursor.fetchall()
        chart_data = []
        for r in results:
            label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
            chart_data.append({
                "name": label,
                "avgTemp": float(r["avgTemp"] or 0),
                "maxTemp": float(r["maxTemp"] or 0),
                "humidity": float(r["humidity"] or 0)
            })
        
        return jsonify(chart_data)
        
    except Exception as e:
        print(f"Error fetching temperature chart: {e}")
        return jsonify([])
    finally:
        cursor.close()
        conn.close()


@coop_bp.route("/cooperative/<int:coop_id>/charts/alerts", methods=["GET"])
@cooperative_required
def get_cooperative_alerts_chart(coop_id):
    """Get alerts data for cooperative charts - ownership check required."""
    allowed, resp, status = _ensure_cooperative_owner(coop_id)
    if not allowed:
        return resp, status
    
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
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
        
        query = """
            SELECT 
                DATE(date_creation) AS date,
                {} AS period,
                SUM(CASE WHEN statut IN ('OUVERTE', 'EN_COURS') THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN statut = 'RESOLUE' THEN 1 ELSE 0 END) AS resolved
            FROM alertes a
            JOIN capteurs c ON a.id_capteur = c.id_capteur
            JOIN zones_forestieres z ON c.id_zone = z.id_zone
            WHERE z.id_cooperative = %s
            AND date_creation >= DATE_SUB(NOW(), {})
            GROUP BY {}, DATE(date_creation)
            ORDER BY date_creation ASC
        """.format(group_by, interval, group_by)
        cursor.execute(query, (coop_id,))
        
        results = cursor.fetchall()
        chart_data = []
        for r in results:
            label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
            chart_data.append({
                "name": label,
                "active": int(r["active"] or 0),
                "resolved": int(r["resolved"] or 0)
            })
        
        return jsonify(chart_data)
        
    except Exception as e:
        print(f"Error fetching alerts chart: {e}")
        return jsonify([])
    finally:
        cursor.close()
        conn.close()


@coop_bp.route("/cooperative/<int:coop_id>/charts/sensors", methods=["GET"])
@cooperative_required
def get_cooperative_sensors_chart(coop_id):
    """Get sensor readings data for cooperative charts - ownership check required."""
    allowed, resp, status = _ensure_cooperative_owner(coop_id)
    if not allowed:
        return resp, status
    
    duration = request.args.get('duration', '7d')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get cooperative's sensors
        cursor.execute("""
            SELECT c.id_capteur FROM capteurs c
            JOIN zones_forestieres z ON c.id_zone = z.id_zone
            WHERE z.id_cooperative = %s
        """, (coop_id,))
        sensor_ids = [row['id_capteur'] for row in cursor.fetchall()]
        
        if not sensor_ids:
            return jsonify([])
            
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
        
        placeholders = ",".join(["%s"] * len(sensor_ids))
        query = """
            SELECT 
                DATE(horodatage) AS date,
                {} AS period,
                COUNT(*) AS readings
            FROM mesures
            WHERE id_capteur IN ({})
            AND horodatage >= DATE_SUB(NOW(), {})
            GROUP BY {}, DATE(horodatage)
            ORDER BY horodatage ASC
        """.format(group_by, placeholders, interval, group_by)
        cursor.execute(query, tuple(sensor_ids))
        
        results = cursor.fetchall()
        chart_data = []
        for r in results:
            label = r["date"].strftime(date_format) if r["date"] else str(r["period"])
            chart_data.append({
                "name": label,
                "readings": r["readings"]
            })
        
        return jsonify(chart_data)
        
    except Exception as e:
        print(f"Error fetching sensors chart: {e}")
        return jsonify([])
    finally:
        cursor.close()
        conn.close()
