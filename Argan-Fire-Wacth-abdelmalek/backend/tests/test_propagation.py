"""Tests — AI vs Manual QA comparison for propagation."""

import unittest
from app.services.propagation_engine import PropagationEngine
from app.services.ai_service import AIService


class TestPropagationComparison(unittest.TestCase):
    """Compare AI propagation predictions against the manual engine."""

    def setUp(self):
        self.engine = PropagationEngine()
        self.ai = AIService()

    def test_high_risk_scenario(self):
        """Both models should flag high-risk conditions."""
        manual = self.engine.calculate_probability(
            temperature=50, humidity=10, wind_speed=35
        )
        ai_result = self.ai.predict_propagation({
            "temperature": 50, "humidity": 10, "wind_speed": 35,
            "latitude": 30.47, "longitude": -8.88,
        })

        self.assertGreater(manual, 0.5)
        self.assertIn(ai_result["risk_level"], ("high", "critical"))

    def test_low_risk_scenario(self):
        """Both models should flag low-risk conditions."""
        manual = self.engine.calculate_probability(
            temperature=20, humidity=80, wind_speed=5
        )
        ai_result = self.ai.predict_propagation({
            "temperature": 20, "humidity": 80, "wind_speed": 5,
            "latitude": 30.47, "longitude": -8.88,
        })

        self.assertLess(manual, 0.5)
        self.assertIn(ai_result["risk_level"], ("low", "moderate"))

    def test_deviation_within_tolerance(self):
        """AI and manual should not deviate excessively for moderate conditions."""
        manual = self.engine.calculate_probability(
            temperature=35, humidity=40, wind_speed=20
        )
        ai_result = self.ai.predict_propagation({
            "temperature": 35, "humidity": 40, "wind_speed": 20,
            "latitude": 30.47, "longitude": -8.88,
        })
        comparison = self.ai.compare_with_manual(ai_result, manual)
        self.assertLess(comparison["deviation"], 0.5)


if __name__ == "__main__":
    unittest.main()
