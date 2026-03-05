-- ============================================================
-- Argan Fire Watch — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS argan_fire_watch
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE argan_fire_watch;

-- ----------------------------------------------------------
-- Cooperatives (argan zones in Souss-Massa)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cooperatives (
    cooperative_id  INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255)   NOT NULL,
    zone            VARCHAR(255)   NOT NULL,
    latitude        DECIMAL(10, 7) NOT NULL,
    longitude       DECIMAL(10, 7) NOT NULL,
    contact_phone   VARCHAR(20),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Sensors
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id       INT AUTO_INCREMENT PRIMARY KEY,
    label           VARCHAR(100)   NOT NULL,
    latitude        DECIMAL(10, 7) NOT NULL,
    longitude       DECIMAL(10, 7) NOT NULL,
    cooperative_id  INT,
    installed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cooperative_id) REFERENCES cooperatives(cooperative_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Sensor Readings
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensor_readings (
    reading_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    sensor_id       INT            NOT NULL,
    temperature     DECIMAL(5, 2)  NOT NULL,
    humidity        DECIMAL(5, 2)  NOT NULL,
    latitude        DECIMAL(10, 7) NOT NULL,
    longitude       DECIMAL(10, 7) NOT NULL,
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Alerts
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id        INT AUTO_INCREMENT PRIMARY KEY,
    alert_type      VARCHAR(50)  NOT NULL,
    status          ENUM('pending', 'acknowledged', 'resolved') DEFAULT 'pending',
    sensor_id       INT,
    reading_id      BIGINT,
    triggered_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP NULL,
    FOREIGN KEY (sensor_id)  REFERENCES sensors(sensor_id),
    FOREIGN KEY (reading_id) REFERENCES sensor_readings(reading_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Fire Logs (immutable, append-only with hash chain)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS fire_logs (
    log_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type      VARCHAR(100)  NOT NULL,
    details         TEXT          NOT NULL,
    previous_hash   CHAR(64),
    current_hash    CHAR(64)      NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
