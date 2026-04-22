import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { 
  AlertTriangle, Clock, RefreshCw, Loader2, ShieldAlert, 
  Filter, MapPin, Flame, CheckCircle, CheckCircle2, Eye, Search, Navigation, Zap, Cpu, Thermometer, Bell
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
        temperature: alert.temperature ? Math.round(alert.temperature) : null,
        lat: parseFloat(alert.lat) || null,
        lng: parseFloat(alert.lng) || null
      }));
      
      setAlerts(formattedAlerts);
      
      // Check for new critical alerts only if available
      if (pompierStatus === "available" && formattedAlerts.length > 0) {
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
    takeMission(alert);
    setShowAlertModal(false);
    setNewAlert(null);
    
    api.put(`/incidents/${alert.id}/status`, { statut: "EN_COURS" })
      .then(() => {
        fetchAlerts();
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

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === "ALL" || alert.status === statusFilter;
    const matchesSeverity = severityFilter === "ALL" || alert.severity === severityFilter;
    const matchesSearch = searchTerm === "" || 
      alert.cooperative.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.zone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  // Stats
  const stats = {
    total: alerts.length,
    open: alerts.filter(a => a.status === "OUVERTE").length,
    inProgress: alerts.filter(a => a.status === "EN_COURS").length,
    resolved: alerts.filter(a => a.status === "RESOLUE").length,
    critical: alerts.filter(a => (a.severity === "CRITIQUE" || a.severity === "urgence_maximale") && a.status !== "RESOLUE").length,
  };

  const statusOptions = ["ALL", "OUVERTE", "EN_COURS", "RESOLUE"];
  const severityOptions = ["ALL", "CRITIQUE", "ATTENTION", "INFO"];

  return (
    <div className="flex flex-col gap-[28px] w-full pb-10">

      {/* Premium Header Card — matches Admin Alerts */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] p-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Bell className="w-7 h-7 text-[#B88A44]" />
            </div>
            <div>
              <h1 className="page-title text-[#1F2A22]">Alert Center</h1>
              <p className="secondary-text text-[14px] mt-1">Monitor and respond to fire alerts · Auto-refresh enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`badge flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] shadow-sm border ${
              pompierStatus === "available" 
                ? "bg-[#4E6B4A]/10 border-[#4E6B4A]/20" 
                : "bg-[#B88A44]/10 border-[#B88A44]/20"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                pompierStatus === "available" ? "bg-[#4E6B4A] animate-pulse" : "bg-[#B88A44]"
              }`}></span>
              <span className="metadata text-[11px] text-[#1F2A22]">
                {pompierStatus === "available" ? "Available" : pompierStatus === "on_mission" ? "On Mission" : "Unavailable"}
              </span>
            </div>

            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-[12px] border border-rose-100">
                <Flame className="w-4 h-4 text-rose-600" />
                <span className="badge text-rose-700 text-[13px]">{stats.critical} Critical</span>
              </div>
            )}
            <button 
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] text-[#1F2A22] rounded-[14px] hover:bg-[#DCE3D6] hover:shadow-sm transition-all text-[13px] font-[800]"
            >
              <RefreshCw className={`w-4 h-4 text-[#4E6B4A] ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Minimal Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-[32px]">
          {[
            { label: "Total", value: stats.total, color: "text-[#1F2A22]", bg: "bg-[#DCE3D6]" },
            { label: "Open", value: stats.open, color: "text-[#B88A44]", bg: "bg-[#B88A44]/15" },
            { label: "In Progress", value: stats.inProgress, color: "text-[#6E7A4E]", bg: "bg-[#6E7A4E]/15" },
            { label: "Resolved", value: stats.resolved, color: "text-[#4E6B4A]", bg: "bg-[#4E6B4A]/15" },
            { label: "Critical", value: stats.critical, color: "text-rose-600", bg: "bg-rose-50" },
          ].map((stat, i) => (
            <div key={i} className={`rounded-[16px] border border-[#4F5C4A]/[0.05] p-4 ${stat.bg}`}>
              <p className="metadata text-[11px] font-bold">{stat.label}</p>
              <p className={`text-[28px] font-[800] mt-1 leading-none ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Mission Banner */}
      {currentMission && (
        <div className="bg-[#B88A44] rounded-[24px] p-5 flex items-center justify-between text-white shadow-[0_8px_24px_rgba(184,138,68,0.2)]">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-[14px] bg-white/20 flex items-center justify-center">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-[800] text-[14px] uppercase tracking-wider">Active Mission</div>
              <div className="text-[13px] text-white/80 font-[600]">
                {currentMission.cooperative} — {currentMission.zone}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/pompier/mission')}
              className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-[12px] hover:bg-white/25 transition-all font-[700] text-[12px] border border-white/20"
            >
              <Navigation className="w-4 h-4" />
              View Location
            </button>
            <button
              onClick={() => handleResolve(currentMission)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#B88A44] rounded-[12px] hover:bg-white/90 transition-all font-[800] text-[12px]"
            >
              <CheckCircle className="w-4 h-4" />
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar — matches Admin */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F8F7F2] p-4 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.02)]">
        <div className="flex items-center gap-3">
          <span className="metadata text-[12px]">Status</span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[12px] border border-[#4F5C4A]/[0.05]">
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-[12px] font-[700] rounded-[8px] transition-all ${
                  statusFilter === status
                    ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10"
                    : "text-[#6B7468] hover:text-[#1F2A22]"
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-[#4F5C4A]/20 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <span className="metadata text-[12px]">Severity</span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[12px] border border-[#4F5C4A]/[0.05]">
            {severityOptions.map(severity => (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severity)}
                className={`px-4 py-2 text-[12px] font-[700] rounded-[8px] transition-all ${
                  severityFilter === severity
                    ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10"
                    : "text-[#6B7468] hover:text-[#1F2A22]"
                }`}
              >
                {SEVERITY_LABELS[severity]}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] ml-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7468]" />
          <input
            type="text"
            placeholder="Search cooperative or zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-[600] bg-[#ECE9E1]/60 border border-[#4F5C4A]/[0.10] rounded-[12px] focus:outline-none focus:bg-white focus:border-[#B88A44]/30 transition-all text-[#1F2A22] placeholder-[#6B7468]/60"
          />
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#6B7468] font-bold">
          Showing <span className="font-[800] text-[#1F2A22]">{filteredAlerts.length}</span> events
        </div>
      </div>

      {/* Alerts Grid — Premium Cards matching Admin */}
      {loading ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin mb-4" />
          <p className="text-[#6B7468] font-[700]">Scanning event ledger...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <div className="w-[64px] h-[64px] bg-[#DCE3D6] rounded-full flex items-center justify-center mb-6 border border-[#4F5C4A]/[0.10]">
            <CheckCircle2 className="w-8 h-8 text-[#4E6B4A]" />
          </div>
          <h3 className="section-title text-[#1F2A22]">Event Ledger Empty</h3>
          <p className="text-[#6B7468] mt-1 text-[14px] font-medium">No active alerts matching your current filters.</p>
        </div>
      ) : (
        <div className="grid gap-[16px]">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITIQUE" || alert.severity === "urgence_maximale";
            const isOpen = alert.status === "OUVERTE";
            const isInProgress = alert.status === "EN_COURS";
            const isResolved = alert.status === "RESOLUE";

            // Argan palette dynamic accent
            let accentColor = "#4E6B4A";
            if (isCritical) accentColor = "#B55A3C";
            else if (alert.severity === "ATTENTION" || alert.severity === "alerte_elevee") accentColor = "#B88A44";

            let displayStatus = "Active";
            if (isResolved) displayStatus = "Resolved";
            else if (isInProgress) displayStatus = "In Progress";

            const IconComp = isCritical ? Flame : isOpen ? AlertTriangle : isInProgress ? Zap : CheckCircle2;

            return (
              <div
                key={alert.id}
                className="group relative overflow-hidden shadow-[0_12px_40px_rgba(31,42,33,0.03)] hover:shadow-[0_16px_50px_rgba(31,42,33,0.05)] hover:-translate-y-[2px] transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #F7F4EE 0%, #EEF1EC 100%)',
                  borderRadius: '34px 20px 40px 24px',
                  border: '1px solid rgba(79, 92, 74, 0.08)'
                }}
              >
                {/* Blurred Accent Background */}
                <div 
                  className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] opacity-[0.14] group-hover:opacity-[0.24] group-hover:scale-110 blur-[60px] transition-all duration-700 ease-out pointer-events-none rounded-full z-0"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Contour Overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none z-0"
                  style={{
                    backgroundImage: `radial-gradient(ellipse at 90% -20%, transparent 40%, #1F2A22 41%, transparent 42%),
                                      radial-gradient(ellipse at 90% -20%, transparent 50%, #1F2A22 51%, transparent 52%),
                                      radial-gradient(ellipse at 90% -20%, transparent 60%, #1F2A22 61%, transparent 62%)`,
                    backgroundSize: '150% 150%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-stretch min-h-[140px]">
                  
                  {/* Left Content */}
                  <div className="flex-1 p-6 md:p-8 md:pr-10 flex flex-col justify-center gap-1.5">
                    
                    {/* Metadata Ribbon */}
                    <div className="metadata flex items-center gap-3 text-[11px] transition-opacity duration-300 group-hover:opacity-75" style={{ color: accentColor }}>
                      <span className="font-mono">#{alert.id}</span>
                      <div className="w-1.5 h-1.5 rounded-full opacity-40 bg-current" />
                      <span>{getTimeAgo(alert.triggeredAt)}</span>
                      <div className="w-1.5 h-1.5 rounded-full opacity-40 bg-current" />
                      <span>{SEVERITY_LABELS[alert.severity] || alert.severity}</span>
                    </div>

                    {/* Title */}
                    <h2 className="card-title text-[#1F2A22] mt-1.5 group-hover:translate-x-1 transition-transform duration-500 ease-out">
                      {alert.cooperative || alert.zone}
                    </h2>

                    {/* Detail Pills */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className="flex items-center gap-2 bg-[#F8F7F2]/60 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-[#4F5C4A]/10 shadow-[0_2px_8px_rgba(31,42,33,0.02)]">
                        <MapPin className="w-4 h-4 opacity-80 z-10" style={{ color: accentColor }} />
                        <span className="text-[13px] font-[800] text-[#4F5C4A]">{alert.zone}</span>
                      </div>
                      
                      {alert.temperature && (
                        <div className="flex items-center gap-1.5 bg-[#F8F7F2]/60 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-[#4F5C4A]/10 shadow-[0_2px_8px_rgba(31,42,33,0.02)]">
                          <Thermometer className="w-3.5 h-3.5" style={{ color: accentColor }} />
                          <span className="text-[13px] font-[800] text-[#1F2A22]">{alert.temperature}°C</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 bg-[#F8F7F2]/60 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-[#4F5C4A]/10 shadow-[0_2px_8px_rgba(31,42,33,0.02)]">
                        <Flame className="w-3.5 h-3.5 text-[#6B7468]/80" />
                        <span className="text-[12px] font-[800] text-[#4F5C4A] uppercase tracking-wider">{alert.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Area */}
                  <div className="md:w-[240px] shrink-0 relative overflow-hidden flex flex-row md:flex-col items-center md:items-stretch justify-between p-6 border-t md:border-t-0 border-[#4F5C4A]/10">
                    
                    {/* Status Badge */}
                    <div className="relative z-10 md:self-end">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-[14px] backdrop-blur-md shadow-sm border"
                           style={{
                             backgroundColor: `color-mix(in srgb, ${accentColor} 8%, rgba(247,244,238,0.95))`,
                             borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                             color: accentColor
                           }}
                      >
                        {isOpen && <div className="w-1.5 h-1.5 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ backgroundColor: accentColor }} />}
                        <span className="badge text-[11px]">{displayStatus}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 mt-4 relative z-10">
                      {isOpen && pompierStatus === "available" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTakeMission(alert); }}
                          className="px-4 py-2 bg-[#B88A44] text-white text-[10px] font-[800] uppercase tracking-wider rounded-[10px] hover:bg-[#A37B3D] transition-all shadow-md shadow-[#B88A44]/20"
                        >
                          Take Mission
                        </button>
                      )}
                      {(isOpen || isInProgress) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResolve(alert); }}
                          className="px-4 py-2 bg-[#4E6B4A] text-white text-[10px] font-[800] uppercase tracking-wider rounded-[10px] hover:bg-[#3d5439] transition-all"
                        >
                          Resolve
                        </button>
                      )}
                      {isResolved && (
                        <span className="px-4 py-2 bg-[#4E6B4A]/10 text-[#4E6B4A] text-[10px] font-[800] uppercase tracking-wider rounded-[10px] border border-[#4E6B4A]/15 text-center">
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    {/* Background Icon */}
                    <div className="hidden md:flex flex-1 items-end justify-end relative z-0">
                      <IconComp className="w-24 h-24 opacity-10 absolute -bottom-4 -right-2" style={{ color: accentColor }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
