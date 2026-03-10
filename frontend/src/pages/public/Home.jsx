import React from "react";

/**
 * Home page — visible to non-signed-in (public) visitors.
 * Shows general info about the Argan Fire Watch system.
 */
function Home() {
  return (
    <div className="page public-home">
      <h1>Argan Fire Watch</h1>
      <p>
        Real-time fire monitoring and early warning system for argan forests in
        Souss-Massa.
      </p>
    </div>
  );
}

export default Home;
