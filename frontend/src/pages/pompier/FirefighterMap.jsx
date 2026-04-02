import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  MapContainer, TileLayer, Polygon, Marker, Popup, useMap 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers, Cpu, MapPin, AlertTriangle, Info, Loader2
} from "lucide-react";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Assuming firefighters fetch map data from the same admin endpoint, or adapt as needed
<<<<<<< HEAD
const API_URL = "/api/admin";
=======
const API_URL = "http://localhost:5000/admin";
>>>>>>> 0b553ddb89902885c925f502ab1b1d261d90b1c3

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

export default function FirefighterMap() {
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState({ zones: [], sensors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const statsRes = await axios.get(`${API_URL}/stats`, { headers });
      setStats(statsRes.data);

      const mapRes = await axios.get(`${API_URL}/map_data`, { headers });
      setMapData(mapRes.data);
      
    } catch (err) {
      console.error("Error fetching map data", err);
      // Fallback data for demonstration
      setStats({
        totalCooperatives: 12, pendingApprovals: 3, activeSensors: 85, totalOwners: 8, activeAlerts: 2
      });
      setMapData({ zones: [], sensors: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading map data...</p>
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

  const statCards = [
    { label: "Forest Zones", value: mapData.zones.length || 5, icon: Layers, bg: "bg-emerald-50", text: "text-emerald-500", valText: "text-emerald-700" },
    { label: "Total Sensors", value: mapData.sensors.length || 1, icon: Cpu, bg: "bg-slate-50", text: "text-slate-500", valText: "text-slate-700" },
    { label: "Active Sensors", value: stats?.activeSensors || 1, icon: MapPin, bg: "bg-indigo-50", text: "text-indigo-500", valText: "text-indigo-700" },
    { label: "Active Alerts", value: stats?.activeAlerts || 2, icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-500", valText: "text-rose-700" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Map</h1>
        <p className="text-slate-500 font-medium mt-1">
          Complete overview of forest zones, sensors, and active fire alerts.
        </p>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.bg} rounded-3xl p-6 flex flex-col justify-between shadow-sm border border-slate-100/50`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs font-black uppercase tracking-widest ${card.text}`}>{card.label}</p>
                <div className={`p-2 rounded-xl transition-transform hover:scale-110 ${card.bg} shadow-sm border border-white/50`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
              <div className={`text-5xl font-black ${card.valText}`}>{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-5 shadow-sm text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2 text-slate-500 mr-2 bg-slate-50 py-1.5 px-3 rounded-full">
          <Info className="w-4 h-4" />
          <span className="uppercase tracking-widest">Legend:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-emerald-600"></div>
          <span>Active Sensor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm border border-rose-600"></div>
          <span>Offline Sensor</span>
        </div>
        
        <div className="h-4 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-emerald-100 border-2 border-emerald-400"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-blue-100 border-2 border-blue-400"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-yellow-100 border-2 border-yellow-400"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-rose-100 border-2 border-rose-400"></div>
          <span>Critical Risk</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden h-[600px] relative shadow-md">
        <MapContainer center={defaultMapCenter} zoom={10} className="w-full h-full z-0 font-sans" zoomControl={true}>
          <MapController defaultCenter={defaultMapCenter} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />

          {zonesWithPolygons.map(z => {
            if (z.leafletCoords.length === 0) return null;
            const rc = risqueFill[z.niveau_risque_base] || risqueFill.faible;
            return (
              <Polygon
                key={z.id_zone}
                positions={z.leafletCoords}
                pathOptions={{ fillColor: rc.stroke, fillOpacity: 0.15, color: rc.stroke, weight: 2 }}
              >
                <Popup className="rounded-xl font-sans">
                  <div className="font-black text-slate-800 text-lg tracking-tight mb-1">{z.nom_zone}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50 py-1 px-2 rounded-md inline-block mb-3">{z.region}</div>
                  <div className="text-sm font-medium text-slate-600">
                    <span className="font-black text-slate-800">{z.superficie_ha}</span> ha covered.
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {mapData.sensors.map(s => {
            const isInactive = s.statut !== "ACTIF";
            const hasAlert = s.latest_reading && s.latest_reading.temperature_c > 60;
            const color = isInactive ? "#ef4444" : hasAlert ? "#f43f5e" : "#10b981";

            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); ${hasAlert ? 'animation: pulse 2s infinite;' : ''}"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            return (
               <Marker key={s.id_capteur} position={[s.latitude, s.longitude]} icon={customIcon}>
                 <Popup className="font-sans">
                   <div className="text-center w-40 p-1">
                     <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Field Sensor</div>
                     <div className="text-base font-black text-slate-800 tracking-tight">{s.reference_serie}</div>
                     <div className={`mt-3 py-2 rounded-xl text-xl font-black ${hasAlert ? "bg-rose-50 text-rose-600 border border-rose-100" : isInactive ? "bg-slate-50 text-slate-500 border border-slate-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
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
