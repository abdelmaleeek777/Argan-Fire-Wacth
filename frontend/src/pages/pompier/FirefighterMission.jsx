import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  ArrowLeft, Flame, MapPin, Phone, CheckCircle, Navigation, AlertTriangle 
} from "lucide-react";
import { usePompierState } from "../../hooks/usePompierState";
import IncidentReportModal from "../../components/pompier/IncidentReportModal";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    if (center) {
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function FirefighterMission() {
  const navigate = useNavigate();
  const { currentMission, completeMission } = usePompierState();
  const [showIncidentForm, setShowIncidentForm] = React.useState(false);

  // Redirect if no active mission
  useEffect(() => {
    if (!currentMission) {
      navigate('/pompier/alertes');
    }
  }, [currentMission, navigate]);

  if (!currentMission) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="w-16 h-16 text-slate-300" />
        <p className="text-slate-500 font-medium">No active mission</p>
        <button
          onClick={() => navigate('/pompier/alertes')}
          className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold"
        >
          Go to Alerts
        </button>
      </div>
    );
  }

  const missionCenter = currentMission.lat && currentMission.lng 
    ? [currentMission.lat, currentMission.lng]
    : [30.38, -9.5]; // Default to Souss-Massa region

  const handleResolve = () => {
    setShowIncidentForm(true);
  };

  const handleIncidentSuccess = () => {
    completeMission();
    setShowIncidentForm(false);
    navigate('/pompier/alertes');
  };

  // Create a custom fire icon
  const fireIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ef4444, #f97316); border: 4px solid white; border-radius: 50%; box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.5); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pompier/alertes')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Active Mission</h1>
            <p className="text-slate-500 text-sm">Navigate to the incident location</p>
          </div>
        </div>
        <button
          onClick={handleResolve}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-200"
        >
          <CheckCircle className="w-5 h-5" />
          Mark as Resolved
        </button>
      </div>

      {/* Mission Info Card */}
      <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Flame className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-white/70 text-sm font-medium">Alert #{currentMission.id}</div>
              <h2 className="text-2xl font-black">{currentMission.zone}</h2>
              <p className="text-white/80 mt-1">{currentMission.cooperative}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
            currentMission.severity === 'CRITIQUE' 
              ? 'bg-rose-700/50 border border-rose-400/30'
              : 'bg-amber-500/50 border border-amber-400/30'
          }`}>
            {currentMission.severity === 'CRITIQUE' ? 'Critical' : 'Warning'}
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 rounded-xl">
              <MapPin className="w-5 h-5 text-rose-500" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Location</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{currentMission.zone}</p>
          {currentMission.lat && currentMission.lng && (
            <p className="text-sm text-slate-500 mt-1">
              {currentMission.lat.toFixed(4)}, {currentMission.lng.toFixed(4)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Cooperative</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{currentMission.cooperative}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Navigation className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase">Coordinates</span>
          </div>
          {currentMission.lat && currentMission.lng ? (
            <p className="text-lg font-bold text-slate-800">
              {currentMission.lat.toFixed(4)}, {currentMission.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-slate-500 text-sm">Coordinates not available</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ height: '450px' }}>
        <MapContainer 
          center={missionCenter} 
          zoom={14} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <MapController center={missionCenter} />
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap' 
          />
          
          {/* Incident marker */}
          {currentMission.lat && currentMission.lng && (
            <>
              {/* Danger zone circle */}
              <Circle
                center={missionCenter}
                radius={500}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
              
              {/* Fire marker */}
              <Marker position={missionCenter} icon={fireIcon}>
                <Popup>
                  <div className="text-center p-2 min-w-[200px]">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Flame className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="font-bold text-slate-800 text-lg">{currentMission.zone}</div>
                    <div className="text-sm text-slate-500 mt-1">{currentMission.cooperative}</div>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                      currentMission.severity === 'CRITIQUE' 
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {currentMission.severity === 'CRITIQUE' ? 'CRITICAL' : 'WARNING'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={showIncidentForm}
        onClose={() => setShowIncidentForm(false)}
        onSuccess={handleIncidentSuccess}
        alert={currentMission}
      />

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.5); }
          50% { transform: scale(1.1); box-shadow: 0 0 30px 12px rgba(239, 68, 68, 0.7); }
        }
      `}</style>
    </div>
  );
}
