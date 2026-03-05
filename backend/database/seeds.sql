-- ============================================================
-- Seed Data — Argan zones in Souss-Massa (development only)
-- ============================================================

USE argan_fire_watch;

-- ----------------------------------------------------------
-- Cooperatives
-- ----------------------------------------------------------
INSERT INTO cooperatives (name, zone, latitude, longitude, contact_phone) VALUES
('Coopérative Tifaout',      'Taroudant',    30.4700, -8.8800, '+212600000001'),
('Coopérative Amalou',       'Essaouira',    31.5085, -9.7595, '+212600000002'),
('Coopérative Tighanimine',  'Agadir Ida',   30.4278, -9.5981, '+212600000003'),
('Coopérative Ajddigue',     'Tiznit',       29.6974, -9.8022, '+212600000004'),
('Coopérative Tamounte',     'Chtouka Ait Baha', 30.0700, -9.3200, '+212600000005');

-- ----------------------------------------------------------
-- Sensors
-- ----------------------------------------------------------
INSERT INTO sensors (label, latitude, longitude, cooperative_id) VALUES
('Sensor-Taroudant-N1',     30.4710, -8.8810, 1),
('Sensor-Taroudant-N2',     30.4690, -8.8790, 1),
('Sensor-Essaouira-E1',     31.5095, -9.7600, 2),
('Sensor-Agadir-A1',        30.4285, -9.5990, 3),
('Sensor-Tiznit-T1',        29.6980, -9.8030, 4),
('Sensor-Chtouka-C1',       30.0710, -9.3210, 5);

-- ----------------------------------------------------------
-- Sample sensor readings
-- ----------------------------------------------------------
INSERT INTO sensor_readings (sensor_id, temperature, humidity, latitude, longitude) VALUES
(1, 38.5, 35.0, 30.4710, -8.8810),
(2, 42.0, 22.0, 30.4690, -8.8790),
(3, 30.0, 55.0, 31.5095, -9.7600),
(4, 47.0, 15.0, 30.4285, -9.5990),  -- should trigger alert
(5, 35.0, 40.0, 29.6980, -9.8030);
