import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Loader2, 
  ShieldAlert,
  Thermometer,
  Droplets,
  MapPin,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Cpu,
  Flame,
  Wind,
  Zap,
  Activity,
  Bell,
  Eye
} from "lucide-react";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/alerts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data);
    } catch (err) {
      console.error("Error fetching alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      setUpdating(alertId);
      const token = localStorage.getItem("token");
      await axios.patch(`/api/admin/alerts/${alertId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { ...a, status: newStatus, resolvedAt: newStatus === "RESOLUE" ? new Date().toISOString() : null }
          : a
      ));
    } catch (err) {
      console.error("Error updating alert", err);
    } finally {
      setUpdating(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  // Stats
  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === "OUVERTE").length,
    inProgress: alerts.filter(a => a.status === "EN_COURS").length,
    resolved: alerts.filter(a => a.status === "RESOLUE").length,
    critical: alerts.filter(a => a.severity === "CRITIQUE" && a.status !== "RESOLUE").length,
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "Unknown";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Epic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-900 to-orange-900 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-xl shadow-rose-500/30">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Alert Command Center
              </h1>
              <p className="text-rose-200/80 text-sm mt-1">
                Real-time fire monitoring • Auto-refresh every 30s
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/30 backdrop-blur-sm rounded-xl border border-rose-400/30 animate-pulse">
                <Bell className="w-4 h-4 text-rose-300" />
                <span className="text-rose-100 font-bold text-sm">{stats.critical} Critical</span>
              </div>
            )}
            <button 
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all shadow-lg text-sm font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Inline Stats */}
        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {[
            { label: "Total", value: stats.total, icon: Activity, color: "from-slate-500/50 to-slate-600/50", border: "border-slate-400/30" },
            { label: "Open", value: stats.open, icon: AlertTriangle, color: "from-rose-500/50 to-rose-600/50", border: "border-rose-400/30", pulse: stats.open > 0 },
            { label: "In Progress", value: stats.inProgress, icon: Zap, color: "from-amber-500/50 to-orange-500/50", border: "border-amber-400/30", pulse: stats.inProgress > 0 },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "from-emerald-500/50 to-teal-500/50", border: "border-emerald-400/30" },
            { label: "Critical", value: stats.critical, icon: Flame, color: "from-rose-600/50 to-red-700/50", border: "border-rose-500/50", pulse: stats.critical > 0, danger: true },
          ].map((stat, i) => (
            <div 
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-sm border ${stat.border} p-4 ${stat.pulse ? "animate-pulse" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.danger && stat.value > 0 ? "text-rose-200" : "text-white"} mt-1`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.danger && stat.value > 0 ? "text-rose-300" : "text-white/40"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/50 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 uppercase font-black tracking-wider">Status</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { value: "all", label: "All", color: "bg-slate-600" },
              { value: "OUVERTE", label: "Open", color: "bg-rose-500" },
              { value: "EN_COURS", label: "Progress", color: "bg-amber-500" },
              { value: "RESOLUE", label: "Resolved", color: "bg-emerald-500" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  statusFilter === opt.value 
                    ? "bg-white text-slate-800 shadow-lg" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 uppercase font-black tracking-wider">Severity</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { value: "all", label: "All" },
              { value: "CRITIQUE", label: "🔥 Critical" },
              { value: "ATTENTION", label: "⚠️ Warning" },
              { value: "INFO", label: "ℹ️ Info" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSeverityFilter(opt.value)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  severityFilter === opt.value 
                    ? "bg-white text-slate-800 shadow-lg" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-slate-400">Showing</span>
          <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{filteredAlerts.length}</span>
          <span className="text-slate-400">alerts</span>
        </div>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
            <Flame className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-bold mt-6">Scanning for alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 p-20 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-black text-emerald-800">All Systems Normal</h3>
          <p className="text-emerald-600 mt-2">No active alerts matching your filters</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map(alert => {
            const isCritical = alert.severity === "CRITIQUE";
            const isOpen = alert.status === "OUVERTE";
            const isInProgress = alert.status === "EN_COURS";
            const isResolved = alert.status === "RESOLUE";
            const isExpanded = expandedAlert === alert.id;
            
            return (
              <div 
                key={alert.id}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                  isCritical && isOpen
                    ? "bg-gradient-to-r from-rose-50 via-white to-orange-50 border-rose-300 shadow-xl shadow-rose-100 hover:shadow-2xl hover:shadow-rose-200"
                    : isOpen
                    ? "bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-200 shadow-lg shadow-amber-100 hover:shadow-xl"
                    : isInProgress
                    ? "bg-gradient-to-r from-blue-50 via-white to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl"
                    : isResolved
                    ? "bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 border-emerald-200/50 hover:shadow-lg"
                    : "bg-white border-slate-200 hover:shadow-lg"
                }`}
              >
                {/* Animated border for critical */}
                {isCritical && isOpen && (
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 opacity-100 animate-pulse" style={{padding: '2px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude'}}></div>
                )}

                <div className="relative p-6">
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    <div className={`relative shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      isCritical ? "bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-200" :
                      isOpen ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-200" :
                      isInProgress ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-200" :
                      "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200"
                    }`}>
                      {isCritical ? <Flame className="w-7 h-7 text-white" /> :
                       isOpen ? <AlertTriangle className="w-7 h-7 text-white" /> :
                       isInProgress ? <Zap className="w-7 h-7 text-white" /> :
                       <CheckCircle2 className="w-7 h-7 text-white" />}
                      {(isOpen || isInProgress) && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isCritical ? "bg-rose-500" : isOpen ? "bg-amber-500" : "bg-blue-500"}`}></span>
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                          isCritical ? "bg-rose-100 text-rose-700" :
                          alert.severity === "ATTENTION" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {alert.severity || "INFO"}
                        </span>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 ${
                          isOpen ? "bg-rose-500 text-white" :
                          isInProgress ? "bg-blue-500 text-white" :
                          isResolved ? "bg-emerald-500 text-white" :
                          "bg-slate-400 text-white"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOpen || isInProgress ? "bg-white animate-pulse" : "bg-white/60"}`}></span>
                          {isOpen ? "OPEN" : isInProgress ? "IN PROGRESS" : isResolved ? "RESOLVED" : "CANCELLED"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-bold">#{alert.id}</span>
                        <span className={`text-xs font-bold ${
                          isCritical && isOpen ? "text-rose-500" : "text-slate-400"
                        }`}>
                          {getTimeAgo(alert.triggeredAt)}
                        </span>
                      </div>
                      
                      <h3 className="font-black text-xl text-slate-800 mt-3">{alert.cooperative}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{alert.zone}</span>
                        </span>
                        {alert.region && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{alert.region}</span>
                          </>
                        )}
                      </div>

                      {/* Sensor Data Pills */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {alert.sensorRef && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                            <Cpu className="w-3.5 h-3.5" />
                            {alert.sensorRef}
                          </div>
                        )}
                        {alert.temperature && (
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                            alert.temperature > 50 ? "bg-rose-100 text-rose-700" : 
                            alert.temperature > 35 ? "bg-amber-100 text-amber-700" : 
                            "bg-blue-100 text-blue-700"
                          }`}>
                            <Thermometer className="w-3.5 h-3.5" />
                            {alert.temperature}°C
                          </div>
                        )}
                        {alert.humidity && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 rounded-full text-xs font-bold text-cyan-700">
                            <Droplets className="w-3.5 h-3.5" />
                            {alert.humidity}%
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : "N/A"}
                        </div>
                      </div>

                      {/* Message - only when expanded */}
                      {isExpanded && alert.message && (
                        <div className="mt-4 p-4 bg-white/80 rounded-xl border border-slate-200/50 shadow-inner">
                          <p className="text-sm text-slate-600 leading-relaxed">{alert.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isResolved ? (
                        <div className="text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Resolved
                          </div>
                          {alert.resolvedAt && (
                            <p className="text-[10px] text-emerald-600 mt-1">
                              {new Date(alert.resolvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : alert.status === "ANNULEE" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                          <XCircle className="w-4 h-4" />
                          Dismissed
                        </div>
                      ) : alert.status === "EN_COURS" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                          <PlayCircle className="w-4 h-4" />
                          In Progress
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          Active
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                    <Eye className={`w-4 h-4 text-slate-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
