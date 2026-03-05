-- ============================================================
-- Stored Procedures
-- ============================================================

USE argan_fire_watch;

DELIMITER //

-- ----------------------------------------------------------
-- calc_propagation_probability
-- Estimates fire propagation probability based on wind speed
-- and humidity readings.
-- ----------------------------------------------------------
CREATE PROCEDURE IF NOT EXISTS calc_propagation_probability(
    IN p_wind_speed   DECIMAL(5, 2),
    IN p_humidity     DECIMAL(5, 2),
    OUT p_probability DECIMAL(5, 4)
)
BEGIN
    DECLARE wind_factor   DECIMAL(5, 4);
    DECLARE humidity_factor DECIMAL(5, 4);

    -- Normalize wind speed (0–1 scale, threshold 30 km/h)
    SET wind_factor = LEAST(p_wind_speed / 30.0, 1.0);

    -- Inverse humidity factor (lower humidity → higher risk)
    SET humidity_factor = GREATEST(1.0 - (p_humidity / 100.0), 0.0);

    -- Weighted combination
    SET p_probability = ROUND((0.55 * humidity_factor) + (0.45 * wind_factor), 4);
    SET p_probability = LEAST(p_probability, 1.0);
END //

DELIMITER ;
