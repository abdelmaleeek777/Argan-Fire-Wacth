import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  MapContainer, TileLayer, Polygon, Marker, Popup, useMap 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import {
  Layers, Cpu, MapPin, AlertTriangle, Info, Loader2, Thermometer
} from "lucide-react";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ADMIN_API = "/api/admin";

const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981", bg: "bg-emerald-300" },
  moyen:    { fill: "rgba(59, 130, 246, 0.1)", stroke: "#3b82f6", bg: "bg-blue-300" },
  "élevé":  { fill: "rgba(250, 204, 21, 0.1)", stroke: "#facc15", bg: "bg-yellow-300" },
  critique: { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444", bg: "bg-rose-300" },
};

function wktToLeaflet(coords) {
  if (!coords || coords.length === 0) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

function getPolygonCenter(coords) {
  if (!coords || coords.length === 0) return [30.38, -8.96]; 
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

function MapController({ defaultCenter }) {
  const map = useMap();
  useEffect(() => {
    if (defaultCenter) {
      map.flyTo(defaultCenter, 10, { duration: 1.5 });
    }
  }, [defaultCenter, map]);
  return null;
}

// Heatmap Layer Component
function HeatmapLayer({ points, show }) {
  const map = useMap();
  
  useEffect(() => {
    if (!show || points.length === 0) return;

    // Create heatmap layer with temperature data
    // Points format: [lat, lng, intensity]
    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 100, // Max temperature for scaling
      minOpacity: 0.4,
      gradient: {
        0.0: '#00f',    // Blue (cold)
        0.2: '#0ff',    // Cyan
        0.4: '#0f0',    // Green
        0.6: '#ff0',    // Yellow
        0.8: '#ffa500', // Orange
        1.0: '#f00'     // Red (hot)
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, show]);

  return null;
}

export default function AdminMap() {
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState({ zones: [], sensors: [] });
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const statsRes = await axios.get(`${ADMIN_API}/stats`, { headers });
      setStats(statsRes.data);

      const mapRes = await axios.get(`${ADMIN_API}/map_data`, { headers });
      setMapData(mapRes.data);
      
    } catch (err) {
      console.error("Error fetching map data", err);
      setStats({
        totalCooperatives: 0, pendingApprovals: 0, activeSensors: 0, totalOwners: 0, activeAlerts: 0
      });
      setMapData({ zones: [], sensors: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading System Map...</p>
      </div>
    );
  }

  const zonesWithPolygons = mapData.zones.map(z => ({
    ...z,
    leafletCoords: wktToLeaflet(z.coordinates || []),
    center: z.coordinates && z.coordinates.length > 0
      ? getPolygonCenter(wktToLeaflet(z.coordinates))
      : [30.38, -8.96],
  }));

  const defaultMapCenter = zonesWithPolygons.length > 0 && zonesWithPolygons[0].leafletCoords.length > 0
    ? zonesWithPolygons[0].center
    : [30.38, -8.96];

  // Prepare heatmap points from sensors with temperature data
  // Format: [lat, lng, intensity]
  const heatmapPoints = mapData.sensors
    .filter(s => s.latest_reading && s.latest_reading.temperature_c)
    .map(s => [
      s.latitude,
      s.longitude,
      s.latest_reading.temperature_c // intensity based on temperature
    ]);

  // The cards from the design
  const statCards = [
    { label: "Forest Zones", value: mapData.zones.length, icon: Layers, bg: "bg-emerald-50", text: "text-emerald-500", valText: "text-emerald-700" },
    { label: "Total Sensors", value: mapData.sensors.length, icon: Cpu, bg: "bg-blue-50", text: "text-blue-500", valText: "text-blue-700" },
    { label: "Active Sensors", value: stats?.activeSensors || 0, icon: MapPin, bg: "bg-emerald-50", text: "text-emerald-500", valText: "text-emerald-700" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-500", valText: "text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">System Map</h1>
        <p className="text-slate-500 text-sm mt-1">
          Full map of all cooperatives, sensors, and fire alerts across Souss-Massa.
        </p>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.bg} rounded-2xl p-5 flex items-center justify-between`}>
              <div className="flex flex-col justify-start">
                <Icon className={`w-5 h-5 ${card.text} mb-3`} />
                <p className={`text-xs font-semibold ${card.text}`}>{card.label}</p>
              </div>
              <div className={`text-4xl font-extrabold ${card.valText}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-5 shadow-sm text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5 text-slate-500 mr-2">
          <Info className="w-4 h-4" />
          <span>Legend:</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span>Active Sensor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          <span>Offline Sensor</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-emerald-200 border border-emerald-400"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-blue-200 border border-blue-400"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-yellow-200 border border-yellow-400"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-rose-200 border border-rose-400"></div>
          <span>Critical Risk</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-rose-400 ring-2 ring-rose-200 opacity-80"></div>
          <span>Active Alert</span>
        </div>

        {/* Heatmap Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              showHeatmap 
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Heatmap {showHeatmap ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden h-[500px] relative shadow-sm">
        <MapContainer center={defaultMapCenter} zoom={10} className="w-full h-full z-0" zoomControl={true}>
          <MapController defaultCenter={defaultMapCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

          {/* Temperature Heatmap Layer */}
          <HeatmapLayer points={heatmapPoints} show={showHeatmap} />

          {zonesWithPolygons.map(z => {
            if (z.leafletCoords.length === 0) return null;
            const rc = risqueFill[z.niveau_risque_base] || risqueFill.faible;
            return (
              <Polygon
                key={z.id_zone}
                positions={z.leafletCoords}
                pathOptions={{ fillColor: rc.stroke, fillOpacity: 0.2, color: rc.stroke, weight: 2 }}
              >
                <Popup className="rounded-xl">
                  <div className="font-bold text-slate-800 text-lg">{z.nom_zone}</div>
                  <div className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{z.region}</div>
                  {z.cooperative_name && (
                    <div className="text-xs text-emerald-600 mt-1 font-semibold">
                      {z.cooperative_name}
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">{z.superficie_ha}</span> ha covered.
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {mapData.sensors.map(s => {
            const isInactive = s.statut !== "ACTIF";
            const hasAlert = s.latest_reading && s.latest_reading.temperature_c > 60;
            const color = isInactive ? "#ef4444" : hasAlert ? "#f43f5e" : "#10b981"; // Offline is red

            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width: 14px; height: 14px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 ${hasAlert ? '15px 5px rgba(239, 68, 68, 0.6)' : '3px rgba(0,0,0,0.2)'}; ${hasAlert ? 'animation: pulse 2s infinite;' : ''}"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });

            return (
              <Marker key={s.id_capteur} position={[s.latitude, s.longitude]} icon={customIcon}>
                <Popup>
                  <div className="text-center w-36">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sensor</div>
                    <div className="text-sm font-bold text-slate-800">{s.reference_serie}</div>
                    <div className={`mt-2 py-2 rounded-xl text-lg font-black ${hasAlert ? "bg-rose-50 text-rose-600" : isInactive ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                      {s.latest_reading ? `${s.latest_reading.temperature_c}°C` : "N/A"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

    </div>
  );
}
