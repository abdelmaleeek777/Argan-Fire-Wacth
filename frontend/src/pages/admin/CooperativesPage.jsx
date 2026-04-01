import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Building2, ChevronRight, Loader2, ShieldCheck, Inbox, Eye, User, Mail, Phone, Calendar, Layers, Trees, X } from "lucide-react";
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

const CooperativesPage = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsModal, setDetailsModal] = useState({ open: false, coop: null, zones: [], loading: false });

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/cooperatives", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCooperatives(res.data);
    } catch (err) {
      console.error("Error fetching cooperatives", err);
    } finally {
      setLoading(false);
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

  const filteredCooperatives = cooperatives.filter((coop) => {
    const matchesSearch =
      coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || coop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cooperatives.length,
    approved: cooperatives.filter(c => c.status === "approved").length,
    pending: cooperatives.filter(c => c.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            All Cooperatives
          </h1>
          <p className="text-slate-500 mt-1">
            Manage and monitor all registered cooperatives.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "all" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "approved" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "pending" ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:text-amber-600 hover:bg-amber-50/50"}`}
            >
              Pending
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-slate-900 mt-1 drop-shadow-sm">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-black text-emerald-900 mt-1 drop-shadow-sm">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-amber-900 mt-1 drop-shadow-sm">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
              <Inbox className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium">
              Loading cooperatives...
            </p>
          </div>
        ) : filteredCooperatives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cooperatives
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Sensors
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCooperatives.map((coop) => (
                  <tr
                    key={coop._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                          {coop.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {coop.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Registered on{" "}
                            {new Date(coop.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{coop.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coop.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : coop.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {coop.status ? coop.status.charAt(0).toUpperCase() + coop.status.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-700">
                        {coop.sensorCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => fetchCoopDetails(coop._id)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 space-y-5 bg-gradient-to-b from-transparent to-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-bold text-slate-800">
                No cooperatives found
              </h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                {statusFilter === "all" 
                  ? "We couldn't find any cooperatives matching your search criteria. Please adjust your filters." 
                  : `There are currently no ${statusFilter} cooperatives matching your search.`}
              </p>
              <button 
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                className="mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

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
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-2xl p-5 border border-emerald-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                      <Trees className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800">{detailsModal.coop.name}</h3>
                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">{detailsModal.coop.region}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                      detailsModal.coop.status === "approved" 
                        ? "bg-emerald-100 border border-emerald-200 text-emerald-700"
                        : detailsModal.coop.status === "pending"
                          ? "bg-amber-100 border border-amber-200 text-amber-700"
                          : "bg-rose-100 border border-rose-200 text-rose-700"
                    }`}>
                      {detailsModal.coop.status || "Unknown"}
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
    </div>
  );
};

export default CooperativesPage;
