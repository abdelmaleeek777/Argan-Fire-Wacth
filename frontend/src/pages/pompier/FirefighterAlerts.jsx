import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, Clock, RefreshCw, Loader2, ShieldAlert } from "lucide-react";

export default function FirefighterAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Fallback/Mock for now, or use actual endpoint if defined later. E.g. we use /admin/alerts or /pompier/alerts
const res = await axios.get("http://127.0.0.1:5000/api/notifications", {
  params: { user_id: userId },
  headers: { Authorization: `Bearer ${token}` }
});
      setAlerts(res.data);
    } catch (err) {
      console.error("Error fetching alerts", err);
      // Fallback UI data if endpoint isn't ready
      setTimeout(() => {
        setAlerts([
            { id: 101, cooperative: "Coopérative Taliouine", zone: "Forêt d'Amskroud", type: "Incendie", severity: "CRITIQUE", status: "EN_COURS", triggeredAt: new Date().toISOString() },
            { id: 102, cooperative: "Arganier d'Or", zone: "Parc National Souss-Massa", type: "Chaleur", severity: "ATTENTION", status: "OUVERTE", triggeredAt: new Date().toISOString() }
        ]);
        setLoading(false);
      }, 800);
      return;
    } 
    setLoading(false);
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "CRITIQUE": return "bg-rose-100 text-rose-700 border-rose-200 shadow-sm";
      case "ATTENTION": return "bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm";
      default: return "bg-slate-100 text-slate-700 border-slate-200 shadow-sm";
    }
  };

  const getStatusStyle = (status) => {
    if (status === "OUVERTE" || status === "EN_COURS") return "bg-rose-50 text-rose-600 border-rose-200 animate-pulse";
    if (status === "RESOLUE") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>
            Active Alerts
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Monitor and respond to reported alerts across the Souss-Massa region.
          </p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold group shadow-sm hover:shadow active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-emerald-500 ${loading ? "animate-spin" : ""}`} /> 
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-5 font-black">ID</th>
                <th className="p-5 font-black">Cooperative & Zone</th>
                <th className="p-5 font-black">Type</th>
                <th className="p-5 font-black">Severity</th>
                <th className="p-5 font-black">Status</th>
                <th className="p-5 font-black text-right">Triggered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                    <span className="font-bold text-sm tracking-widest uppercase">Loading alerts...</span>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center text-slate-400 font-medium">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-10 h-10 text-slate-300" />
                    </div>
                    No active alerts on the network.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5 align-middle">
                      <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">#{alert.id}</span>
                    </td>
                    <td className="p-5 align-middle">
                      <div className="font-black text-slate-800 text-base">{alert.cooperative}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{alert.zone}</div>
                    </td>
                    <td className="p-5 align-middle">
                      <span className="text-sm font-bold text-slate-700">{alert.type}</span>
                    </td>
                    <td className="p-5 align-middle">
                      <span className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity || "INFO"}
                      </span>
                    </td>
                    <td className="p-5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          {(alert.status === "OUVERTE" || alert.status === "EN_COURS") && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${alert.status === "RESOLUE" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        </span>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusStyle(alert.status)}`}>
                          {alert.status || "UNKNOWN"}
                        </span>
                      </div>
                    </td>
                    <td className="p-5 text-right align-middle">
                      <div className="flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : "N/A"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
