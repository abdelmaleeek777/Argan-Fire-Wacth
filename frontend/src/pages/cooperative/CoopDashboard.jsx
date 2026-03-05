import React from "react";

/**
 * Cooperative Dashboard — shows the cooperative holder their own zone data.
 * Displays sensors, alerts, and fire logs for their cooperative.
 */
function CoopDashboard() {
  return (
    <div className="page coop-dashboard">
      <h1>My Cooperative Dashboard</h1>
      <p>
        View your cooperative's sensor readings, active alerts, and fire logs.
      </p>

      <section>
        <h2>Sensor Readings</h2>
        {/* TODO: fetch from GET /sensors/reading filtered by cooperative */}
        <p>No sensor data yet.</p>
      </section>

      <section>
        <h2>Active Alerts</h2>
        {/* TODO: fetch from GET /alerts filtered by cooperative */}
        <p>No active alerts.</p>
      </section>

      <section>
        <h2>Fire Logs</h2>
        {/* TODO: fetch from GET /logs filtered by cooperative */}
        <p>No fire logs yet.</p>
      </section>
    </div>
  );
}

export default CoopDashboard;
