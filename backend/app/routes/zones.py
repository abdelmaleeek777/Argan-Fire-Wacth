from flask import Blueprint, jsonify, request
from app.config import get_db_connection
from app.utils.auth import cooperative_required
import time
import math

zones_bp = Blueprint("zones", __name__)

def calculate_area_hectares(coords):
    """
    Calculate area in hectares from GPS coordinates [lng, lat]
    Using Shoelace formula and approximate projection for Morocco region (~30N)
    """
    if len(coords) < 3:
        return 0
    
    # Ensure polygon is closed
    if coords[0] != coords[-1]:
        coords.append(coords[0])
        
    area_deg2 = 0
    for i in range(len(coords) - 1):
        x1, y1 = coords[i]
        x2, y2 = coords[i+1]
        area_deg2 += (x1 * y2 - x2 * y1)
    
    area_deg2 = abs(area_deg2) / 2.0
    
    # Conversion factors for ~30 degrees North (Souss-Massa)
    # 1 deg lat = 110.8 km
    # 1 deg lng = 111.32 * cos(30) = 96.4 km
    # 1 deg^2 = 110.8 * 96.4 = 10681 km^2
    # 1 km^2 = 100 hectares
    # Factor = 10681 * 100 = 1,068,100
    return round(area_deg2 * 1068100, 2)

@zones_bp.route("/cooperative/<int:coop_id>/zones", methods=["GET"])
@cooperative_required
def get_zones(coop_id):
    user = getattr(request, "current_user", None)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Ownership check
    cursor.execute("SELECT id_responsable FROM cooperatives WHERE id_cooperative = %s", (coop_id,))
    coop = cursor.fetchone()
    if not coop or coop["id_responsable"] != user["user_id"]:
        cursor.close()
        conn.close()
        return jsonify({"message": "Forbidden"}), 403

    cursor.execute("""
        SELECT z.id_zone, z.nom_zone, z.region, z.superficie_ha, z.indice_risque,
               (SELECT COUNT(*) FROM capteurs WHERE id_zone = z.id_zone) as sensor_count,
               ST_X(ST_Centroid(z.coordonnees_gps)) as center_lng,
               ST_Y(ST_Centroid(z.coordonnees_gps)) as center_lat,
               ST_AsGeoJSON(z.coordonnees_gps) as geojson
        FROM zones_forestieres z
        WHERE z.id_cooperative = %s
    """, (coop_id,))
    zones = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(zones)

