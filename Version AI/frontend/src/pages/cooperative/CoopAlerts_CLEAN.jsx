import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, Clock, RefreshCw, Loader2, ShieldAlert } from "lucide-react";

export default function CoopAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      fetchAlerts();
    }
  }, [coopId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/cooperative/${coopId}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error("Error fetching alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "urgence_maximale": return "bg-rose-100 text-rose-700 border-rose-200";
      case "alerte": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusStyle = (status) => {
    if (status === "active") return "bg-rose-50 text-rose-600 border-rose-200 animate-pulse";
    if (status === "traitée") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            System Alerts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor and manage fire alerts from your cooperative.
          </p>
        </div>
        <button 
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm text-sm font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-5 font-bold">ID</th>
                <th className="p-5 font-bold">Zone</th>
                <th className="p-5 font-bold">Type</th>
                <th className="p-5 font-bold">Severity</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-right">Triggered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No active alerts in your cooperative.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id_alerte} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{alert.id_alerte}</span>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-800">{alert.zone}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-sm font-semibold text-slate-700">Fire Alert</span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${getSeverityStyle(alert.niveau_urgence)}`}>
                        {alert.niveau_urgence === "urgence_maximale" ? "CRITIQUE" : 
                         alert.niveau_urgence === "alerte" ? "ATTENTION" : "VIGILANCE"}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md border ${getStatusStyle(alert.statut)}`}>
                        {alert.statut === "active" ? "OUVERTE" :
                         alert.statut === "traitée" ? "RESOLUE" : alert.statut || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {alert.date_heure_declenchement ? new Date(alert.date_heure_declenchement).toLocaleString() : "N/A"}
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