import React from "react";

/**
 * Admin Alerts — view and manage ALL alerts across every cooperative.
 */
function AdminAlerts() {
  return (
    <div className="page admin-alerts">
      <h1>All Alerts</h1>
      <p>Monitor and manage fire alerts from every cooperative zone.</p>

      {/* TODO: fetch from GET /alerts (unfiltered — all cooperatives) */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cooperative</th>
            <th>Type</th>
            <th>Status</th>
            <th>Triggered At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="6">No alerts to display.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default AdminAlerts;
