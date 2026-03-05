import React from "react";

/**
 * Admin Dashboard — overview of ALL cooperatives, sensors, and alerts.
 * Only accessible to admin users.
 */
function AdminDashboard() {
  return (
    <div className="page admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>System-wide overview of all cooperatives, sensors, and fire alerts.</p>

      <section>
        <h2>All Cooperatives</h2>
        {/* TODO: fetch from GET /dashboard/map-data */}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Zone</th>
              <th>Sensors</th>
              <th>Active Alerts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5">Loading cooperatives...</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>System Summary</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Sensors</h3>
            <p>—</p>
          </div>
          <div className="stat-card">
            <h3>Active Alerts</h3>
            <p>—</p>
          </div>
          <div className="stat-card">
            <h3>Cooperatives</h3>
            <p>—</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
