import React from "react";

/**
 * Admin Logs — read-only view of ALL fire logs with integrity verification.
 */
function AdminLogs() {
  return (
    <div className="page admin-logs">
      <h1>Fire Logs</h1>
      <p>
        Immutable fire event log with SHA-256 hash chain integrity verification.
      </p>

      {/* TODO: fetch from GET /logs and display integrity status */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Event Type</th>
            <th>Details</th>
            <th>Timestamp</th>
            <th>Hash</th>
            <th>Integrity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="6">No logs to display.</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default AdminLogs;