@zones_bp.route("/cooperative/<int:coop_id>/zones", methods=["POST"])
@cooperative_required
def create_zone(coop_id):
    user = getattr(request, "current_user", None)
    data = request.get_json()
    
    if not data or not data.get("name") or not data.get("polygon"):
        return jsonify({"message": "Invalid data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Ownership check
    cursor.execute("SELECT id_responsable, region FROM cooperatives WHERE id_cooperative = %s", (coop_id,))
    coop = cursor.fetchone()
    if not coop or coop["id_responsable"] != user["user_id"]:
        cursor.close()
        conn.close()
        return jsonify({"message": "Forbidden"}), 403

    try:
        name = data["name"]
        polygon = data["polygon"] # [[lng, lat], ...]
        region = coop["region"]
        
        # Calculate area in hectares
        area = calculate_area_hectares(polygon)
        
        # Convert to WKT
        if polygon[0] != polygon[-1]:
            polygon.append(polygon[0])
        wkt_coords = ", ".join([f"{p[0]} {p[1]}" for p in polygon])
        wkt_polygon = f"POLYGON(({wkt_coords}))"

        # 1. Insert Zone
        cursor.execute("""
            INSERT INTO zones_forestieres (nom_zone, region, superficie_ha, coordonnees_gps, id_cooperative, indice_risque)
            VALUES (%s, %s, %s, ST_GeomFromText(%s), %s, 0.0)
        """, (name, region, area, wkt_polygon, coop_id))
        zone_id = cursor.lastrowid

        # 2. Extract 4 corners (first 4 distinct points)
        corners = []
        seen = set()
        for p in data["polygon"]:
            pt = (p[0], p[1])
            if pt not in seen:
                corners.append(p)
                seen.add(pt)
            if len(corners) == 4:
                break
        
        # If less than 4 points (somehow), pad it
        while len(corners) < 4 and corners:
            corners.append(corners[0])

        # 3. Insert 4 sensors
        ts = int(time.time())
        for i, pos in enumerate(corners):
            ref = f"AUTO-{zone_id}-{i+1}-{ts}"
            cursor.execute("""
                INSERT INTO capteurs (reference_serie, type_capteur, modele, latitude, longitude, statut, id_zone, date_installation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """, (ref, "MULTI", "Corner-Station", pos[1], pos[0], "ACTIF", zone_id))

        conn.commit()
        return jsonify({
            "message": "Zone créée avec 4 capteurs automatiquement placés",
            "id_zone": zone_id,
            "surface_ha": area
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@zones_bp.route("/cooperative/<int:coop_id>/zones/<int:zone_id>", methods=["DELETE"])
@cooperative_required
def delete_zone(coop_id, zone_id):
    user = getattr(request, "current_user", None)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Ownership check
        cursor.execute("SELECT id_responsable FROM cooperatives WHERE id_cooperative = %s", (coop_id,))
        coop = cursor.fetchone()
        if not coop or coop["id_responsable"] != user["user_id"]:
            cursor.close()
            conn.close()
            return jsonify({"message": "Forbidden"}), 403

        # Verify zone belongs to cooperative
        cursor.execute("SELECT id_zone FROM zones_forestieres WHERE id_zone = %s AND id_cooperative = %s", (zone_id, coop_id))
        zone = cursor.fetchone()
        if not zone:
            cursor.close()
            conn.close()
            return jsonify({"message": "Zone not found"}), 404

        # Get all sensor IDs in this zone
        cursor.execute("SELECT id_capteur FROM capteurs WHERE id_zone = %s", (zone_id,))
        sensor_ids = [row["id_capteur"] for row in cursor.fetchall()]

        # Get all alert IDs for this zone
        cursor.execute("SELECT id_alerte FROM alertes WHERE id_zone = %s", (zone_id,))
        alert_ids = [row["id_alerte"] for row in cursor.fetchall()]

        # 1. Delete alertes_utilisateurs for alerts in this zone
        if alert_ids:
            alert_placeholders = ",".join(["%s"] * len(alert_ids))
            cursor.execute(f"DELETE FROM alertes_utilisateurs WHERE id_alerte IN ({alert_placeholders})", alert_ids)

        if sensor_ids:
            placeholders = ",".join(["%s"] * len(sensor_ids))
            
            # Get all mesure IDs for these sensors
            cursor.execute(f"SELECT id_mesure FROM mesures WHERE id_capteur IN ({placeholders})", sensor_ids)
            mesure_ids = [row["id_mesure"] for row in cursor.fetchall()]
            
            # 2. Delete alerts that reference these mesures (via id_mesure foreign key)
            if mesure_ids:
                mesure_placeholders = ",".join(["%s"] * len(mesure_ids))
                # First get alert IDs from mesures
                cursor.execute(f"SELECT id_alerte FROM alertes WHERE id_mesure IN ({mesure_placeholders})", mesure_ids)
                mesure_alert_ids = [row["id_alerte"] for row in cursor.fetchall()]
                
                # Delete alertes_utilisateurs for these alerts
                if mesure_alert_ids:
                    ma_placeholders = ",".join(["%s"] * len(mesure_alert_ids))
                    cursor.execute(f"DELETE FROM alertes_utilisateurs WHERE id_alerte IN ({ma_placeholders})", mesure_alert_ids)
                
                # Delete alerts referencing mesures
                cursor.execute(f"DELETE FROM alertes WHERE id_mesure IN ({mesure_placeholders})", mesure_ids)
            
            # 3. Delete measurements (mesures) for sensors in this zone
            cursor.execute(f"DELETE FROM mesures WHERE id_capteur IN ({placeholders})", sensor_ids)

        # 4. Delete sensors in this zone
        cursor.execute("DELETE FROM capteurs WHERE id_zone = %s", (zone_id,))

        # 5. Delete remaining alerts for this zone (via id_zone)
        cursor.execute("DELETE FROM alertes WHERE id_zone = %s", (zone_id,))

        # 6. Delete zone
        cursor.execute("DELETE FROM zones_forestieres WHERE id_zone = %s", (zone_id,))

        conn.commit()
        return jsonify({"message": "Zone supprimée avec succès"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
