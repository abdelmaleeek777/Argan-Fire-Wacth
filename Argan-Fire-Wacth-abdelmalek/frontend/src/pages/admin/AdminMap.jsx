import React from "react";

/**
 * Admin Map — full system map showing ALL cooperatives, sensors, and fire zones.
 */
function AdminMap() {
  return (
    <div className="page admin-map">
      <h1>System Map</h1>
      <p>
        Full map of all cooperatives, sensors, and fire propagation zones across
        Souss-Massa.
      </p>

      {/* TODO: integrate Leaflet / Mapbox with all cooperative data */}
      <div
        id="admin-map-container"
        style={{
          width: "100%",
          height: "600px",
          background: "#e0e0e0",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>System-wide map will render here</span>
      </div>
    </div>
  );
}

export default AdminMap;
