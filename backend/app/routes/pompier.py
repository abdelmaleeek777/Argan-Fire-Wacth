# app/routes/pompier.py
from flask import Blueprint, jsonify, request
from app.config import get_db_connection

pompier_bp = Blueprint("pompier", __name__)


# ── GET /api/dashboard/pompier/stats ─────────────────────────
@pompier_bp.route("/dashboard/pompier/stats", methods=["GET", "OPTIONS"])
def get_dashboard_stats():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Active alerts (OUVERTE or EN_COURS)
        cursor.execute("SELECT COUNT(*) AS count FROM alertes WHERE statut IN ('ACTIVE', 'OUVERTE', 'EN_COURS')")
        alertes_actives = cursor.fetchone()["count"]

        # Resolved alerts
        cursor.execute("SELECT COUNT(*) AS count FROM alertes WHERE statut = 'RESOLUE'")
        alertes_resolues = cursor.fetchone()["count"]

        # Total alerts
        cursor.execute("SELECT COUNT(*) AS count FROM alertes")
        alertes_total = cursor.fetchone()["count"]

        # Active incidents
        cursor.execute("SELECT COUNT(*) AS count FROM incendies WHERE statut_incendie != 'ETEINT'")
        incendies = cursor.fetchone()["count"]

        # Resolved incidents (alternative count)
        cursor.execute("SELECT COUNT(*) AS count FROM incendies WHERE statut_incendie = 'ETEINT'")
        incendies_resolus = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(DISTINCT id_zone) AS count FROM incendies WHERE statut_incendie != 'ETEINT'")
        zones = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count 
            FROM utilisateurs u
            JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
            JOIN roles r ON ur.id_role = r.id_role
            WHERE r.libelle = 'POMPIER'
            AND u.statut = 'ACTIF'
        """)
        pompiers_dispo = cursor.fetchone()["count"]

        # Use max of alertes_resolues or incendies_resolus as resolved count
        resolved_count = max(alertes_resolues, incendies_resolus)

        return jsonify({
            "alertesActives": alertes_actives,
            "alertesResolues": resolved_count,
            "alertesTotal": alertes_total,
            "incendiesEnCours": incendies,
            "pompiersDisponibles": pompiers_dispo,
            "zonesSurveillees": zones
        }), 200

    except Exception as e:
        print("❌ ERROR get_dashboard_stats:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/dashboard/pompier/incendies ─────────────────────
@pompier_bp.route("/dashboard/pompier/incendies", methods=["GET", "OPTIONS"])
def get_incendies_carte():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte AS id_incendie,
                a.niveau_gravite AS niveau,
                z.nom_zone,
                AVG(c.latitude) AS lat,
                AVG(c.longitude) AS lng
            FROM alertes a
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            LEFT JOIN capteurs c ON c.id_zone = z.id_zone
            WHERE a.statut IN ('ACTIVE', 'OUVERTE')
            GROUP BY a.id_alerte, a.niveau_gravite, z.nom_zone
            ORDER BY a.date_creation DESC
        """)
        return jsonify(cursor.fetchall()), 200

    except Exception as e:
        print("❌ ERROR get_incendies_carte:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/dashboard/pompier/alertes-critiques ─────────────
@pompier_bp.route("/dashboard/pompier/alertes-critiques", methods=["GET", "OPTIONS"])
def get_alertes_critiques():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte,
                a.niveau_gravite,
                a.statut,
                a.message,
                a.date_creation,
                z.nom_zone,
                c.nom_cooperative,
                AVG(cap.latitude) AS lat,
                AVG(cap.longitude) AS lng,
                MAX(m.temperature_c) AS temperature
            FROM alertes a
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            LEFT JOIN cooperatives c ON z.id_cooperative = c.id_cooperative
            LEFT JOIN capteurs cap ON cap.id_zone = z.id_zone
            LEFT JOIN mesures m ON a.id_mesure = m.id_mesure
            GROUP BY a.id_alerte, a.niveau_gravite, a.statut, a.message, a.date_creation, z.nom_zone, c.nom_cooperative
            ORDER BY 
                CASE a.niveau_gravite 
                    WHEN 'CRITIQUE' THEN 1 
                    WHEN 'urgence_maximale' THEN 1
                    WHEN 'ATTENTION' THEN 2 
                    WHEN 'alerte_elevee' THEN 2
                    ELSE 3 
                END,
                a.date_creation DESC
            LIMIT 100
        """)
        rows = cursor.fetchall()
        for row in rows:
            if row.get("date_creation"):
                row["date_creation"] = row["date_creation"].isoformat()
        return jsonify(rows), 200

    except Exception as e:
        print("❌ ERROR get_alertes_critiques:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/pompiers ─────────────────────────────────────────
@pompier_bp.route("/pompiers", methods=["GET", "OPTIONS"])
def get_pompiers():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                u.id_utilisateur AS id_pompier,
                u.nom,
                u.prenom,
                u.telephone,
                u.statut
            FROM utilisateurs u
            JOIN utilisateurs_roles ur ON u.id_utilisateur = ur.id_utilisateur
            JOIN roles r ON ur.id_role = r.id_role
            WHERE r.libelle = 'POMPIER'
            ORDER BY u.nom ASC
        """)
        return jsonify(cursor.fetchall()), 200

    except Exception as e:
        print("❌ ERROR get_pompiers:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/incidents ────────────────────────────────────────
@pompier_bp.route("/incidents", methods=["GET", "OPTIONS"])
def get_incidents():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                i.id_incendie,
                i.statut_incendie,
                i.date_debut,
                i.date_fin,
                i.cause_presumee,
                i.superficie_brulee_ha,
                z.id_zone,
                z.nom_zone,
                z.region
            FROM incendies i
            JOIN zones_forestieres z ON i.id_zone = z.id_zone
            ORDER BY i.date_debut DESC
        """)
        rows = cursor.fetchall()
        incidents = []
        for row in rows:
            incidents.append({
                "id_alerte":      row["id_incendie"],
                "type_alerte":    row["cause_presumee"] or "AUTOMATIQUE",
                "niveau_urgence": row["statut_incendie"],
                "statut":         row["statut_incendie"],
                "message":        f"Superficie brûlée: {row['superficie_brulee_ha']} ha" if row['superficie_brulee_ha'] else "",
                "date_creation":  row["date_debut"].isoformat() if row["date_debut"] else None,
                "zone": {
                    "id_zone":  row["id_zone"],
                    "nom_zone": row["nom_zone"],
                    "region":   row["region"],
                }
            })
        return jsonify(incidents), 200

    except Exception as e:
        print("❌ ERROR get_incidents:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── PATCH /api/pompiers/<id>/statut ──────────────────────────
@pompier_bp.route("/pompiers/<int:pompier_id>/statut", methods=["PATCH", "OPTIONS"])
def update_statut_pompier(pompier_id):
    if request.method == "OPTIONS":
        return "", 200
    
    data = request.get_json()
    new_statut = data.get("statut")

    valid_statuts = ["ACTIF", "INACTIF"]
    if new_statut not in valid_statuts:
        return jsonify({"error": f"Statut invalide. Valeurs acceptées: {valid_statuts}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE utilisateurs 
            SET statut = %s
            WHERE id_utilisateur = %s
        """, (new_statut, pompier_id))
        conn.commit()
        return jsonify({"message": "Statut mis à jour", "statut": new_statut}), 200

    except Exception as e:
        conn.rollback()
        print("❌ ERROR update_statut:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── GET /api/notifications ────────────────────────────────────
@pompier_bp.route("/notifications", methods=["GET", "OPTIONS"])
def get_notifications():
    if request.method == "OPTIONS":
        return "", 200
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                a.id_alerte AS id_notif,
                'Alerte' AS type,
                CONCAT('Alerte détectée à ', z.nom_zone, ' (', a.niveau_gravite, ')') AS message,
                FALSE AS lue,
                a.date_creation AS date,
                a.id_alerte AS lier_alerte
            FROM alertes a
            JOIN zones_forestieres z ON a.id_zone = z.id_zone
            WHERE a.statut IN ('ACTIVE', 'OUVERTE')
            ORDER BY a.date_creation DESC
        """)
        rows = cursor.fetchall()
        for r in rows:
            if r["date"]:
                r["date"] = r["date"].isoformat()
        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ── PUT /api/incidents/<id>/status ─────────────────────────────
@pompier_bp.route("/incidents/<int:alert_id>/status", methods=["PUT", "OPTIONS"])
def update_alert_status(alert_id):
    if request.method == "OPTIONS":
        return "", 200
    
    data = request.get_json()
    new_status = data.get("statut")
    
    valid_statuses = ["OUVERTE", "EN_COURS", "RESOLUE"]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Valid values: {valid_statuses}"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE alertes 
            SET statut = %s
            WHERE id_alerte = %s
        """, (new_status, alert_id))
        conn.commit()
        return jsonify({"message": "Status updated", "statut": new_status}), 200
    
    except Exception as e:
        conn.rollback()
        print("❌ ERROR update_alert_status:", e)
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()


