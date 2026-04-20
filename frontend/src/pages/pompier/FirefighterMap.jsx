import React, { useState, useEffect, useRef } from "react";
import { 
  MapContainer, TileLayer, Marker, Popup, useMap, Polygon 
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers, Cpu, AlertTriangle, Info, Loader2, Thermometer, Flame, RefreshCw
} from "lucide-react";
import api from "../../utils/axiosInstance";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Risk level colors (matching admin)
const risqueFill = {
  faible:   { fill: "rgba(16, 185, 129, 0.1)", stroke: "#10b981" },
  moyen:    { fill: "rgba(59, 130, 246, 0.1)", stroke: "#3b82f6" },
  "élevé":  { fill: "rgba(250, 204, 21, 0.1)", stroke: "#facc15" },
  critique: { fill: "rgba(239, 68, 68, 0.1)", stroke: "#ef4444" },
};

// Convert WKT coordinates to Leaflet format [lat, lng]
function wktToLeaflet(coords) {
  if (!coords || coords.length === 0) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

// Get center of polygon
function getPolygonCenter(coords) {
  if (!coords || coords.length === 0) return [30.38, -9.5]; 
  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    if (center) {
      map.flyTo(center, 10, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function HeatmapLayer({ points, show }) {
  const map = useMap();
  const heatLayerRef = useRef(null);
  
  useEffect(() => {
    import('leaflet.heat').then(() => {
      if (!show || points.length === 0) {
        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
          heatLayerRef.current = null;
        }
        return;
      }

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      heatLayerRef.current = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        max: 100,
        minOpacity: 0.4,
        gradient: {
          0.0: '#00f',
          0.2: '#0ff',
          0.4: '#0f0',
          0.6: '#ff0',
          0.8: '#ffa500',
          1.0: '#f00'
        }
      });

      heatLayerRef.current.addTo(map);
    }).catch(err => {
      console.log('Heatmap not available:', err);
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points, show]);

  return null;
}

export default function FirefighterMap() {
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState({ zones: [], sensors: [], alerts: [] });
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Reuse admin map_data endpoint for consistent zone polygons
      const [statsRes, mapDataRes] = await Promise.all([
        api.get('/dashboard/pompier/stats'),
        api.get('/admin/map_data')  // Reuse admin endpoint
      ]);

      setStats(statsRes.data);
      setMapData(mapDataRes.data);
      
    } catch (err) {
      console.error("Error fetching map data", err);
      setError("Failed to load map data. Please try again.");
      setStats({ alertesActives: 0, incendiesEnCours: 0, pompiersDisponibles: 0, zonesSurveillees: 0 });
      setMapData({ zones: [], sensors: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 text-[#B88A44] animate-spin" />
        <p className="metadata text-[14px]">Loading Operations Map...</p>
      </div>
    );
  }

  // Process zones with polygons
  const zonesWithPolygons = (mapData.zones || []).map(z => ({
    ...z,
    leafletCoords: wktToLeaflet(z.coordinates || []),
    center: z.coordinates && z.coordinates.length > 0
      ? getPolygonCenter(wktToLeaflet(z.coordinates))
      : [30.38, -9.5],
  }));

  const defaultMapCenter = zonesWithPolygons.length > 0 && zonesWithPolygons[0].leafletCoords.length > 0
    ? zonesWithPolygons[0].center
    : [30.38, -9.5];

  // Heatmap points from sensors
  const heatmapPoints = (mapData.sensors || [])
    .filter(s => s.latest_reading && s.latest_reading.temperature_c && s.latitude && s.longitude)
    .map(s => [s.latitude, s.longitude, s.latest_reading.temperature_c]);

  const statCards = [
    { label: "Active Alerts", value: stats?.alertesActives || 0, icon: AlertTriangle, colorTheme: "text-[#A64D4D]", bgTheme: "bg-[#A64D4D]/12" },
    { label: "Active Incidents", value: stats?.incendiesEnCours || 0, icon: Flame, colorTheme: "text-[#B88A44]", bgTheme: "bg-[#B88A44]/10" },
    { label: "Forest Zones", value: zonesWithPolygons.length, icon: Layers, colorTheme: "text-[#4E6B4A]", bgTheme: "bg-[#4E6B4A]/12" },
    { label: "Sensors Active", value: (mapData.sensors || []).length, icon: Cpu, colorTheme: "text-[#1F2A22]", bgTheme: "bg-[#1F2A22]/5" },
  ];

  return (
    <div className="flex flex-col gap-[28px] w-full pb-10">
      
      {/* Header — matches Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col">
           <h2 className="text-3xl font-black text-[#1F2A22]">Operations Map</h2>
           <p className="text-[#6B7468] font-bold text-[14px]">Real-time view of all active incidents, sensors, and fire zones.</p>
        </div>
        <button
          onClick={fetchMapData}
          className="flex items-center gap-2 px-4 py-2 bg-[#B88A44] hover:bg-[#A37B3D] text-white rounded-[12px] text-[12px] font-[800] uppercase tracking-widest transition-all shadow-md shadow-[#B88A44]/20 active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-[#A64D4D]/10 border border-[#A64D4D]/20 text-[#A64D4D] p-4 rounded-[16px] flex items-center justify-between font-[700]">
          <span>{error}</span>
          <button onClick={fetchMapData} className="text-[12px] underline font-[800]">Retry</button>
        </div>
      )}

      {/* Stats Cards — matches Admin stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px]">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[#F8F7F2] w-full h-[120px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.1)] transition-all duration-300 p-[24px] flex items-center justify-between group">
              <div className="flex flex-col justify-between h-full">
                <div className={`w-[38px] h-[38px] rounded-[12px] ${card.bgTheme} ${card.colorTheme} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </div>
                <p className="metadata text-[10px] mt-2">{card.label}</p>
              </div>
              <p className="text-[34px] font-[800] text-[#1F2A22] leading-none tracking-tighter">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Legend — matches Admin palette */}
      <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[24px] p-4 flex flex-wrap items-center gap-5 shadow-[0_8px_24px_rgba(31,42,33,0.06)] text-[11px] font-[700] text-[#6B7468]">
        <div className="flex items-center gap-1.5 text-[#6B7468] mr-2">
          <Info className="w-4 h-4" />
          <span className="metadata text-[10px]">Legend</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4E6B4A]"></div>
          <span>Active Sensor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#A64D4D]"></div>
          <span>Alert Location</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-emerald-200 border border-emerald-400"></div>
          <span>Low Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-yellow-200 border border-yellow-400"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-orange-200 border border-orange-400"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-md bg-rose-200 border border-rose-400"></div>
          <span>Critical</span>
        </div>

        {/* Heatmap Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[12px] font-[800] text-[11px] uppercase tracking-wider transition-all ${
              showHeatmap 
                ? "bg-[#B88A44] text-white shadow-md shadow-[#B88A44]/20" 
                : "bg-[#ECE9E1] text-[#6B7468] hover:bg-[#DCE3D6] border border-[#4F5C4A]/[0.10]"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Heatmap {showHeatmap ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] overflow-hidden shadow-[0_8px_24px_rgba(31,42,33,0.06)]" style={{ height: '500px' }}>
        <MapContainer 
          center={defaultMapCenter} 
          zoom={10} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <MapController center={defaultMapCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

          {/* Temperature Heatmap — UNTOUCHED */}
          <HeatmapLayer points={heatmapPoints} show={showHeatmap} />

          {/* Zone Polygons */}
          {zonesWithPolygons.map(z => {
            if (z.leafletCoords.length === 0) return null;
            const rc = risqueFill[z.niveau_risque_base] || risqueFill.faible;
            const hasAlert = z.alert_count > 0;
            
            return (
              <Polygon
                key={z.id_zone}
                positions={z.leafletCoords}
                pathOptions={{ 
                  fillColor: hasAlert ? "#ef4444" : rc.stroke, 
                  fillOpacity: hasAlert ? 0.4 : 0.2, 
                  color: hasAlert ? "#ef4444" : rc.stroke, 
                  weight: hasAlert ? 3 : 2 
                }}
              >
                <Popup className="rounded-xl">
                  <div className="min-w-[180px]">
                    <div className="font-[800] text-[#1F2A22] text-[16px]">{z.nom_zone}</div>
                    <div className="text-[10px] text-[#6B7468] mt-1 uppercase font-[800] tracking-wider">{z.region}</div>
                    {z.cooperative_name && (
                      <div className="text-[11px] text-[#4E6B4A] mt-1 font-[700]">
                        {z.cooperative_name}
                      </div>
                    )}
                    <div className="mt-2 text-[13px] text-[#1F2A22]">
                      <span className="font-[700]">{z.superficie_ha}</span> ha covered.
                    </div>
                    {z.alert_count > 0 && (
                      <div className="mt-2 px-3 py-1 bg-[#A64D4D]/10 text-[#A64D4D] rounded-[8px] text-[10px] font-[800] inline-block uppercase tracking-wider border border-[#A64D4D]/15">
                        {z.alert_count} Active Alert{z.alert_count > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Sensor Markers */}
          {(mapData.sensors || []).map(s => {
            if (!s.latitude || !s.longitude) return null;
            const isInactive = s.statut !== "ACTIF";
            const hasHighTemp = s.latest_reading && s.latest_reading.temperature_c > 50;
            const color = isInactive ? "#ef4444" : hasHighTemp ? "#f59e0b" : "#10b981";

            const sensorIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width: 14px; height: 14px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 ${hasHighTemp ? '15px 5px rgba(239, 68, 68, 0.6)' : '3px rgba(0,0,0,0.2)'}; ${hasHighTemp ? 'animation: pulse 2s infinite;' : ''}"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });

            return (
              <Marker key={s.id_capteur} position={[s.latitude, s.longitude]} icon={sensorIcon}>
                <Popup>
                  <div className="text-center w-36">
                    <div className="text-[10px] font-[800] uppercase text-[#6B7468] tracking-wider">Sensor</div>
                    <div className="text-[13px] font-[800] text-[#1F2A22]">{s.reference_serie}</div>
                    <div className="text-[11px] text-[#6B7468] font-[600]">{s.nom_zone}</div>
                    <div className={`mt-2 py-2 rounded-[12px] text-[18px] font-[800] ${
                      hasHighTemp ? "bg-[#B88A44]/10 text-[#B88A44]" : isInactive ? "bg-[#A64D4D]/10 text-[#A64D4D]" : "bg-[#4E6B4A]/10 text-[#4E6B4A]"
                    }`}>
                      {s.latest_reading?.temperature_c ? `${s.latest_reading.temperature_c}°C` : "N/A"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Alert Markers (for zones without polygons) */}
          {(mapData.alerts || []).map(alert => {
            if (!alert.lat || !alert.lng) return null;
            
            const isHighAlert = alert.niveau_gravite === 'CRITIQUE' || alert.niveau_gravite === 'urgence_maximale';
            const color = isHighAlert ? "#ef4444" : alert.niveau_gravite === 'ATTENTION' ? "#f59e0b" : "#3b82f6";

            const alertIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="width: 24px; height: 24px; background: linear-gradient(135deg, ${color}, ${color}dd); border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px 8px ${color}66; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            return (
              <Marker key={alert.id_alerte} position={[alert.lat, alert.lng]} icon={alertIcon}>
                <Popup>
                  <div className="text-center w-44 p-2">
                    <Flame className="w-8 h-8 text-[#A64D4D] mx-auto mb-2" />
                    <div className="text-[13px] font-[800] text-[#1F2A22]">{alert.nom_zone}</div>
                    <div className="text-[11px] text-[#6B7468] mt-1 font-[600]">{alert.message}</div>
                    <div className={`mt-2 py-1 px-3 rounded-[8px] text-[10px] font-[800] uppercase tracking-wider inline-block border ${
                      isHighAlert ? "bg-[#A64D4D]/10 text-[#A64D4D] border-[#A64D4D]/15" : "bg-[#B88A44]/10 text-[#B88A44] border-[#B88A44]/15"
                    }`}>
                      {alert.niveau_gravite === 'CRITIQUE' ? 'CRITICAL' : 
                       alert.niveau_gravite === 'ATTENTION' ? 'WARNING' : alert.niveau_gravite}
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
