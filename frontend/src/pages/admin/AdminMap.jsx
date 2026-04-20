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
  faible:   { stroke: "#4E6B4A", bg: "bg-[#4E6B4A]/20" },
  moyen:    { stroke: "#6E7A4E", bg: "bg-[#6E7A4E]/20" },
  "élevé":  { stroke: "#B88A44", bg: "bg-[#B88A44]/20" },
  critique: { stroke: "#A64D4D", bg: "bg-[#A64D4D]/20" },
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

    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 100, 
      minOpacity: 0.4,
      gradient: {
        0.0: '#0000ff',    // Blue (cold)
        0.2: '#00ffff',    // Cyan
        0.4: '#00ff00',    // Green
        0.6: '#ffff00',    // Yellow
        0.8: '#ffa500',    // Orange
        1.0: '#ff0000'     // Red (hot)
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
        <Loader2 className="w-10 h-10 text-[#4E6B4A] animate-spin" />
        <p className="text-[#6B7468] font-[700]">Loading System Map...</p>
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

  const heatmapPoints = mapData.sensors
    .filter(s => s.latest_reading && s.latest_reading.temperature_c)
    .map(s => [
      s.latitude,
      s.longitude,
      s.latest_reading.temperature_c 
    ]);

  const statCards = [
    { label: "Forest Zones", value: mapData.zones.length, icon: Layers, tint: "#4E6B4A" },
    { label: "Total Sensors", value: mapData.sensors.length, icon: Cpu, tint: "#6B7468" },
    { label: "Active Sensors", value: stats?.activeSensors || 0, icon: MapPin, tint: "#6E7A4E" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, tint: "#B88A44" },
  ];

  return (
    <div className="space-y-[32px] pb-10">
      <div className="bg-[#F8F7F2] p-[32px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)]">
        <h1 className="text-[24px] font-[700] text-[#1F2A22] tracking-tight">System Map</h1>
        <p className="text-[#6B7468] text-[14px] mt-1 font-medium">
          Global visualization of argan forests, sensors, and environmental monitoring across Morocco.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-[24px] flex-1">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[#F8F7F2] rounded-[24px] p-6 border border-[#4F5C4A]/[0.10] flex items-center justify-between hover:shadow-md transition-all group">
              <div className="flex flex-col justify-start">
                <Icon className="w-5 h-5 mb-3 transition-transform group-hover:scale-110" style={{ color: card.tint }} />
                <p className="text-[10px] font-[800] uppercase tracking-widest text-[#6B7468]">{card.label}</p>
              </div>
              <div className="text-[32px] font-[800] text-[#1F2A22] tracking-tighter" style={{ color: card.tint }}>{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[24px] p-5 flex flex-wrap items-center gap-6 shadow-sm text-[11px] font-[800] text-[#6B7468] uppercase tracking-wider">
        <div className="flex items-center gap-2 text-[#4E6B4A] mr-2">
          <Info className="w-4 h-4" />
          <span>Legend:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4E6B4A] shadow-sm"></div>
          <span>Active Sensor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>
          <span>Offline</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-[#4E6B4A]/20 border border-[#4E6B4A]/40"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-[#B88A44]/20 border border-[#B88A44]/40"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-rose-200 border border-rose-400"></div>
          <span>Critical</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[14px] font-[800] text-[12px] uppercase tracking-widest transition-all ${
              showHeatmap 
                ? "bg-[#4E6B4A] text-white shadow-md shadow-[#4E6B4A]/20" 
                : "bg-[#DCE3D6] text-[#1F2A22] hover:bg-[#CBD8C8]"
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Heatmap {showHeatmap ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] overflow-hidden h-[550px] relative shadow-[0_20px_50px_rgba(31,42,33,0.06)] z-0">
        <MapContainer center={defaultMapCenter} zoom={10} className="w-full h-full" zoomControl={true}>
          <MapController defaultCenter={defaultMapCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <HeatmapLayer points={heatmapPoints} show={showHeatmap} />

          {zonesWithPolygons.map(z => {
            if (z.leafletCoords.length === 0) return null;
            const rc = risqueFill[z.niveau_risque_base] || risqueFill.faible;
            return (
              <Polygon
                key={z.id_zone}
                positions={z.leafletCoords}
                pathOptions={{ fillColor: rc.stroke, fillOpacity: 0.15, color: rc.stroke, weight: 3 }}
              >
                <Popup className="rounded-[20px] overflow-hidden">
                  <div className="p-1">
                    <div className="font-[800] text-[#1F2A22] text-[16px] tracking-tight">{z.nom_zone}</div>
                    <div className="text-[10px] text-[#6B7468] mt-1 uppercase font-[800] tracking-widest">{z.region}</div>
                    {z.cooperative_name && (
                      <div className="text-[12px] text-[#4E6B4A] mt-2 font-[800] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4E6B4A]"></div>
                        {z.cooperative_name}
                      </div>
                    )}
                    <div className="mt-3 text-[13px] text-[#1F2A22] font-bold">
                      <span className="text-[#B88A44]">{z.superficie_ha}</span> hectares protected
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {mapData.sensors.map(s => {
            const isInactive = s.statut !== "ACTIF";
            const hasAlert = s.latest_reading && s.latest_reading.temperature_c > 60;
            const color = isInactive ? "#A64D4D" : hasAlert ? "#A64D4D" : "#4E6B4A"; 

            const customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 3px solid #F8F7F2; border-radius: 50%; box-shadow: 0 0 ${hasAlert ? '20px 8px rgba(166, 77, 77, 0.6)' : '8px rgba(31,42,33,0.15)'}; ${hasAlert ? 'animation: pulse 2s infinite;' : ''}"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });

            return (
              <Marker key={s.id_capteur} position={[s.latitude, s.longitude]} icon={customIcon}>
                <Popup className="rounded-[20px]">
                  <div className="text-center w-40 p-1">
                    <div className="text-[10px] font-[800] uppercase text-[#6B7468] tracking-widest mb-1">Sensor Reference</div>
                    <div className="text-[14px] font-[800] text-[#1F2A22] mb-3">{s.reference_serie}</div>
                    <div className={`py-2 rounded-[14px] text-[18px] font-[800] border ${hasAlert ? "bg-rose-50 text-rose-600 border-rose-100" : isInactive ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-[#4E6B4A]/10 text-[#4E6B4A] border-[#4E6B4A]/20"}`}>
                      {s.latest_reading ? `${s.latest_reading.temperature_c}°C` : "OFFLINE"}
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
