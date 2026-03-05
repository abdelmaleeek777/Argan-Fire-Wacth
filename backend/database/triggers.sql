-- ============================================================
-- Triggers
-- ============================================================

USE argan_fire_watch;

DELIMITER //

-- ----------------------------------------------------------
-- AFTER INSERT on sensor_readings
-- Automatically create an alert when temperature is critically
-- high or humidity is critically low.
-- ----------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_sensor_reading_alert
AFTER INSERT ON sensor_readings
FOR EACH ROW
BEGIN
    -- Temperature above 45 °C or humidity below 20 %
    IF NEW.temperature > 45.0 OR NEW.humidity < 20.0 THEN
        INSERT INTO alerts (alert_type, status, sensor_id, reading_id)
        VALUES (
            CASE
                WHEN NEW.temperature > 45.0 AND NEW.humidity < 20.0
                    THEN 'critical_fire_risk'
                WHEN NEW.temperature > 45.0
                    THEN 'high_temperature'
                ELSE 'low_humidity'
            END,
            'pending',
            NEW.sensor_id,
            NEW.reading_id
        );
    END IF;
END //

DELIMITER ;
