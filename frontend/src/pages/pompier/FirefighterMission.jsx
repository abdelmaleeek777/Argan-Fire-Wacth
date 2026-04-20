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
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertTriangle className="w-16 h-16 text-[#6B7468]/30" />
        <p className="text-[#6B7468] font-[700] text-[14px]">No active mission</p>
        <button
          onClick={() => navigate('/pompier/alertes')}
          className="px-4 py-2 bg-[#B88A44] hover:bg-[#A37B3D] text-white rounded-[12px] font-[800] text-[12px] uppercase tracking-widest transition-all"
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
    <div className="flex flex-col gap-[28px] w-full pb-10">
      {/* Header — matches Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pompier/alertes')}
            className="w-[42px] h-[42px] bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[14px] flex items-center justify-center hover:bg-[#ECE9E1] transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-[#6B7468]" />
          </button>
          <div className="flex flex-col">
             <h2 className="text-3xl font-black text-[#1F2A22]">Active Mission</h2>
             <p className="text-[#6B7468] font-bold text-[14px]">Navigate to the incident location.</p>
          </div>
        </div>
        <button
          onClick={handleResolve}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4E6B4A] text-white rounded-[12px] hover:bg-[#3d5439] transition-all font-[800] text-[12px] uppercase tracking-widest shadow-md shadow-[#4E6B4A]/20 active:scale-95"
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Resolved
        </button>
      </div>

      {/* Mission Info Card */}
      <div className="bg-[#B88A44] rounded-[24px] p-6 text-white shadow-[0_8px_24px_rgba(184,138,68,0.2)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] bg-white/20 backdrop-blur-sm rounded-[16px] flex items-center justify-center">
              <Flame className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="text-white/60 text-[11px] font-[800] uppercase tracking-wider">Alert #{currentMission.id}</div>
              <h2 className="text-[24px] font-[800] tracking-tight">{currentMission.zone}</h2>
              <p className="text-white/80 text-[13px] font-[600] mt-0.5">{currentMission.cooperative}</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-[10px] font-[800] text-[10px] uppercase tracking-wider ${
            currentMission.severity === 'CRITIQUE' 
              ? 'bg-[#A64D4D]/40 border border-white/20'
              : 'bg-white/15 border border-white/20'
          }`}>
            {currentMission.severity === 'CRITIQUE' ? 'Critical' : 'Warning'}
          </div>
        </div>
      </div>

      {/* Location Details — matches Admin card style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[24px] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#A64D4D]/12 text-[#A64D4D] flex items-center justify-center shadow-sm">
              <MapPin className="w-[18px] h-[18px]" />
            </div>
            <span className="metadata text-[10px]">Location</span>
          </div>
          <p className="text-[18px] font-[800] text-[#1F2A22]">{currentMission.zone}</p>
          {currentMission.lat && currentMission.lng && (
            <p className="text-[12px] text-[#6B7468] font-[600] mt-1">
              {currentMission.lat.toFixed(4)}, {currentMission.lng.toFixed(4)}
            </p>
          )}
        </div>

        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[24px] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#4E6B4A]/12 text-[#4E6B4A] flex items-center justify-center shadow-sm">
              <Phone className="w-[18px] h-[18px]" />
            </div>
            <span className="metadata text-[10px]">Cooperative</span>
          </div>
          <p className="text-[18px] font-[800] text-[#1F2A22]">{currentMission.cooperative}</p>
        </div>

        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[24px] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[38px] h-[38px] rounded-[12px] bg-[#B88A44]/10 text-[#B88A44] flex items-center justify-center shadow-sm">
              <Navigation className="w-[18px] h-[18px]" />
            </div>
            <span className="metadata text-[10px]">Coordinates</span>
          </div>
          {currentMission.lat && currentMission.lng ? (
            <p className="text-[18px] font-[800] text-[#1F2A22]">
              {currentMission.lat.toFixed(4)}, {currentMission.lng.toFixed(4)}
            </p>
          ) : (
            <p className="text-[#6B7468] text-[13px] font-[600]">Coordinates not available</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] overflow-hidden shadow-[0_8px_24px_rgba(31,42,33,0.06)]" style={{ height: '450px' }}>
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
                    <div className="w-12 h-12 bg-[#A64D4D]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Flame className="w-6 h-6 text-[#A64D4D]" />
                    </div>
                    <div className="font-[800] text-[#1F2A22] text-[16px]">{currentMission.zone}</div>
                    <div className="text-[12px] text-[#6B7468] font-[600] mt-1">{currentMission.cooperative}</div>
                    <div className={`mt-3 inline-block px-3 py-1 rounded-[8px] text-[10px] font-[800] uppercase tracking-wider border ${
                      currentMission.severity === 'CRITIQUE' 
                        ? 'bg-[#A64D4D]/10 text-[#A64D4D] border-[#A64D4D]/15'
                        : 'bg-[#B88A44]/10 text-[#B88A44] border-[#B88A44]/15'
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
