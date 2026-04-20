import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Map as MapIcon, Plus, Maximize2, Trash2, Loader2,
  CheckCircle2, AlertCircle, X, Navigation, Layers
} from "lucide-react";
import {
  MapContainer, TileLayer, Polygon, FeatureGroup, Popup
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const API_BASE = "/api";

const ZoneCard = ({ zone, onOpenMap, onDelete }) => {
  // Determine risk level coloring
  const getRiskStyles = (riskLevel) => {
    if (riskLevel > 7) return { primary: "#B55A3C", secondary: "rgba(181, 90, 60, 0.15)", label: "CRITICAL" };
    if (riskLevel > 4) return { primary: "#B88A44", secondary: "rgba(184, 138, 68, 0.15)", label: "ELEVATED" };
    return { primary: "#4E6B4A", secondary: "rgba(78, 107, 74, 0.15)", label: "NOMINAL" };
  };

  const risk = getRiskStyles(zone.indice_risque);

  return (
    <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_20px_rgba(31,42,33,0.03)] hover:shadow-[0_8px_32px_rgba(31,42,33,0.08)] transition-all group relative overflow-hidden flex flex-col p-6">
      
      {/* Decorative Blob */}
      <div 
        className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-[40px] opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-700" 
        style={{ backgroundColor: risk.primary }} 
      />

      {/* Top Meta Row */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-1.5 text-[#6B7468]">
          <Navigation className="w-3.5 h-3.5" />
          <span className="text-[11px] font-[800] uppercase tracking-widest">{zone.region || 'Unknown Region'}</span>
        </div>
        <div 
          className="px-3 py-1.5 rounded-[12px] flex items-center gap-1.5 border"
          style={{ backgroundColor: risk.secondary, color: risk.primary, borderColor: `${risk.primary}30` }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: risk.primary }} />
          <span className="text-[10px] font-[900] tracking-widest uppercase">RISK LEVEL {zone.indice_risque}</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="mb-8 relative z-10">
        <h3 className="text-[32px] font-[800] text-[#1F2A22] leading-tight tracking-tight group-hover:text-[#2F4A36] transition-colors">{zone.nom_zone}</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className="bg-[#ECE9E1]/60 p-4 rounded-[20px] border border-[#4F5C4A]/5 flex flex-col justify-center">
          <p className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-1">SURFACE AREA</p>
          <p className="text-[20px] font-[800] text-[#1F2A22] leading-none">{zone.superficie_ha} <span className="text-[12px] text-[#2F4A36] opacity-70">HA</span></p>
        </div>
        <div className="bg-[#ECE9E1]/60 p-4 rounded-[20px] border border-[#4F5C4A]/5 flex flex-col justify-center">
          <p className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-1">SENSORS</p>
          <p className="text-[20px] font-[800] text-[#1F2A22] leading-none">{zone.sensor_count} <span className="text-[12px] text-[#2F4A36] opacity-70">UNITS</span></p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto relative z-10">
        <button
          onClick={() => onOpenMap(zone)}
          className="flex-1 py-3 bg-[#4E6B4A] text-white rounded-[16px] text-[12px] font-[800] hover:bg-[#2F4A36] transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(78,107,74,0.2)]"
        >
          <Maximize2 className="w-4 h-4" /> Expand View
        </button>
        <button
          onClick={() => onDelete(zone.id_zone)}
          className="w-12 py-3 bg-[#F8F7F2] border border-[#4F5C4A]/10 text-rose-600 rounded-[16px] flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function MesZones() {
  const [zones, setZones] = useState([]);
  const [viewZone, setViewZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [calculatedArea, setCalculatedArea] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mapCenter, setMapCenter] = useState([30.38, -8.96]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) fetchZones();
  }, [coopId]);

  useEffect(() => {
    // When modal opens and there are already zones, center map on first zone
    if (isModalOpen && zones.length > 0) {
      const zone = zones[0];
      const lat = parseFloat(zone.center_lat);
      const lng = parseFloat(zone.center_lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    } else if (isModalOpen && zones.length === 0) {
      // Reset to default center if no zones exist
      setMapCenter([30.38, -8.96]);
    }
  }, [isModalOpen, zones]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/cooperative/${coopId}/zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setZones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching zones", err);
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const onCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const latlngs = layer.getLatLngs()[0];
      const coords = latlngs.map(ll => [ll.lng, ll.lat]);
      setDrawnPolygon(coords);

      const area = L.GeometryUtil.geodesicArea(latlngs) / 10000;
      setCalculatedArea(area.toFixed(2));
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName || !drawnPolygon || saving) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/cooperative/${coopId}/zones`, {
        name: newZoneName,
        polygon: drawnPolygon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setNewZoneName("");
        setDrawnPolygon(null);
        setCalculatedArea(0);
        fetchZones();
      }, 2000);

    } catch (err) {
      console.error("Error creating zone", err);
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la création de la zone.";
      alert(`Erreur: ${errorMessage}`);
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette zone ? Cette action est irréversible.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/cooperative/${coopId}/zones/${zoneId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Zone supprimée avec succès");
      fetchZones();
    } catch (err) {
      console.error("Error deleting zone", err);
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la suppression de la zone.";
      alert(`Erreur: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header Inline action row (Title handled by Layout) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-[800] text-[#1F2A22] tracking-tight">Active Territories</h2>
          <p className="text-[13px] text-[#6B7468] font-[700] mt-1">Manage and monitor your cooperative's Argan land zones.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-[#4E6B4A] hover:bg-[#2F4A36] text-white rounded-[16px] font-[800] text-[13px] shadow-[0_4px_12px_rgba(78,107,74,0.2)] flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Zone
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] animate-pulse"></div>
          ))}
        </div>
      ) : zones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map(z => (
            <ZoneCard key={z.id_zone} zone={z} onOpenMap={(zone) => setViewZone(zone)} onDelete={handleDeleteZone} />
          ))}
        </div>
      ) : (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_32px_rgba(31,42,33,0.04)] p-12 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-[#DCE3D6] rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <MapIcon className="w-10 h-10 text-[#4E6B4A]" />
          </div>
          <h2 className="text-[20px] font-[800] text-[#1F2A22]">No zones registered</h2>
          <p className="text-[#6B7468] font-bold mt-2 max-w-sm mx-auto">
            Start by delimiting your first forest zone on the map to activate thermal monitoring.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-8 px-8 py-3 bg-[#4E6B4A] text-white rounded-[16px] font-[800] text-[13px] hover:bg-[#2F4A36] transition-all shadow-[0_4px_12px_rgba(78,107,74,0.2)] inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create your first zone
          </button>
        </div>
      )}

      {/* Drawing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-[#1F2A22]/40 backdrop-blur-md animate-in fade-in duration-300"></div>

          <div className="relative bg-[#FAF8F4] w-full max-w-5xl h-full max-h-[85vh] rounded-[32px] shadow-[0_16px_40px_rgba(31,42,33,0.1)] border border-[#4F5C4A]/[0.10] overflow-hidden flex flex-col slide-in-from-bottom-5 animate-in duration-500">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#4F5C4A]/[0.08] flex items-center justify-between bg-[#ECE9E1]/50 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCE3D6] rounded-[12px] flex items-center justify-center text-[#4E6B4A]">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-[800] text-[#1F2A22] leading-none mb-1">Define New Territory</h3>
                  <p className="text-[12px] text-[#6B7468] font-[700]">Draw the outline on the map to automate sensor placement.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-[#FAF8F4] hover:bg-[#DCE3D6] text-[#6B7468] hover:text-[#1F2A22] rounded-[12px] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Left Panel: Form */}
              <div className="w-full md:w-80 border-r border-[#4F5C4A]/[0.08] bg-[#F8F7F2] p-8 flex flex-col space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2 ml-1">Zone Name</label>
                  <input
                    type="text"
                    placeholder="Ex: North Argan Plot"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF8F4] border border-[#4F5C4A]/[0.10] rounded-[16px] text-[13px] font-[700] text-[#1F2A22] focus:outline-none focus:ring-2 focus:ring-[#4E6B4A]/30 focus:border-[#4E6B4A] transition-all"
                  />
                </div>

                <div className="p-5 bg-[#4E6B4A]/[0.05] rounded-[20px] border border-[#4E6B4A]/10">
                  <p className="text-[10px] font-[800] text-[#4E6B4A] uppercase tracking-wider mb-3">Estimated Stats</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-[#4E6B4A] font-[700]">Area:</span>
                      <span className="text-[14px] font-[900] text-[#2F4A36]">{calculatedArea} <span className="text-[10px]">HA</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-[#4E6B4A] font-[700]">Auto-sensors:</span>
                      <span className="text-[14px] font-[900] text-[#2F4A36]">4 <span className="text-[10px]">UNITS</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-[#B88A44]/10 rounded-[20px] border border-[#B88A44]/20">
                    <AlertCircle className="w-4 h-4 text-[#B88A44] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#B88A44]/90 leading-relaxed font-[700]">
                      System automatically deploys 4 telemetry sensors at plot corners for optimal spatial coverage.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateZone}
                    disabled={saving || !newZoneName || !drawnPolygon}
                    className={`w-full py-4 rounded-[16px] font-[800] text-[13px] transition-all flex items-center justify-center gap-2 ${
                      saving || !newZoneName || !drawnPolygon
                      ? "bg-[#DCE3D6]/50 text-[#6B7468] cursor-not-allowed border border-[#4F5C4A]/10"
                      : "bg-[#4E6B4A] text-white hover:bg-[#2F4A36] shadow-[0_4px_12px_rgba(78,107,74,0.2)]"
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </>
                    ) : (
                      "Validate & Deploy"
                    )}
                  </button>
                </div>
              </div>

              {/* Right Panel: Map */}
              <div className="flex-1 bg-slate-50 relative">
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  className="w-full h-full z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  {/* Display existing zones */}
                  {zones.map((zone) => {
                    try {
                      const geojson = typeof zone.geojson === 'string' ? JSON.parse(zone.geojson) : zone.geojson;
                      if (!geojson || !geojson.coordinates) return null;

                      const coords = geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
                      return (
                        <Polygon
                          key={zone.id_zone}
                          positions={coords}
                          color="#3b82f6"
                          fillColor="#3b82f6"
                          fillOpacity={0.15}
                          weight={2}
                        >
                          <Popup>
                            <div className="text-xs font-bold">{zone.nom_zone}</div>
                            <div className="text-[10px] text-slate-600">{zone.superficie_ha} ha</div>
                          </Popup>
                        </Polygon>
                      );
                    } catch (err) {
                      console.error("Error rendering zone polygon:", err);
                      return null;
                    }
                  })}

                  <FeatureGroup>
                    <EditControl
                      position="topleft"
                      onCreated={onCreated}
                      draw={{
                        rectangle: false,
                        circle: false,
                        polyline: false,
                        circlemarker: false,
                        marker: false,
                        polygon: {
                          allowIntersection: false,
                          drawError: { color: "#B55A3C", message: "Intersections interdit" },
                          shapeOptions: { color: "#4E6B4A", fillOpacity: 0.2 }
                        }
                      }}
                    />
                  </FeatureGroup>
                </MapContainer>

                {success && (
                  <div className="absolute inset-0 bg-[#ECE9E1]/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-[#4E6B4A] shadow-[0_8px_32px_rgba(78,107,74,0.3)] rounded-[24px] flex items-center justify-center mb-6 scale-in-center animate-in duration-500">
                      <CheckCircle2 className="w-10 h-10 text-[#F8F7F2]" />
                    </div>
                    <h2 className="text-[24px] font-[800] text-[#1F2A22]">Zone created successfully!</h2>
                    <p className="text-[#6B7468] font-[700] mt-2">4 sensors have been automatically configured.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* View Zone Modal */}
      {viewZone && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-[#1F2A22]/40 backdrop-blur-md animate-in fade-in duration-300"></div>

          <div className="relative bg-[#FAF8F4] w-full max-w-4xl h-[70vh] rounded-[32px] shadow-[0_16px_40px_rgba(31,42,33,0.1)] border border-[#4F5C4A]/[0.10] overflow-hidden flex flex-col slide-in-from-bottom-5 animate-in duration-500">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#4F5C4A]/[0.08] flex items-center justify-between bg-[#ECE9E1]/50 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCE3D6] rounded-[12px] flex items-center justify-center text-[#4E6B4A]">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-[800] text-[#1F2A22] leading-none mb-1">{viewZone.nom_zone} Location</h3>
                  <p className="text-[12px] text-[#6B7468] font-[700]">Viewing plot coordinates and boundaries.</p>
                </div>
              </div>
              <button
                onClick={() => setViewZone(null)}
                className="p-2.5 bg-[#FAF8F4] hover:bg-[#DCE3D6] text-[#6B7468] hover:text-[#1F2A22] rounded-[12px] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#F8F7F2] relative">
                <MapContainer
                  center={[parseFloat(viewZone.center_lat) || 30.38, parseFloat(viewZone.center_lng) || -8.96]}
                  zoom={14}
                  className="w-full h-full z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {zones.map((zone) => {
                    try {
                      const geojson = typeof zone.geojson === 'string' ? JSON.parse(zone.geojson) : zone.geojson;
                      if (!geojson || !geojson.coordinates) return null;

                      const coords = geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
                      const isSelected = zone.id_zone === viewZone.id_zone;

                      return (
                        <Polygon
                          key={zone.id_zone}
                          positions={coords}
                          color={isSelected ? "#4E6B4A" : "#B88A44"}
                          fillColor={isSelected ? "#4E6B4A" : "#B88A44"}
                          fillOpacity={isSelected ? 0.4 : 0.1}
                          weight={isSelected ? 3 : 2}
                          dashArray={isSelected ? "" : "5, 5"}
                        >
                          <Popup>
                            <div className="text-[13px] font-[800] text-[#1F2A22]">{zone.nom_zone} {isSelected && <span className="text-[#4E6B4A]">(Selected)</span>}</div>
                            <div className="text-[11px] font-[700] text-[#6B7468] mt-1 uppercase tracking-widest">{zone.superficie_ha} HA</div>
                          </Popup>
                        </Polygon>
                      );
                    } catch (err) {
                      return null;
                    }
                  })}
                </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
