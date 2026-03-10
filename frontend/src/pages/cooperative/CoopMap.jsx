import React from "react";

/**
 * Cooperative Map — displays a map of the cooperative's sensors and fire zones.
 */
function CoopMap() {
  return (
    <div className="page coop-map">
      <h1>Zone Map</h1>
      <p>
        Interactive map showing your cooperative's sensor locations and fire
        risk zones.
      </p>

      {/* TODO: integrate Leaflet / Mapbox map */}
      <div
        id="map-container"
        style={{
          width: "100%",
          height: "500px",
          background: "#e0e0e0",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>Map will render here</span>
      </div>
    </div>
  );
}

export default CoopMap;
