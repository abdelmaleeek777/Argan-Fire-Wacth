-- =====================================================
-- SENSOR DATA CLEANUP AND SEEDING SCRIPT
-- =====================================================

-- 1. First, delete measurements from sensors without valid zones
DELETE FROM mesures 
WHERE id_capteur IN (
    SELECT c.id_capteur 
    FROM capteurs c
    LEFT JOIN zones_forestieres z ON c.id_zone = z.id_zone
    LEFT JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
    WHERE z.id_zone IS NULL 
       OR co.id_cooperative IS NULL 
       OR co.statut != 'approved'
);

-- 2. Delete sensors without valid zones (like ENS_TEMP_01)
DELETE FROM capteurs 
WHERE id_zone NOT IN (
    SELECT z.id_zone 
    FROM zones_forestieres z
    JOIN cooperatives c ON z.id_cooperative = c.id_cooperative
    WHERE c.statut = 'approved'
);

-- 3. Also delete orphan sensors (zone doesn't exist)
DELETE FROM capteurs 
WHERE id_zone NOT IN (SELECT id_zone FROM zones_forestieres);

-- 4. Insert sample temperature readings for all valid sensors
-- This creates realistic temperature data for the heatmap

-- Insert measurements for each sensor with varying temperatures
INSERT INTO mesures (temperature_c, humidite_pct, vitesse_vent_kmh, horodatage, qualite_signal, id_capteur)
SELECT 
    -- Random temperature between 22 and 45 degrees (forest fire risk varies)
    ROUND(22 + (RAND() * 23), 2) AS temperature_c,
    -- Humidity between 30% and 70%
    ROUND(30 + (RAND() * 40), 2) AS humidite_pct,
    -- Wind speed between 0 and 25 km/h
    ROUND(RAND() * 25, 2) AS vitesse_vent_kmh,
    -- Current timestamp
    NOW() AS horodatage,
    -- Signal quality 85-100
    FLOOR(85 + (RAND() * 15)) AS qualite_signal,
    c.id_capteur
FROM capteurs c
JOIN zones_forestieres z ON c.id_zone = z.id_zone
JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
WHERE co.statut = 'approved';

-- 5. Add a few more historical readings (last hour) for realistic data
INSERT INTO mesures (temperature_c, humidite_pct, vitesse_vent_kmh, horodatage, qualite_signal, id_capteur)
SELECT 
    ROUND(20 + (RAND() * 25), 2) AS temperature_c,
    ROUND(35 + (RAND() * 35), 2) AS humidite_pct,
    ROUND(RAND() * 20, 2) AS vitesse_vent_kmh,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 60) MINUTE) AS horodatage,
    FLOOR(80 + (RAND() * 20)) AS qualite_signal,
    c.id_capteur
FROM capteurs c
JOIN zones_forestieres z ON c.id_zone = z.id_zone
JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
WHERE co.statut = 'approved';

-- 6. Add another batch with some high temperature readings (fire risk simulation)
INSERT INTO mesures (temperature_c, humidite_pct, vitesse_vent_kmh, horodatage, qualite_signal, id_capteur)
SELECT 
    -- Some sensors show high temps (40-55°C) to simulate fire risk areas
    ROUND(40 + (RAND() * 15), 2) AS temperature_c,
    ROUND(20 + (RAND() * 30), 2) AS humidite_pct,
    ROUND(5 + (RAND() * 30), 2) AS vitesse_vent_kmh,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) MINUTE) AS horodatage,
    FLOOR(90 + (RAND() * 10)) AS qualite_signal,
    c.id_capteur
FROM capteurs c
JOIN zones_forestieres z ON c.id_zone = z.id_zone
JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
WHERE co.statut = 'approved'
-- Only add high temps to ~30% of sensors
AND RAND() < 0.3;

-- Show summary
SELECT 'Cleanup and seeding complete!' AS status;
SELECT COUNT(*) AS total_sensors FROM capteurs;
SELECT COUNT(*) AS total_measurements FROM mesures;
SELECT 
    c.reference_serie,
    z.nom_zone,
    co.nom_cooperative,
    (SELECT temperature_c FROM mesures m WHERE m.id_capteur = c.id_capteur ORDER BY horodatage DESC LIMIT 1) AS latest_temp
FROM capteurs c
JOIN zones_forestieres z ON c.id_zone = z.id_zone
JOIN cooperatives co ON z.id_cooperative = co.id_cooperative
WHERE co.statut = 'approved';
