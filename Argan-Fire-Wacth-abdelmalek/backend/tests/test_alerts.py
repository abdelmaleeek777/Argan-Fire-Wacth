"""Tests — alert trigger threshold tests."""

import unittest
from app.services.propagation_engine import PropagationEngine


class TestAlertThresholds(unittest.TestCase):
    """Verify that alert thresholds correctly classify risk levels."""

    def setUp(self):
        self.engine = PropagationEngine()

    def test_extreme_conditions_trigger_high_probability(self):
        """Extreme heat + low humidity + high wind → probability > 0.8."""
        prob = self.engine.calculate_probability(
            temperature=55, humidity=5, wind_speed=40
        )
        self.assertGreater(prob, 0.8)

    def test_safe_conditions_stay_low(self):
        """Cool + humid + calm → probability < 0.3."""
        prob = self.engine.calculate_probability(
            temperature=18, humidity=75, wind_speed=5
        )
        self.assertLess(prob, 0.3)

    def test_temperature_at_threshold(self):
        """Temperature at 45 °C with moderate other factors."""
        prob = self.engine.calculate_probability(
            temperature=45, humidity=50, wind_speed=15
        )
        self.assertGreater(prob, 0.3)
        self.assertLess(prob, 0.9)

    def test_probability_never_exceeds_one(self):
        """Even with maxed-out inputs, probability should cap at 1.0."""
        prob = self.engine.calculate_probability(
            temperature=100, humidity=0, wind_speed=100
        )
        self.assertLessEqual(prob, 1.0)

    def test_probability_never_negative(self):
        """Minimum inputs should not produce negative probability."""
        prob = self.engine.calculate_probability(
            temperature=0, humidity=100, wind_speed=0
        )
        self.assertGreaterEqual(prob, 0.0)


if __name__ == "__main__":
    unittest.main()