# ── POST /api/incidents/report ─────────────────────────────────
@pompier_bp.route("/incidents/report", methods=["POST", "OPTIONS"])
def submit_incident_report():
    if request.method == "OPTIONS":
        return "", 200
    
    data = request.get_json()
    print("📝 Received incident report data:", data)
    
    id_alerte = data.get("id_alerte")
    statut_incendie = data.get("statut_incendie", "ETEINT")
    date_fin = data.get("date_fin")
    superficie_brulee_ha = data.get("superficie_brulee_ha", 0)
    cause_presumee = data.get("cause_presumee", "")
    observations = data.get("observations", "")
    
    if not id_alerte:
        print("❌ Missing id_alerte")
        return jsonify({"error": "id_alerte is required"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get zone from alert
        cursor.execute("""
            SELECT id_zone FROM alertes WHERE id_alerte = %s
        """, (id_alerte,))
        alert_data = cursor.fetchone()
        
        if not alert_data:
            print(f"❌ Alert {id_alerte} not found")
            return jsonify({"error": "Alert not found"}), 404
        
        id_zone = alert_data["id_zone"]
        print(f"✅ Found zone {id_zone} for alert {id_alerte}")
        
        # Check if incident already exists for this alert
        cursor.execute("""
            SELECT id_incendie FROM incendies WHERE id_alerte = %s
        """, (id_alerte,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing incident
            print(f"📝 Updating existing incident {existing['id_incendie']}")
            cursor.execute("""
                UPDATE incendies 
                SET statut_incendie = %s,
                    date_fin = %s,
                    superficie_brulee_ha = %s,
                    cause_presumee = %s,
                    observations = %s
                WHERE id_alerte = %s
            """, (statut_incendie, date_fin, superficie_brulee_ha, cause_presumee, observations, id_alerte))
        else:
            # Create new incident
            print(f"📝 Creating new incident for alert {id_alerte}")
            cursor.execute("""
                INSERT INTO incendies 
                (id_zone, id_alerte, date_debut, date_fin, statut_incendie, superficie_brulee_ha, cause_presumee, observations)
                VALUES (%s, %s, NOW(), %s, %s, %s, %s, %s)
            """, (id_zone, id_alerte, date_fin, statut_incendie, superficie_brulee_ha, cause_presumee, observations))
        
        # Update alert status to RESOLUE
        cursor.execute("""
            UPDATE alertes SET statut = 'RESOLUE' WHERE id_alerte = %s
        """, (id_alerte,))
        
        conn.commit()
        print(f"✅ Incident report submitted successfully for alert {id_alerte}")
        return jsonify({"message": "Incident report submitted successfully"}), 201
    
    except Exception as e:
        conn.rollback()
        print("❌ ERROR submit_incident_report:", e)
        return jsonify({"error": str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()