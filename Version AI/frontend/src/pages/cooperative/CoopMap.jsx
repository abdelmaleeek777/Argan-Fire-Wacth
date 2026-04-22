import { useState, useEffect } from "react";
import axios from "axios";
import { Map as MapIcon, Layers, Info, ChevronLeft, Loader2, WifiOff, Thermometer } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = "/api";

const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981", bg: "bg-emerald-300" },
  moyen:    { fill: "rgba(59, 130, 246, 0.1)", stroke: "#3b82f6", bg: "bg-blue-300" },
  "élevé":  { fill: "rgba(250, 204, 21, 0.1)", stroke: "#facc15", bg: "bg-yellow-300" },
  critique: { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444", bg: "bg-rose-300" },
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

// Heatmap Layer Component
function HeatmapLayer({ points, show }) {
  const map = useMap();
  
  useEffect(() => {
    if (!show) return;
    
    // Filter out invalid points (must have valid lat, lng, and intensity)
    const validPoints = points.filter(p => 
      p && 
      typeof p[0] === 'number' && !isNaN(p[0]) &&
      typeof p[1] === 'number' && !isNaN(p[1]) &&
      typeof p[2] === 'number' && !isNaN(p[2])
    );
    
    if (validPoints.length === 0) {
      console.log("Heatmap: No valid points to display");
      return;
    }

    console.log("Heatmap: Displaying", validPoints.length, "points", validPoints);

    const heatLayer = L.heatLayer(validPoints, {
      radius: 40,
      blur: 30,
      maxZoom: 17,
      max: 60, // Max temperature expected
      minOpacity: 0.5,
      gradient: {
        0.0: '#0000ff',  // Cold (blue)
        0.25: '#00ffff', // Cool (cyan)
        0.4: '#00ff00',  // Normal (green)
        0.6: '#ffff00',  // Warm (yellow)
        0.8: '#ffa500',  // Hot (orange)
        1.0: '#ff0000'   // Very hot (red)
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, show]);

  return null;
}

export default function CoopMap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [showCapteurs, setShowCapteurs] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
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
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/dashboard`, { headers });
      const data = res.data;
      setCooperative(data.cooperative);
      setZones(data.zones || []);
      
      // Fetch sensors separately to be sure we get all for all zones
      const sensRes = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/sensors`, { headers });
      setSensors(Array.isArray(sensRes.data) ? sensRes.data : []);
      
      const alRes = await axios.get(`${API_BASE}/cooperative/${cooperativeId}/alerts`, { headers });
      setAlerts(Array.isArray(alRes.data) ? alRes.data : []);
      
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
      // Map 'active' or 'OUVERTE' to count as open alerts
      const isOpen = a.statut === "active" || a.statut === "OUVERTE";
      alertsByZone[zoneMatch.id_zone] = (alertsByZone[zoneMatch.id_zone] || 0) + (isOpen ? 1 : 0);
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] animate-in fade-in duration-700 bg-transparent">
      {/* Header Inline */}
      <div className="bg-[#F8F7F2] rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.03)] p-5 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-[48px] h-[48px] rounded-[14px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
            <MapIcon className="w-6 h-6 text-[#4E6B4A]" />
          </div>
          <div>
            <h1 className="text-[22px] font-[800] text-[#1F2A22] tracking-tight leading-none">Spatial Intelligence</h1>
            <p className="text-[12px] font-[700] text-[#6B7468] mt-1 uppercase tracking-widest">
              {cooperative?.nom_cooperative} · {zones.length} Monitored zones
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[12px] font-[800] tracking-wider uppercase transition-all ${
              showHeatmap
                ? "bg-[#B55A3C] text-white shadow-md shadow-[#B55A3C]/20"
                : "bg-[#F8F7F2] text-[#1F2A22] border border-[#4F5C4A]/20 hover:bg-[#DCE3D6]"
            }`}
          >
            <Thermometer className="w-4 h-4" />
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </button>
          <button
            onClick={() => setShowCapteurs(!showCapteurs)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[12px] font-[800] tracking-wider uppercase transition-all ${
              showCapteurs
                ? "bg-[#4E6B4A] text-white shadow-md shadow-[#4E6B4A]/20"
                : "bg-[#F8F7F2] text-[#1F2A22] border border-[#4F5C4A]/20 hover:bg-[#DCE3D6]"
            }`}
          >
            <Layers className="w-4 h-4" />
            {showCapteurs ? "Hide Sensors" : "Show Sensors"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* Leaflet Map */}
        <div className="flex-[3] relative bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] overflow-hidden shadow-[0_8px_24px_rgba(31,42,33,0.04)]">
          {/* Legend Overlay */}
          <div className="absolute top-5 left-5 z-[1000] bg-[#FAF8F4]/95 backdrop-blur-md rounded-[20px] p-5 border border-[#4F5C4A]/[0.10] shadow-[0_8px_32px_rgba(31,42,33,0.08)] min-w-[200px]">
            <div className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#4E6B4A]" /> Risk Levels
            </div>
            {Object.entries(risqueBadge).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: risqueFill[k]?.stroke }} />
                <span className={`text-[12px] font-[800] capitalize tracking-wide ${v.color}`}>{v.label}</span>
              </div>
            ))}

            {showCapteurs && (
              <div className="border-t border-[#4F5C4A]/10 mt-5 pt-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] border-[2px] border-white shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[12px] font-[800] text-[#1F2A22]">Active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] border-[2px] border-white shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse" />
                  <span className="text-[12px] font-[800] text-[#ef4444]">Alarm</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#94a3b8] border-[2px] border-white" />
                  <span className="text-[12px] font-[800] text-[#6B7468]">Failure</span>
                </div>
              </div>
            )}

            {showHeatmap && (
              <div className="border-t border-[#4F5C4A]/10 mt-5 pt-5">
                <div className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-[#B55A3C]" /> Temperature Heat
                </div>
                <div className="h-4 rounded-[8px] bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 border border-[#4F5C4A]/5" />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-[800] text-blue-600 uppercase tracking-widest">Cold</span>
                  <span className="text-[10px] font-[800] text-red-600 uppercase tracking-widest">Hot</span>
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
            
            {/* Heatmap Layer - filter sensors with valid coordinates */}
            <HeatmapLayer 
              points={sensors
                .filter(s => s.latitude && s.longitude)
                .map(s => [
                  parseFloat(s.latitude), 
                  parseFloat(s.longitude), 
                  parseFloat(s.latest_reading?.temperature_c || s.temperature_c || 30)
                ])} 
              show={showHeatmap} 
            />

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
                    color: isSelected ? "#1F2A22" : rc.stroke,
                    weight: isSelected ? 4 : 2,
                    dashArray: isSelected ? "" : "5, 5"
                  }}
                  eventHandlers={{
                    click: () => setSelectedZone(isSelected ? null : z.id_zone),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2">
                      <div className="font-[900] text-[#1F2A22] text-[16px] leading-tight">{z.nom_zone}</div>
                      <div className="text-[12px] font-[900] text-[#4E6B4A] mt-1">{z.superficie_ha} HA</div>
                      <div className="mt-3 text-[10px] font-[800] uppercase text-[#6B7468] border-t border-[#4F5C4A]/10 pt-2 tracking-widest">
                        Current Risk: <span className="text-[#1F2A22]">{z.indice_risque}</span>
                      </div>
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
                  width: 16px;
                  height: 16px;
                  background-color: ${color};
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 ${hasAlert ? '12px 4px rgba(239, 68, 68, 0.5)' : '4px rgba(0,0,0,0.2)'};
                  ${hasAlert ? 'animation: pulse 1.5s infinite;' : ''}
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
                  <Popup className="custom-popup">
                    <div className="text-center p-2">
                      <div className="text-[10px] font-[900] text-[#4E6B4A] uppercase mb-1 tracking-widest">{s.reference_serie}</div>
                      {s.latest_reading ? (
                        <div className={`text-[20px] font-[900] ${hasAlert ? "text-[#B55A3C]" : "text-[#1F2A22]"}`}>
                          {s.latest_reading.temperature_c}°C
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#6B7468] italic font-[800]">Offline</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-[360px] flex flex-col gap-4 overflow-hidden shrink-0">
          {!zone ? (
            <div className="bg-[#FAF8F4] rounded-[32px] border border-[#4F5C4A]/[0.10] p-6 shadow-[0_8px_24px_rgba(31,42,33,0.03)] overflow-hidden flex flex-col flex-1">
              <h3 className="font-[900] text-[#1F2A22] text-[18px] mb-5 flex items-center gap-2 pb-4 border-b border-[#4F5C4A]/[0.08] tracking-tight">
                Zonal Overview
              </h3>
              <div className="overflow-y-auto space-y-3 flex-1 pr-2 custom-scrollbar">
                {zonesWithPolygons.length > 0 ? zonesWithPolygons.map(z => {
                  const rb = risqueBadge[z.niveau_risque_base] || risqueBadge.faible;
                  const activeAlertsCount = alertsByZone[z.id_zone] || 0;
                  return (
                    <div
                      key={z.id_zone}
                      onClick={() => setSelectedZone(z.id_zone)}
                      className="p-5 rounded-[20px] bg-[#F8F7F2] border border-[#4F5C4A]/[0.05] hover:border-[#4E6B4A]/30 shadow-[0_2px_8px_rgba(31,42,33,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-[800] text-[#1F2A22] text-[15px] group-hover:text-[#4E6B4A] transition-colors truncate leading-tight">{z.nom_zone}</div>
                        <div className="text-[10px] font-[900] text-[#6B7468] mt-1.5 uppercase tracking-widest">{z.superficie_ha} HA</div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-[9px] font-[900] uppercase py-1 px-2.5 rounded-[8px] bg-white border border-[#4F5C4A]/[0.05] shadow-sm ${rb.color}`}>
                          {rb.label}
                        </span>
                        {activeAlertsCount > 0 && (
                          <span className="text-[9px] font-[900] bg-[#B55A3C] text-white px-2.5 py-1 rounded-[8px] animate-pulse shadow-[0_2px_8px_rgba(181,90,60,0.4)] tracking-widest">
                            {activeAlertsCount} ALERT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-12">
                    <MapIcon className="w-12 h-12 text-[#6B7468]/30 mx-auto mb-3" />
                    <p className="text-[12px] text-[#6B7468] font-[800] uppercase tracking-widest">No zones configured</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF8F4] rounded-[32px] border border-[#4F5C4A]/[0.10] p-6 shadow-[0_8px_24px_rgba(31,42,33,0.03)] flex flex-col flex-1 animate-in slide-in-from-right-10 duration-500 overflow-hidden relative">
              <button
                onClick={() => setSelectedZone(null)}
                className="self-start text-[10px] font-[900] text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#DCE3D6] flex items-center gap-1.5 mb-6 bg-[#F8F7F2] px-3.5 py-2 rounded-[12px] transition-all border border-[#4F5C4A]/[0.10] uppercase tracking-widest shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to list
              </button>

              {/* Zone Info card */}
              <div className="mb-8 pl-1">
                <h2 className="text-[28px] font-[900] text-[#1F2A22] tracking-tight leading-none mb-3">{zone.nom_zone}</h2>
                <div className="flex items-center gap-2.5 inline-flex px-3 py-1.5 bg-[#DCE3D6]/50 rounded-[8px]">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#4E6B4A] animate-pulse shadow-[0_0_8px_rgba(78,107,74,0.6)]" />
                   <p className="text-[10px] font-[900] text-[#4E6B4A] uppercase tracking-widest">
                    Real-time link
                  </p>
                </div>
              </div>

              {/* Zone Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: "Superficie", val: `${zone.superficie_ha} ha`, color: "text-[#1F2A22]" },
                  { label: "Alertes", val: alertsByZone[zone.id_zone] || 0, color: (alertsByZone[zone.id_zone] || 0) > 0 ? "text-[#B55A3C]" : "text-[#4E6B4A]" },
                  { label: "Risque", val: zone.indice_risque, color: "text-[#1F2A22]" },
                  { label: "Capteurs", val: capteursZone.length, color: "text-[#1F2A22]" },
                ].map((s, i) => (
                  <div key={i} className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.08] rounded-[20px] p-5 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                    <div className="text-[10px] font-[900] text-[#6B7468] uppercase tracking-widest mb-1.5">{s.label}</div>
                    <div className={`text-[20px] font-[900] leading-none ${s.color}`}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sensors List in side panel */}
              <h3 className="text-[11px] font-[900] text-[#6B7468] uppercase tracking-widest mb-4 flex items-center gap-2 pl-2">
                <Layers className="w-4 h-4 text-[#4E6B4A]" /> Sensor Telemetry
              </h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {capteursZone.map(c => {
                  const isPanne = c.statut !== "ACTIF";
                  const hasAlert = c.latest_reading && c.latest_reading.temperature_c > 50;
                  
                  return (
                    <div key={c.id_capteur} className="flex items-center gap-4 p-4 bg-[#F8F7F2] border border-[#4F5C4A]/[0.05] rounded-[20px] hover:border-[#4E6B4A]/20 shadow-sm transition-all group">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${isPanne ? "bg-[#94a3b8]" : hasAlert ? "bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-[#10b981]"}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-[800] text-[#1F2A22] text-[13px] truncate group-hover:text-[#4E6B4A] transition-colors">{c.reference_serie}</div>
                        <div className="text-[9px] text-[#6B7468] font-[900] uppercase tracking-widest mt-1">{c.statut}</div>
                      </div>

                      <div className={`text-[16px] font-[900] bg-white px-2.5 py-1 rounded-[8px] border border-[#4F5C4A]/[0.05] shadow-sm ${hasAlert ? "text-[#B55A3C]" : "text-[#1F2A22]"}`}>
                        {c.latest_reading ? `${c.latest_reading.temperature_c}°C` : "—"}
                      </div>
                    </div>
                  );
                })}
                {capteursZone.length === 0 && (
                  <div className="text-center py-10 bg-[#F8F7F2] rounded-[20px] border border-[#4F5C4A]/[0.05] border-dashed">
                    <p className="text-[10px] text-[#6B7468] font-[800] uppercase tracking-widest">Deployment pending</p>
                  </div>
                )}
              </div>

              <button className="mt-6 w-full py-4 bg-[#B88A44] hover:bg-[#A37839] text-white rounded-[16px] font-[900] text-[12px] uppercase tracking-widest shadow-[0_8px_24px_rgba(184,138,68,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(184,138,68,0.4)] active:scale-[0.98]">
                Zone Report
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper { 
          border-radius: 20px; 
          padding: 8px; 
          box-shadow: 0 12px 32px rgba(31,42,33,0.15); 
          border: 1px solid rgba(79, 92, 74, 0.1);
          background-color: #FAF8F4;
        }
        .custom-popup .leaflet-popup-tip { 
          box-shadow: 0 12px 32px rgba(31,42,33,0.15); 
          background-color: #FAF8F4;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(79, 92, 74, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 92, 74, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 92, 74, 0.25);
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
