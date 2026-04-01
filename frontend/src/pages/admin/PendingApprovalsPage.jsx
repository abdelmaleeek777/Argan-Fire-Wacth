import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Calendar,
  MapPin,
  Search,
  Loader2,
  Inbox,
  Eye,
  Phone,
  Layers,
  Trees,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to convert [lng, lat] to [lat, lng] for Leaflet
function wktToLeaflet(coords) {
  if (!coords || coords.length === 0) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

// Helper to get center of polygon
function getPolygonCenter(coords) {
  if (!coords || coords.length === 0) return [30.38, -8.96];
  const leafletCoords = wktToLeaflet(coords);
  const lats = leafletCoords.map(c => c[0]);
  const lngs = leafletCoords.map(c => c[1]);
  return [
    lats.reduce((a, b) => a + b, 0) / lats.length,
    lngs.reduce((a, b) => a + b, 0) / lngs.length,
  ];
}

// Component to fit map bounds to polygon
function MapFitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const leafletCoords = wktToLeaflet(coords);
      const bounds = L.latLngBounds(leafletCoords);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
}

const PendingApprovalsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({ open: false, coop: null, zones: [], loading: false });
  const [actionPopup, setActionPopup] = useState({ open: false, type: "", coopName: "" });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "/api/admin/cooperatives/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPending(res.data);
    } catch (err) {
      console.error("Error fetching pending approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, coopName) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/cooperatives/${id}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Remove card from list
      setPending((prev) => prev.filter((item) => item._id !== id));
      // Show success popup
      setActionPopup({ open: true, type: action, coopName });
      // Auto close popup after 3 seconds
      setTimeout(() => setActionPopup({ open: false, type: "", coopName: "" }), 3000);
    } catch (err) {
      alert(`Error trying to ${action} cooperative`);
      console.error(err);
    }
  };

  const fetchCoopDetails = async (coopId) => {
    setDetailsModal({ open: true, coop: null, zones: [], loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/cooperatives/${coopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailsModal({
        open: true,
        coop: res.data.cooperative,
        zones: res.data.zones || [],
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching coop details", err);
      setDetailsModal({ open: false, coop: null, zones: [], loading: false });
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({ open: false, coop: null, zones: [], loading: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 mt-1">
          Review and approve new cooperative registrations.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">
            Fetching pending requests...
          </p>
        </div>
      ) : pending.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pending.map((coop) => (
            <div
              key={coop._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              <div className="relative flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-amber-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 z-10">
                    <Inbox className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="z-10">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-amber-700 transition-colors">
                      {coop.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium">{coop.region}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm z-10">
                  Pending
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 p-5 bg-gradient-to-br from-slate-50 to-white flex-1 border border-slate-100 rounded-2xl relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">{coop.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium break-all">{coop.ownerEmail}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium">
                      Reg: {new Date(coop.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 relative z-10">
                <button
                  onClick={() => fetchCoopDetails(coop._id)}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm active:scale-95 hover:-translate-y-0.5"
                >
                  <Eye className="w-5 h-5" />
                  View Details
                </button>
                <button
                  onClick={() => handleAction(coop._id, "approve", coop.name)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(coop._id, "reject", coop.name)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold rounded-xl transition-all shadow-sm active:scale-95 hover:-translate-y-0.5"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2">
              There are no pending registrations waiting for approval at this
              time.
            </p>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-800">Cooperative Details</h2>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {detailsModal.loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading details...</p>
              </div>
            ) : detailsModal.coop ? (
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-2xl p-5 border border-amber-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-100">
                      <Trees className="w-7 h-7 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800">{detailsModal.coop.name}</h3>
                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">{detailsModal.coop.region}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-full uppercase">
                      {detailsModal.coop.status || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Owner</p>
                        <p className="text-sm font-bold text-slate-700">{detailsModal.coop.ownerName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Mail className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Email</p>
                        <p className="text-sm font-bold text-slate-700 break-all">{detailsModal.coop.ownerEmail}</p>
                      </div>
                    </div>
                  </div>
                  {detailsModal.coop.phone && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Phone className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Phone</p>
                          <p className="text-sm font-bold text-slate-700">{detailsModal.coop.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {detailsModal.coop.address && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <MapPin className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Address</p>
                          <p className="text-sm font-bold text-slate-700">{detailsModal.coop.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Registration Date</p>
                        <p className="text-sm font-bold text-slate-700">
                          {detailsModal.coop.createdAt ? new Date(detailsModal.coop.createdAt).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {detailsModal.coop.zone_name && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Layers className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold">Zone Name</p>
                          <p className="text-sm font-bold text-slate-700">{detailsModal.coop.zone_name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Zones Section */}
                {detailsModal.zones.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Forest Zones ({detailsModal.zones.length})
                    </h4>
                    
                    {/* Map showing all zones */}
                    <div className="rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
                      <MapContainer
                        center={getPolygonCenter(detailsModal.zones[0]?.coordinates || [])}
                        zoom={12}
                        style={{ height: "280px", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {detailsModal.zones.map((zone) => (
                          zone.coordinates && zone.coordinates.length > 0 && (
                            <Polygon
                              key={zone._id}
                              positions={wktToLeaflet(zone.coordinates)}
                              pathOptions={{
                                color: "#10b981",
                                fillColor: "#10b981",
                                fillOpacity: 0.2,
                                weight: 2,
                              }}
                            />
                          )
                        ))}
                        {detailsModal.zones[0]?.coordinates && (
                          <MapFitBounds coords={detailsModal.zones[0].coordinates} />
                        )}
                      </MapContainer>
                    </div>

                    <div className="space-y-2">
                      {detailsModal.zones.map((zone) => (
                        <div
                          key={zone._id}
                          className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <Trees className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700">{zone.name}</p>
                              {zone.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{zone.description}</p>
                              )}
                            </div>
                          </div>
                          {zone.superficie_ha && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                              {zone.superficie_ha} ha
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailsModal.zones.length === 0 && (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No forest zones assigned yet</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Action Success Popup */}
      {actionPopup.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-200">
            {actionPopup.type === "approve" ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Approved Successfully!</h3>
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">{actionPopup.coopName}</span> has been approved and can now access the platform.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Rejected</h3>
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">{actionPopup.coopName}</span> has been rejected.
                </p>
              </>
            )}
            <button
              onClick={() => setActionPopup({ open: false, type: "", coopName: "" })}
              className="mt-6 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;
