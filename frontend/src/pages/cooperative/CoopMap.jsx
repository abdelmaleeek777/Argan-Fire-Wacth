import { useState, useEffect } from "react";
import axios from "axios";
import { Map as MapIcon, Layers, Info, ChevronLeft, Loader2, WifiOff } from "lucide-react";
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

const API_BASE = "/api";

const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981" },
  moyen:    { fill: "rgba(245, 158, 11, 0.1)", stroke: "#f59e0b" },
  "élevé":  { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444" },
  critique: { fill: "rgba(168, 85, 247, 0.1)", stroke: "#a855f7" },
};

const risqueBadge = {
  faible:   { bg: "bg-emerald-50 border-emerald-200", color: "text-emerald-700", label: "Low" },
  moyen:    { bg: "bg-amber-50 border-amber-200", color: "text-amber-700", label: "Medium" },
  "élevé":  { bg: "bg-orange-50 border-orange-200", color: "text-orange-700", label: "High" },
  critique: { bg: "bg-purple-50 border-purple-200", color: "text-purple-700", label: "Critical" },
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
      
      // Fetch sensors separately to be sure we get all for all zones
      const sensRes = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/sensors`);
      setSensors(sensRes.data);
      
      const alRes = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/alerts`);
      setAlerts(alRes.data);
      
      setError(null);
    } catch (err) {
      console.error("Map fetch error:", err);
      setError("Error loading spatial data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
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
          map.flyTo(z.center, 14, { duration: 1.5 });
        }
      } else if (defaultCenter) {
        map.flyTo(defaultCenter, 11, { duration: 1.5 });
      }
    }, [selectedZoneId, map]);
    return null;
  }

  if (loading && !cooperative) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading map data...</p>
      </div>
    );
  }

  if (error && zones.length === 0) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-12">
        <WifiOff className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-rose-800">Connection Error</h2>
        <p className="text-rose-600 mt-2 text-sm">{error}</p>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="mt-6 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  // Count active alerts per zone
  const alertsByZone = {};
  alerts.forEach(a => {
    // Map alert to zone index
    const zoneMatch = zones.find(z => z.nom_zone === a.zone);
    if (zoneMatch) {
      alertsByZone[zoneMatch.id_zone] = (alertsByZone[zoneMatch.id_zone] || 0) + (a.statut === "OUVERTE" ? 1 : 0);
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Header Inline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
            <MapIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Spatial Intelligence</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {cooperative?.nom_cooperative} · {zones.length} Monitored zones
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCapteurs(!showCapteurs)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black border transition-all ${
              showCapteurs
                ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            {showCapteurs ? "Hide Sensors" : "Show Sensors"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Leaflet Map */}
        <div className="flex-[3] relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-xl max-w-[180px]">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 underline decoration-emerald-500 underline-offset-4">
              <Info className="w-3 h-3 text-emerald-500" /> Risk Levels
            </div>
            {Object.entries(risqueBadge).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 mb-2 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: risqueFill[k]?.stroke }} />
                <span className={`text-[10px] font-bold capitalize ${v.color} tracking-tight`}>{v.label}</span>
              </div>
            ))}

            {showCapteurs && (
              <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-600">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white shadow-sm animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-600">Alarm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
                  <span className="text-[10px] font-bold text-slate-400">Failure</span>
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
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Zone Polygons */}
            {zonesWithPolygons.map(z => {
              if (z.leafletCoords.length === 0) return null;
              const rc = risqueFill[z.niveau_risque_base] || risqueFill.faible;
              const isSelected = selectedZone === z.id_zone;

              return (
                <Polygon
                  key={z.id_zone}
                  positions={z.leafletCoords}
                  pathOptions={{
                    fillColor: rc.stroke,
                    fillOpacity: isSelected ? 0.4 : 0.15,
                    color: isSelected ? "#065f46" : rc.stroke,
                    weight: isSelected ? 4 : 2,
                    dashArray: isSelected ? "" : "5, 5"
                  }}
                  eventHandlers={{
                    click: () => setSelectedZone(isSelected ? null : z.id_zone),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1">
                      <div className="font-black text-slate-800 text-sm">{z.nom_zone}</div>
                      <div className="text-xs font-bold text-emerald-600 mt-1">{z.superficie_ha} hectares</div>
                      <div className="mt-2 text-[10px] font-black uppercase text-slate-400 border-t pt-2">Current Risk: {z.indice_risque}</div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Sensors on map */}
            {showCapteurs && sensors.map(s => {
              const isInactive = s.statut !== "ACTIF";
              const hasAlert = s.latest_reading && s.latest_reading.temperature_c > 50;
              const color = isInactive ? "#94a3b8" : hasAlert ? "#ef4444" : "#10b981";

              const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="
                  width: 14px;
                  height: 14px;
                  background-color: ${color};
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 ${hasAlert ? '12px 4px rgba(239, 68, 68, 0.5)' : '4px rgba(0,0,0,0.2)'};
                  ${hasAlert ? 'animation: pulse 1.5s infinite;' : ''}
                "></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });

              return (
                <Marker
                  key={s.id_capteur}
                  position={[s.latitude, s.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{s.reference_serie}</div>
                      {s.latest_reading ? (
                        <div className={`text-lg font-black ${hasAlert ? "text-rose-600" : "text-slate-800"}`}>
                          {s.latest_reading.temperature_c}°C
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic font-bold">Offline</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-hidden">
          {!zone ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col flex-1">
              <h3 className="font-black text-slate-800 text-sm mb-5 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-tight">
                Zones List
              </h3>
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {zonesWithPolygons.length > 0 ? zonesWithPolygons.map(z => {
                  const rb = risqueBadge[z.niveau_risque_base] || risqueBadge.faible;
                  const activeAlertsCount = alertsByZone[z.id_zone] || 0;
                  return (
                    <div
                      key={z.id_zone}
                      onClick={() => setSelectedZone(z.id_zone)}
                      className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md hover:bg-emerald-50/20 transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors truncate">{z.nom_zone}</div>
                        <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{z.superficie_ha} HA</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-black uppercase py-0.5 px-2 rounded-lg border ${rb.bg} ${rb.color}`}>
                          {rb.label}
                        </span>
                        {activeAlertsCount > 0 && (
                          <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-lg animate-pulse shadow-sm">
                            {activeAlertsCount} ALERT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12">
                    <MapIcon className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 font-bold">No zones configured</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col flex-1 animate-in slide-in-from-right-10 duration-500 overflow-hidden">
              <button
                onClick={() => setSelectedZone(null)}
                className="self-start text-[10px] font-black text-slate-400 hover:text-emerald-600 flex items-center gap-1 mb-6 bg-slate-50 px-3 py-1.5 rounded-xl transition-all border border-slate-100 uppercase tracking-widest"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to list
              </button>

              {/* Zone Info card */}
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{zone.nom_zone}</h2>
                <div className="flex items-center gap-2 mt-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                   <p className="text-xs font-bold text-slate-500 italic uppercase tracking-tighter">
                    Real-time data
                  </p>
                </div>
              </div>

              {/* Zone Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: "Superficie", val: `${zone.superficie_ha} ha`, color: "text-slate-800" },
                  { label: "Alertes", val: alertsByZone[zone.id_zone] || 0, color: (alertsByZone[zone.id_zone] || 0) > 0 ? "text-rose-600" : "text-emerald-600" },
                  { label: "Risque", val: zone.indice_risque, color: "text-slate-800" },
                  { label: "Capteurs", val: capteursZone.length, color: "text-slate-800" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
                    <div className={`text-base font-black ${s.color}`}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sensors List in side panel */}
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                <Layers className="w-3.5 h-3.5 text-emerald-500" /> Sensor Telemetry
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {capteursZone.map(c => {
                  const isPanne = c.statut !== "ACTIF";
                  const hasAlert = c.latest_reading && c.latest_reading.temperature_c > 50;
                  
                  return (
                    <div key={c.id_capteur} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-100 shadow-sm transition-all group">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isPanne ? "bg-slate-300" : hasAlert ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 text-xs truncate group-hover:text-emerald-600">{c.reference_serie}</div>
                        <div className="text-[9px] text-slate-400 font-black uppercase mt-0.5">{c.statut}</div>
                      </div>

                      <div className={`text-sm font-black ${hasAlert ? "text-rose-600" : "text-slate-800"}`}>
                        {c.latest_reading ? `${c.latest_reading.temperature_c}°C` : "—"}
                      </div>
                    </div>
                  );
                })}
                {capteursZone.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[10px] text-slate-400 font-bold italic">Deployment pending...</p>
                  </div>
                )}
              </div>

              <button className="mt-8 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
                Zone Report
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { border-radius: 1.5rem; padding: 4px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        .custom-popup .leaflet-popup-tip { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
