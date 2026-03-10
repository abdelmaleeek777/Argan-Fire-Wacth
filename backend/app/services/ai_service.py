"""AI service — AI-based fire propagation model for QA comparison."""


class AIService:
    """AI propagation model used to compare against manual/stored-procedure results."""

    def predict_propagation(self, sensor_data):
        """
        Predict fire propagation using an AI model.

        Parameters
        ----------
        sensor_data : dict
            Must contain: temperature, humidity, wind_speed, latitude, longitude.

        Returns
        -------
        dict  with keys: probability (float), risk_level (str), confidence (float).

        TODO: integrate actual ML model (e.g. trained scikit-learn / TensorFlow model).
        """
        temperature = sensor_data.get("temperature", 0)
        humidity = sensor_data.get("humidity", 100)
        wind_speed = sensor_data.get("wind_speed", 0)

        # Placeholder scoring logic — replace with real model inference
        score = (temperature * 0.4 + wind_speed * 0.3) / max(humidity, 1) * 10
        probability = round(min(max(score, 0.0), 1.0), 4)

        if probability >= 0.75:
            risk_level = "critical"
        elif probability >= 0.50:
            risk_level = "high"
        elif probability >= 0.25:
            risk_level = "moderate"
        else:
            risk_level = "low"

        return {
            "probability": probability,
            "risk_level": risk_level,
            "confidence": 0.0,  # placeholder until real model loaded
        }

    def compare_with_manual(self, ai_result, manual_result):
        """
        Compare AI prediction with manual/stored-procedure result for QA.

        Returns
        -------
        dict  with keys: match (bool), deviation (float).
        """
        deviation = abs(ai_result["probability"] - manual_result)
        return {
            "match": deviation < 0.10,
            "deviation": round(deviation, 4),
        }
