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

const ZoneCard = ({ zone, onOpenMap, onDelete }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col">
    <div className="h-32 bg-emerald-50 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <MapIcon className="w-12 h-12 text-emerald-200 transition-transform group-hover:scale-110" />
      <div className="absolute top-3 right-3">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          zone.indice_risque > 7 ? "bg-rose-100 text-rose-600" :
          zone.indice_risque > 4 ? "bg-orange-100 text-orange-600" :
          "bg-emerald-100 text-emerald-600"
        }`}>
          Risque: {zone.indice_risque}
        </span>
      </div>
    </div>
    <div className="p-5 flex-1">
      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{zone.nom_zone}</h3>
      <div className="flex items-center gap-2 text-slate-500 text-xs mt-1 font-medium">
        <Navigation className="w-3 h-3" /> {zone.region}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <p className="text-[10px] font-black text-slate-400 border-b border-slate-200 pb-1 mb-1">SURFACE</p>
          <p className="text-sm font-black text-slate-700">{zone.superficie_ha} ha</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl">
          <p className="text-[10px] font-black text-slate-400 border-b border-slate-200 pb-1 mb-1">SENSORS</p>
          <p className="text-sm font-black text-slate-700">{zone.sensor_count} unités</p>
        </div>
      </div>
    </div>
    <div className="p-3 bg-slate-50/50 border-t border-slate-100 mt-auto flex gap-2">
      <button
        onClick={() => onOpenMap(zone)}
        className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2"
      >
        <Maximize2 className="w-3.5 h-3.5" /> View
      </button>
      <button
        onClick={() => onDelete(zone.id_zone)}
        className="px-3 py-2 bg-white border border-slate-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export default function MesZones() {
  const [zones, setZones] = useState([]);
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
      const res = await axios.get(`${API_BASE}/cooperative/${coopId}/zones`);
      setZones(res.data);
    } catch (err) {
      console.error("Error fetching zones", err);
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
      await axios.post(`${API_BASE}/cooperative/${coopId}/zones`, {
        name: newZoneName,
        polygon: drawnPolygon
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
      await axios.delete(`${API_BASE}/cooperative/${coopId}/zones/${zoneId}`);
      alert("Zone supprimée avec succès");
      fetchZones();
    } catch (err) {
      console.error("Error deleting zone", err);
      const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la suppression de la zone.";
      alert(`Erreur: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">My Zones</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your plots and monitor sensor deployment.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Zone
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : zones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map(z => (
            <ZoneCard key={z.id_zone} zone={z} onOpenMap={() => {}} onDelete={handleDeleteZone} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MapIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-800">No zones registered</h2>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Start by delimiting your first forest zone on the map to activate thermal monitoring.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create your first zone
          </button>
        </div>
      )}

      {/* Drawing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"></div>

          <div className="relative bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col slide-in-from-bottom-5 animate-in duration-500">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-800">Define a new zone</h3>
                <p className="text-xs text-slate-500 font-medium">Draw the outline on the map to automate sensor placement.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Left Panel: Form */}
              <div className="w-full md:w-80 border-r border-slate-100 p-8 flex flex-col space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Zone Name</label>
                  <input
                    type="text"
                    placeholder="Ex: North Argan Plot"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-700"
                  />
                </div>

                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">Estimated Stats</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-800 font-medium italic">Area:</span>
                      <span className="text-sm font-black text-emerald-700">{calculatedArea} hectares</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-emerald-800 font-medium italic">Auto-sensors:</span>
                      <span className="text-sm font-black text-emerald-700">4 Units</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 italic">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                      Note: The system will automatically place 4 telemetry sensors at the corners of your polygon for optimal coverage.
                    </p>
                  </div>

                  <button
                    onClick={handleCreateZone}
                    disabled={saving || !newZoneName || !drawnPolygon}
                    className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                      saving || !newZoneName || !drawnPolygon
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 active:scale-95"
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Création...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Terminé !
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
                          drawError: { color: "#e1e1e1", message: "Intersections interdites" },
                          shapeOptions: { color: "#10b981", fillOpacity: 0.2 }
                        }
                      }}
                    />
                  </FeatureGroup>
                </MapContainer>

                {success && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 scale-in-center animate-in duration-500">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Zone created successfully!</h2>
                    <p className="text-slate-500 font-medium mt-2">4 sensors have been automatically configured.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
