import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { 
  AlertTriangle, Clock, RefreshCw, Loader2, ShieldAlert, 
  Filter, MapPin, Flame, CheckCircle, Eye, Search, Navigation
} from "lucide-react";
import AlertNotificationModal from "../../components/pompier/AlertNotificationModal";
import IncidentReportModal from "../../components/pompier/IncidentReportModal";
import { usePompierState } from "../../hooks/usePompierState";

// Status translations
const STATUS_LABELS = {
  "OUVERTE": "Open",
  "EN_COURS": "In Progress",
  "RESOLUE": "Resolved",
  "ALL": "All Status"
};

const SEVERITY_LABELS = {
  "CRITIQUE": "Critical",
  "ATTENTION": "Warning",
  "INFO": "Info",
  "ALL": "All Severity"
};

export default function FirefighterAlerts() {
  const navigate = useNavigate();
  const { pompierStatus, setPompierStatus, currentMission, setCurrentMission, takeMission, completeMission } = usePompierState();
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [newAlert, setNewAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [lastAlertId, setLastAlertId] = useState(null);
  const [alertToResolve, setAlertToResolve] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/pompier/alertes-critiques');
      const alertsData = Array.isArray(res.data) ? res.data : [];
      
      // Format alerts for display - use cooperative name as fallback for zone
      const formattedAlerts = alertsData.map(alert => ({
        id: alert.id_alerte,
        id_alerte: alert.id_alerte,  // Keep original id for backend
        cooperative: alert.nom_cooperative || alert.cooperative || "",
        zone: alert.nom_zone || alert.nom_cooperative || "Zone",
        type: alert.type_alerte || "Fire",
        severity: alert.niveau_gravite || alert.niveau || "CRITIQUE",
        status: alert.statut || "OUVERTE",
        message: alert.message || "Fire alert detected",
        triggeredAt: alert.date_creation || alert.date_alerte || new Date().toISOString(),
        lat: parseFloat(alert.lat) || null,
        lng: parseFloat(alert.lng) || null
      }));
      
      setAlerts(formattedAlerts);
      
      // Check for new critical alerts only if available
      if (pompierStatus === "available" && formattedAlerts.length > 0) {
        // Filter for open critical alerts
        const openCriticalAlerts = formattedAlerts.filter(a => 
          a.status === "OUVERTE" && 
          (a.severity === "CRITIQUE" || a.severity === "urgence_maximale")
        );
        
        if (openCriticalAlerts.length > 0) {
          const latestAlert = openCriticalAlerts[0];
          if (latestAlert.id !== lastAlertId) {
            setNewAlert(latestAlert);
            setShowAlertModal(true);
            setLastAlertId(latestAlert.id);
          }
        }
      }
      
    } catch (err) {
      console.error("Error fetching alerts", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [pompierStatus, lastAlertId]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleTakeMission = (alert) => {
    // Use the hook to persist state
    takeMission(alert);
    setShowAlertModal(false);
    setNewAlert(null);
    
    // Update alert status to IN_PROGRESS in backend
    api.put(`/incidents/${alert.id}/status`, { statut: "EN_COURS" })
      .then(() => {
        fetchAlerts();
        // Navigate to mission view
        navigate('/pompier/mission');
      })
      .catch(err => console.error("Error updating alert status", err));
  };

  const handleIgnore = () => {
    setShowAlertModal(false);
    setNewAlert(null);
  };

  const handleResolve = (alert = null) => {
    if (alert) {
      setAlertToResolve(alert);
    }
    setShowIncidentForm(true);
  };

  const handleIncidentSuccess = () => {
    completeMission();
    setAlertToResolve(null);
    setShowIncidentForm(false);
    fetchAlerts();
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "CRITIQUE": 
      case "urgence_maximale":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "ATTENTION": 
      case "alerte_elevee":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "INFO":
      case "vigilance":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: 
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusStyle = (status) => {
    if (status === "OUVERTE") return "bg-rose-50 text-rose-600 border-rose-200";
    if (status === "EN_COURS") return "bg-amber-50 text-amber-600 border-amber-200";
    if (status === "RESOLUE") return "bg-emerald-50 text-emerald-600 border-emerald-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === "ALL" || alert.status === statusFilter;
    const matchesSeverity = severityFilter === "ALL" || alert.severity === severityFilter;
    const matchesSearch = searchTerm === "" || 
      alert.cooperative.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.zone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const statusOptions = ["ALL", "OUVERTE", "EN_COURS", "RESOLUE"];
  const severityOptions = ["ALL", "CRITIQUE", "ATTENTION", "INFO"];

  return (
    <div className="space-y-6">
      {/* Epic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02IDItNCAyLTYtMi00LTItNiAyLTQgMi02LTItNC0yLTYgMi00IDItNi0yLTQtMi02aDJjMCAyIDIgNCAyIDZzLTIgNC0yIDYgMiA0IDIgNi0yIDQtMiA2IDIgNCAyIDYtMiA0LTIgNiAyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNi0yIDQtMiA2aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Alert Center</h1>
            </div>
            <p className="text-white/80 font-medium">
              Monitor and respond to fire alerts across all zones
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
              pompierStatus === "available" 
                ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30" 
                : "bg-amber-500/20 text-amber-100 border border-amber-400/30"
            }`}>
              Status: {pompierStatus === "available" ? "Available" : "On Mission"}
            </div>
            <button 
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> 
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Current Mission Banner */}
      {currentMission && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Flame className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-amber-800">Active Mission</div>
              <div className="text-sm text-amber-600">
                {currentMission.cooperative} - {currentMission.zone}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/pompier/mission')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold shadow-lg shadow-blue-200"
            >
              <Navigation className="w-5 h-5" />
              View Location
            </button>
            <button
              onClick={() => handleResolve(currentMission)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold shadow-lg shadow-emerald-200"
            >
              <CheckCircle className="w-5 h-5" />
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Filters:</span>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cooperative or zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === status
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          
          {/* Severity Filter */}
          <div className="flex gap-2">
            {severityOptions.map(severity => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  severityFilter === severity
                    ? "bg-rose-500 text-white"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                }`}
              >
                {SEVERITY_LABELS[severity]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-4 font-bold">ID</th>
                <th className="p-4 font-bold">Location</th>
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Severity</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Time</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-16 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-500" />
                    <span className="font-bold text-sm">Loading alerts...</span>
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-16 text-center text-slate-400">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="font-semibold">No alerts match your filters</div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        #{alert.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-50 rounded-lg">
                          <MapPin className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{alert.cooperative}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{alert.zone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-slate-700">{alert.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg border ${getSeverityStyle(alert.severity)}`}>
                        {SEVERITY_LABELS[alert.severity] || alert.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          {alert.status === "OUVERTE" && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            alert.status === "RESOLUE" ? "bg-emerald-500" : 
                            alert.status === "EN_COURS" ? "bg-amber-500" : "bg-rose-500"
                          }`}></span>
                        </span>
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${getStatusStyle(alert.status)}`}>
                          {STATUS_LABELS[alert.status] || alert.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(alert.triggeredAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status === "OUVERTE" && pompierStatus === "available" && (
                          <button
                            onClick={() => handleTakeMission(alert)}
                            className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition-all"
                          >
                            Take Mission
                          </button>
                        )}
                        {(alert.status === "OUVERTE" || alert.status === "EN_COURS") && (
                          <button
                            onClick={() => handleResolve(alert)}
                            className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.status === "RESOLUE" && (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Notification Modal */}
      <AlertNotificationModal
        alert={newAlert}
        isOpen={showAlertModal}
        onTakeMission={handleTakeMission}
        onIgnore={handleIgnore}
      />

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={showIncidentForm}
        onClose={() => {
          setShowIncidentForm(false);
          setAlertToResolve(null);
        }}
        onSuccess={handleIncidentSuccess}
        alert={alertToResolve || currentMission}
      />
    </div>
  );
}
