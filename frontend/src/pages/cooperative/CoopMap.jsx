import { useState, useEffect } from "react";
import axios from "axios";
import { Map, Layers, Info, ChevronLeft, Loader2, WifiOff } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = "http://localhost:5000/api";

const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981" },
  moyen:    { fill: "rgba(245, 158, 11, 0.1)", stroke: "#f59e0b" },
  "élevé":  { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444" },
  critique: { fill: "rgba(168, 85, 247, 0.1)", stroke: "#a855f7" },
};

const risqueBadge = {
  faible:   { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700" },
  moyen:    { bg: "bg-amber-50 border-amber-200", color: "text-amber-700" },
  "élevé":  { bg: "bg-orange-50 border-orange-200", color: "text-orange-700" },
  critique: { bg: "bg-purple-50 border-purple-200", color: "text-purple-700" },
};

// Convert WKT polygon coordinates [[lng, lat], ...] to Leaflet [[lat, lng], ...]
function wktToLeaflet(coords) {
  if (!coords || coords.length === 0) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

// Calculate center of a polygon
function getPolygonCenter(coords) {
  if (!coords || coords.length === 0) return [30.38, -8.96];
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

export default function CoopMap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showCapteurs, setShowCapteurs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live data
  const [cooperative, setCooperative] = useState(null);
  const [zones, setZones] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const cooperativeId = user.cooperative_id;

  const fetchData = async () => {
    if (!cooperativeId) {
      setError("No cooperative ID found.");
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/dashboard`);
      const data = res.data;
      setCooperative(data.cooperative);
      setZones(data.zones || []);
      setSensors(data.sensors || []);
      setAlerts(data.alerts || []);
      setError(null);
    } catch (err) {
      console.error("Map fetch error:", err);
      setError("Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Build Leaflet polygons from zone coordinates
  const zonesWithPolygons = zones.map(z => ({
    ...z,
    leafletCoords: wktToLeaflet(z.coordinates || []),
    center: z.coordinates && z.coordinates.length > 0
      ? getPolygonCenter(wktToLeaflet(z.coordinates))
      : [30.38, -8.96],
  }));

  // Default map center: first zone center, or Agadir
  const defaultCenter = zonesWithPolygons.length > 0 && zonesWithPolygons[0].leafletCoords.length > 0
    ? zonesWithPolygons[0].center
    : [30.38, -8.96];

  const zone = zonesWithPolygons.find(z => z.id_zone === selectedZone);
  const capteursZone = selectedZone
    ? sensors.filter(s => s.id_zone === selectedZone)
    : [];

  // Map controller to fly to selected zone
  function MapController({ selectedZoneId }) {
    const map = useMap();
    useEffect(() => {
      if (selectedZoneId) {
        const z = zonesWithPolygons.find(zone => zone.id_zone === selectedZoneId);
        if (z && z.leafletCoords.length > 0) {
          map.flyTo(z.center, 13, { duration: 1.5 });
        }
      } else if (defaultCenter) {
        map.flyTo(defaultCenter, 11, { duration: 1.5 });
      }
    }, [selectedZoneId, map]);
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error && zones.length === 0) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <WifiOff className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Connection Error</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Count active alerts per zone
  const alertsByZone = {};
  alerts.forEach(a => {
    const zoneMatch = zones.find(z => z.nom_zone === a.zone);
    if (zoneMatch) {
      alertsByZone[zoneMatch.id_zone] = (alertsByZone[zoneMatch.id_zone] || 0) + (a.statut === "active" ? 1 : 0);
    }
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-12 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-emerald-200 shadow-md">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Carte des zones forestières</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {cooperative?.region || "—"} · {cooperative?.nom_cooperative || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <button
              onClick={() => setShowCapteurs(!showCapteurs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                showCapteurs
                  ? "bg-slate-800 text-white border-slate-800 hover:bg-slate-700 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" />
              {showCapteurs ? "Masquer capteurs" : "Afficher capteurs"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6">

        {/* Leaflet Map */}
        <div className="flex-[2] relative">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] w-full relative">

            {/* Legend */}
            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Niveau de risque
              </div>
              {Object.entries(risqueBadge).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-[4px]" style={{ backgroundColor: risqueFill[k]?.stroke, opacity: 0.8 }} />
                  <span className={`text-xs font-bold capitalize ${v.color}`}>{k}</span>
                </div>
              ))}

              {showCapteurs && (
                <div className="border-t border-slate-100 mt-3 pt-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    <span className="text-xs font-semibold text-slate-600">Capteur actif</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm ring-2 ring-rose-200" />
                    <span className="text-xs font-semibold text-slate-600">En alerte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">En panne</span>
                  </div>
                </div>
              )}
            </div>

            <MapContainer
              center={defaultCenter}
              zoom={11}
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <MapController selectedZoneId={selectedZone} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Zone Polygons */}
              {zonesWithPolygons.map(z => {
                if (z.leafletCoords.length === 0) return null;
                const rc = risqueFill[z.niveau_risque_base] || {};
                const isSelected = selectedZone === z.id_zone;

                return (
                  <Polygon
                    key={z.id_zone}
                    positions={z.leafletCoords}
                    pathOptions={{
                      fillColor: rc.stroke,
                      fillOpacity: isSelected ? 0.4 : 0.2,
                      color: isSelected ? "#1e293b" : rc.stroke,
                      weight: isSelected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedZone(isSelected ? null : z.id_zone),
                    }}
                  >
                    <Popup className="rounded-xl">
                      <div className="font-bold text-slate-800">{z.nom_zone}</div>
                      <div className="text-sm text-slate-600">{z.superficie_ha} ha</div>
                    </Popup>
                  </Polygon>
                );
              })}

              {/* Sensors on map */}
              {showCapteurs && sensors.map(s => {
                const isInactive = s.statut !== "ACTIF";
                const hasAlert = s.latest_reading && s.latest_reading.temperature_c > 60;
                const color = isInactive ? "#94a3b8" : hasAlert ? "#ef4444" : "#10b981";

                const customIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    width: 16px;
                    height: 16px;
                    background-color: ${color};
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 ${hasAlert ? '15px 5px rgba(239, 68, 68, 0.6)' : '5px rgba(0,0,0,0.3)'};
                    ${hasAlert ? 'animation: pulse 2s infinite;' : ''}
                  "></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                });

                return (
                  <Marker
                    key={s.id_capteur}
                    position={[s.latitude, s.longitude]}
                    icon={customIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-500">{s.reference_serie}</div>
                        {s.latest_reading ? (
                          <div className={`text-lg font-black ${hasAlert ? "text-rose-600" : "text-slate-800"}`}>
                            {s.latest_reading.temperature_c}°C
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">No data</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex-1 lg:max-w-xs flex flex-col gap-4">
          {!zone ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm h-full overflow-hidden flex flex-col">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                Toutes les zones
              </h3>
              <div className="overflow-y-auto pr-2 -mr-2 space-y-2 flex-1">
                {zonesWithPolygons.length > 0 ? zonesWithPolygons.map(z => {
                  const rb = risqueBadge[z.niveau_risque_base] || {};
                  const activeAlerts = alertsByZone[z.id_zone] || 0;
                  return (
                    <div
                      key={z.id_zone}
                      onClick={() => setSelectedZone(z.id_zone)}
                      className="p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 shadow-sm hover:shadow transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">{z.nom_zone}</div>
                        <div className="text-xs font-semibold text-slate-500 mt-1">{z.superficie_ha} ha</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-lg border ${rb.bg} ${rb.color}`}>
                          {z.niveau_risque_base}
                        </span>
                        {activeAlerts > 0 && (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 border border-rose-200 rounded-lg animate-pulse">
                            ⚠️ {activeAlerts} alerte
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">No zones configured</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => setSelectedZone(null)}
                className="self-start text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-5 bg-slate-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-100"
              >
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              {/* Zone header */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{zone.nom_zone}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                  <Map className="w-4 h-4" /> {zone.center[0].toFixed(3)}°N, {Math.abs(zone.center[1]).toFixed(3)}°O
                </p>
                {(() => {
                  const rb = risqueBadge[zone.niveau_risque_base] || {};
                  return (
                    <span className={`inline-block mt-3 text-xs font-bold uppercase px-3 py-1 rounded-full border ${rb.bg} ${rb.color}`}>
                      Risque {zone.niveau_risque_base}
                    </span>
                  );
                })()}
              </div>

              {/* Zone stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Superficie", val: `${zone.superficie_ha} ha` },
                  { label: "Capteurs", val: capteursZone.length },
                  { label: "Alertes", val: alertsByZone[zone.id_zone] || 0 },
                  { label: "Zone ID", val: `#${zone.id_zone}` },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                    <div className={`text-base font-black ${s.label === "Alertes" && (alertsByZone[zone.id_zone] || 0) > 0 ? "text-rose-600" : "text-slate-800"}`}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sensors in zone */}
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Capteurs installés
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                {capteursZone.map(c => {
                  const isPanne = c.statut !== "ACTIF";
                  const hasAlert = c.latest_reading && c.latest_reading.temperature_c > 60;
                  const sColor = isPanne
                    ? "bg-slate-100 text-slate-500 border-slate-200"
                    : hasAlert
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200";

                  return (
                    <div key={c.id_capteur} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isPanne ? "bg-slate-400" : hasAlert ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />

                      <div className="flex-1 font-mono text-xs font-bold text-slate-600">
                        {c.reference_serie}
                      </div>

                      <div className={`text-sm font-black ${hasAlert ? "text-rose-600" : "text-slate-800"}`}>
                        {c.latest_reading ? `${c.latest_reading.temperature_c}°C` : "—"}
                      </div>

                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${sColor}`}>
                        {isPanne ? "Panne" : hasAlert ? "Alerte" : "Actif"}
                      </div>
                    </div>
                  );
                })}
                {capteursZone.length === 0 && (
                  <p className="text-sm text-slate-400 italic text-center py-4">Aucun capteur dans cette zone.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
