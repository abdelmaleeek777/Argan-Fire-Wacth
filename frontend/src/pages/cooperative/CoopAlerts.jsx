import React from "react";

/**
 * Cooperative Alerts — detailed alert management for the cooperative holder.
 */
function CoopAlerts() {
  return (
    <div className="page coop-alerts">
      <h1>My Alerts</h1>
      <p>View and manage fire alerts for your cooperative zone.</p>

      {/* TODO: list alerts with acknowledge / resolve actions */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Triggered At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="5">No alerts to display.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CoopAlerts;
