import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
import axios from "axios";
import {
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Layers,
  Cpu,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar,
  XCircle,
  Ban
} from "lucide-react";

const CooperativeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/admin/cooperatives/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setData(res.data);
    } catch (err) {
      console.error("Error fetching detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      const token = localStorage.getItem("token");
      let isConfirm = window.confirm(`Are you sure you want to ${action} this cooperative?`);
      if(!isConfirm) return;
      await axios.patch(
        `/api/admin/cooperatives/${id}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDetail();
    } catch (err) {
      alert(`Error trying to ${action} cooperative`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold">Loading cooperative data...</p>
      </div>
    );
  }

  if (!data) return <div>Cooperative not found</div>;

  const { cooperative, zones, sensors } = data;

  // Component for Map Auto-Fit/Center
  const MapRefocus = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
      if (coords && coords.length > 0) {
        // Find bounds considering Leaflet wants [lat, lng] instead of GeoJSON's [lng, lat]
        const bounds = L.latLngBounds(coords.map((c) => [c[1], c[0]]));
        map.fitBounds(bounds);
      }
    }, [coords, map]);
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-[32px] pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#6B7468] hover:text-[#4E6B4A] transition-colors group mb-2"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="metadata text-[14px]">Back to Cooperatives</span>
      </button>

      {/* Header Info */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-10 shadow-[0_8px_24px_rgba(31,42,33,0.06)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#DCE3D6] rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-30 -z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex gap-8">
            <div className="w-24 h-24 bg-[#4E6B4A] rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-[#4E6B4A]/20 border border-[#DCE3D6]/20">
              <Building2 className="w-12 h-12" />
            </div>
            <div>
              <h1 className="card-title text-[#1F2A22]">
                {cooperative.name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 mt-3 text-[#6B7468] font-bold">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B88A44]" />
                  <span className="text-[14px]">{cooperative.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4E6B4A]" />
                  <span className="text-[14px]">Joined {new Date(cooperative.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <span
              className={`badge px-5 py-2 rounded-full text-[11px] border shadow-sm ${
                cooperative.status === "approved"
                  ? "bg-[#4E6B4A] text-white border-[#4E6B4A]"
                  : cooperative.status === "pending"
                    ? "bg-[#B88A44] text-white border-[#B88A44]"
                    : "bg-rose-600 text-white border-rose-600"
              }`}
            >
              {cooperative.status}
            </span>
            <div className="flex items-center gap-3 mt-2 bg-[#DCE3D6]/40 backdrop-blur-md p-1.5 rounded-[16px] border border-[#4F5C4A]/[0.08] shadow-sm">
              {cooperative.status === "pending" && (
                <>
                  <button onClick={() => handleAction("approve")} className="flex items-center gap-2 px-4 py-2 text-[12px] font-[800] text-white bg-[#4E6B4A] hover:bg-[#2F4A36] rounded-[10px] transition-all shadow-sm active:scale-95">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction("reject")} className="flex items-center gap-2 px-4 py-2 text-[12px] font-[800] text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-[10px] transition-all border border-rose-100 shadow-sm active:scale-95">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
              {cooperative.status === "approved" && (
                <button onClick={() => handleAction("suspend")} className="flex items-center gap-2 px-4 py-2 text-[12px] font-[800] text-[#1F2A22] bg-[#F8F7F2] hover:bg-[#DCE3D6] rounded-[10px] transition-all border border-[#4F5C4A]/[0.10] shadow-sm active:scale-95">
                  <Ban className="w-4 h-4" /> Suspend Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col - Details */}
        <div className="lg:col-span-1 space-y-8">
          {/* Owner Details */}
          <section className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-8 shadow-sm">
            <h3 className="section-title text-[#1F2A22] mb-6 flex items-center gap-3">
              <User className="w-5 h-5 text-[#4E6B4A]" />
              Owner Information
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-[#DCE3D6]/30 rounded-[24px] border border-[#4F5C4A]/[0.05]">
                <p className="metadata text-[10px] text-[#6B7468] mb-1.5">
                  Full Name
                </p>
                <p className="text-[#1F2A22] font-[700] text-[15px]">
                  {cooperative.ownerName}
                </p>
              </div>
              <div className="p-5 bg-[#DCE3D6]/30 rounded-[24px] border border-[#4F5C4A]/[0.05]">
                <p className="metadata text-[10px] text-[#6B7468] mb-1.5">
                  Email Address
                </p>
                <p className="text-[#1F2A22] font-[700] text-[15px] break-all">
                  {cooperative.ownerEmail}
                </p>
              </div>
              <div className="p-5 bg-[#DCE3D6]/30 rounded-[24px] border border-[#4F5C4A]/[0.05]">
                <p className="metadata text-[10px] text-[#6B7468] mb-1.5">
                  Phone Number
                </p>
                <p className="text-[#1F2A22] font-[700] text-[15px]">
                  {cooperative.phone || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Location details */}
          <section className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-8 shadow-sm">
            <h3 className="section-title text-[#1F2A22] mb-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#B88A44]" />
              Location Info
            </h3>
            <p className="text-[#6B7468] text-[14px] leading-relaxed font-bold">
              {cooperative.address ||
                "No specific address provided for this cooperative."}
            </p>
          </section>
        </div>

        {/* Right Col - Zones and Sensors */}
        <div className="lg:col-span-2 space-y-8">
          {/* Zones Summary */}
          <section className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-8 shadow-sm">
            <h3 className="section-title text-[#1F2A22] mb-8 flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#4E6B4A]" />
              Protection Zones ({zones.length})
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <div
                    key={zone._id}
                    className="p-6 border border-[#4F5C4A]/[0.08] rounded-[24px] bg-[#DCE3D6]/20 relative group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-[800] text-[18px] text-[#1F2A22] tracking-tight">{zone.name}</p>
                        <p className="metadata text-[11px] text-[#6B7468] mt-0.5">
                          {zone.description || "Fire monitoring argan forest zone"}
                        </p>
                      </div>
                      <div className="px-4 py-1.5 bg-[#4E6B4A]/10 text-[#4E6B4A] rounded-full text-[12px] font-[800] border border-[#4E6B4A]/10">
                        Active Monitoring
                      </div>
                    </div>

                    {/* Zone Boundary Map */}
                    {zone.geojson && zone.geojson.coordinates && (
                      <div className="h-[320px] w-full rounded-[20px] overflow-hidden border border-[#4F5C4A]/[0.10] shadow-inner relative z-0">
                        <MapContainer
                          center={[30.4278, -9.5981]}
                          zoom={10}
                          scrollWheelZoom={false}
                          className="h-full w-full"
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Polygon
                            positions={zone.geojson.coordinates[0].map((c) => [
                              c[1],
                              c[0],
                            ])}
                            pathOptions={{
                              color: "#4E6B4A",
                              fillColor: "#4E6B4A",
                              fillOpacity: 0.2,
                              weight: 3,
                            }}
                          />
                          <MapRefocus coords={zone.geojson.coordinates[0]} />
                        </MapContainer>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-[#DCE3D6]/20 rounded-[24px] border border-dashed border-[#4F5C4A]/20">
                  <Layers className="w-10 h-10 text-[#6B7468]/30 mx-auto mb-4" />
                  <p className="metadata text-[#6B7468] italic">No zones defined yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Sensors List */}
          <section className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-sm overflow-hidden">
            <div className="p-8 border-b border-[#4F5C4A]/[0.05] flex items-center justify-between">
              <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
                <Cpu className="w-5 h-5 text-[#B88A44]" />
                Active Sensors ({sensors.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="metadata bg-[#DCE3D6]/40 text-[#6B7468] text-[10px]">
                    <th className="px-8 py-[18px]">Sensor Reference</th>
                    <th className="px-8 py-[18px]">Zone</th>
                    <th className="px-8 py-[18px]">Status</th>
                    <th className="px-8 py-[18px] text-right">Battery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4F5C4A]/[0.05]">
                  {sensors.length > 0 ? (
                    sensors.map((sensor) => (
                      <tr
                        key={sensor._id}
                        className="hover:bg-[#DCE3D6]/30 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <p className="font-[800] text-[#1F2A22] text-[14px]">
                            {sensor.uid}
                          </p>
                          <p className="text-[11px] text-[#6B7468] font-bold mt-0.5">
                            {sensor.type || "Standard Monitoring Node"}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[13px] font-bold text-[#6B7468]">
                            {zones.find((z) => z._id === sensor.zoneId)?.name || "Primary Zone"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-[#1F2A22]">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${sensor.status === "active" ? "bg-[#4E6B4A] shadow-[0_0_8px_rgba(78,107,74,0.4)]" : "bg-[#6B7468]"}`}></div>
                            <span className="text-[13px] font-[800] uppercase tracking-wider">
                              {sensor.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-[#1F2A22]">
                          <div className="flex items-center justify-end gap-3 text-[13px]">
                            {sensor.batteryLevel || 85}%
                            <div className="w-10 h-3.5 bg-[#DCE3D6] rounded-full overflow-hidden inline-block border border-[#4F5C4A]/[0.08] shadow-inner p-0.5">
                              <div
                                className={`h-full rounded-full ${(sensor.batteryLevel || 85) <= 20 ? 'bg-[#A64D4D]' : (sensor.batteryLevel || 85) <= 50 ? 'bg-[#B88A44]' : 'bg-[#4E6B4A]'}`}
                                style={{
                                  width: `${sensor.batteryLevel || 85}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-8 py-16 text-center"
                      >
                        <Cpu className="w-10 h-10 text-[#6B7468]/20 mx-auto mb-4" />
                        <p className="metadata text-[#6B7468] italic text-[14px]">No sensors deployed for this cooperative.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CooperativeDetailPage;
