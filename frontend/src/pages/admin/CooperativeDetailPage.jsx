import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
        `http://localhost:5000/admin/cooperatives/${id}`,
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
        `http://localhost:5000/admin/cooperatives/${id}/${action}`,
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors group mb-4"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to All Cooperatives</span>
      </button>

      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50 -z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-6">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-emerald-200 shadow-xl border-4 border-emerald-50">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                {cooperative.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 font-medium">
                <div className="flex items-center gap-1.5 ">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {cooperative.region}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Joined {new Date(cooperative.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 ${
                cooperative.status === "approved"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100 shadow-sm"
                  : cooperative.status === "pending"
                    ? "bg-amber-50 border-amber-100 text-amber-700 shadow-amber-100 shadow-sm"
                    : "bg-rose-50 border-rose-100 text-rose-700 shadow-rose-100 shadow-sm"
              }`}
            >
              {cooperative.status.toUpperCase()}
            </span>
            <div className="flex items-center gap-2 mt-2 bg-white/50 backdrop-blur-md p-1.5 rounded-xl border border-slate-200/60 shadow-sm">
              {cooperative.status === "pending" && (
                <>
                  <button onClick={() => handleAction("approve")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors shadow-sm active:scale-95">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction("reject")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors shadow-sm active:scale-95">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
              {cooperative.status === "approved" && (
                <button onClick={() => handleAction("suspend")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-rose-700 rounded-lg transition-colors shadow-sm active:scale-95">
                  <Ban className="w-4 h-4" /> Suspend
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
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              Owner Information
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Full Name
                </p>
                <p className="text-slate-800 font-semibold">
                  {cooperative.ownerName}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Email Address
                </p>
                <p className="text-slate-800 font-semibold break-all">
                  {cooperative.ownerEmail}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Phone Number
                </p>
                <p className="text-slate-800 font-semibold">
                  {cooperative.phone || "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Location details */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              General Location
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {cooperative.address ||
                "No specific address provided for this cooperative."}
            </p>
          </section>
        </div>

        {/* Right Col - Zones and Sensors */}
        <div className="lg:col-span-2 space-y-8">
          {/* Zones Summary */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              Protection Zones ({zones.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <div
                    key={zone._id}
                    className="p-4 border border-slate-100 rounded-2xl bg-emerald-50/20"
                  >
                    <p className="font-bold text-slate-800">{zone.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {zone.description || "Fire monitoring zone"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No zones defined yet.</p>
              )}
            </div>
          </section>

          {/* Sensors List */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                Active Sensors ({sensors.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      Sensor ID / Type
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      Zone
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">
                      Battery
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sensors.length > 0 ? (
                    sensors.map((sensor) => (
                      <tr
                        key={sensor._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">
                            {sensor.uid}
                          </p>
                          <p className="text-xs text-slate-500">
                            {sensor.type || "Standard Node"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {zones.find((z) => z._id === sensor.zoneId)?.name ||
                            "Default Zone"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Activity
                              className={`w-4 h-4 ${sensor.status === "active" ? "text-emerald-500" : "text-slate-400"}`}
                            />
                            <span
                              className={`font-medium ${sensor.status === "active" ? "text-emerald-700" : "text-slate-500"}`}
                            >
                              {sensor.status.charAt(0).toUpperCase() +
                                sensor.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-600 font-medium">
                            {sensor.batteryLevel || 85}%
                            <div className="w-8 h-3 bg-slate-100 rounded-full overflow-hidden inline-block border border-slate-200 shadow-inner">
                              <div
                                className={`h-full ${(sensor.batteryLevel || 85) <= 20 ? 'bg-rose-500' : (sensor.batteryLevel || 85) <= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
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
                        className="px-6 py-10 text-center text-slate-400 italic"
                      >
                        No sensors deployed for this cooperative.
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
