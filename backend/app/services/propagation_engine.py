"""Propagation engine — calls stored procedure, applies wind/humidity logic."""


class PropagationEngine:
    """Calculate fire propagation probability using environmental factors."""

    # Thresholds
    TEMP_THRESHOLD = 45.0       # °C — high fire risk
    HUMIDITY_THRESHOLD = 20.0   # % — dry conditions
    WIND_SPEED_THRESHOLD = 30.0 # km/h — accelerates spread

    def calculate_probability(self, temperature, humidity, wind_speed, wind_direction=None):
        """
        Estimate fire propagation probability (0.0 – 1.0).

        Uses a weighted formula combining temperature, humidity, and wind speed.
        In production this will call the MySQL stored procedure
        `calc_propagation_probability(wind, humidity)`.
        """
        temp_factor = min(temperature / self.TEMP_THRESHOLD, 1.0)
        humidity_factor = max(1.0 - (humidity / 100.0), 0.0)
        wind_factor = min(wind_speed / self.WIND_SPEED_THRESHOLD, 1.0)

        # Weighted combination
        probability = (0.4 * temp_factor) + (0.35 * humidity_factor) + (0.25 * wind_factor)
        return round(min(probability, 1.0), 4)

    def call_stored_procedure(self, db_connection, wind_speed, humidity):
        """
        Call the MySQL stored procedure calc_propagation_probability.

        TODO: implement actual DB call.
        """
        # cursor = db_connection.cursor()
        # cursor.callproc('calc_propagation_probability', [wind_speed, humidity])
        # result = cursor.fetchone()
        # return result
        raise NotImplementedError("Database stored procedure call not yet implemented")
