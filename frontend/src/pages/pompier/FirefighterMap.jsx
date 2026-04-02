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
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Operations Map...</p>
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
    { label: "Active Alerts", value: stats?.alertesActives || 0, icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-500", valText: "text-rose-700" },
    { label: "Active Incidents", value: stats?.incendiesEnCours || 0, icon: Flame, bg: "bg-orange-50", text: "text-orange-500", valText: "text-orange-700" },
    { label: "Forest Zones", value: zonesWithPolygons.length, icon: Layers, bg: "bg-amber-50", text: "text-amber-500", valText: "text-amber-700" },
    { label: "Sensors Active", value: (mapData.sensors || []).length, icon: Cpu, bg: "bg-emerald-50", text: "text-emerald-500", valText: "text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operations Map</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time view of all active incidents, sensors, and fire zones.
          </p>
        </div>
        <button
          onClick={fetchMapData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center justify-between">
          <span className="font-medium">{error}</span>
          <button onClick={fetchMapData} className="text-sm underline">Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden relative shadow-sm" style={{ height: '500px' }}>
        <MapContainer 
          center={defaultMapCenter} 
          zoom={10} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <MapController center={defaultMapCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

          {/* Temperature Heatmap */}
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
                    {z.alert_count > 0 && (
                      <div className="mt-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold inline-block">
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
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sensor</div>
                    <div className="text-sm font-bold text-slate-800">{s.reference_serie}</div>
                    <div className="text-xs text-slate-500">{s.nom_zone}</div>
                    <div className={`mt-2 py-2 rounded-xl text-lg font-black ${
                      hasHighTemp ? "bg-orange-50 text-orange-600" : isInactive ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
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
                    <Flame className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-slate-800">{alert.nom_zone}</div>
                    <div className="text-xs text-slate-500 mt-1">{alert.message}</div>
                    <div className={`mt-2 py-1 px-3 rounded-lg text-xs font-bold inline-block ${
                      isHighAlert ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
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
