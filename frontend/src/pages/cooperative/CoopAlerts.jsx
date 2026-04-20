import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Thermometer,
  Droplets,
  MapPin,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Cpu,
  Flame,
  Zap,
  Activity,
  Bell,
  Eye,
} from "lucide-react";

export default function CoopAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [expandedAlert, setExpandedAlert] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [coopId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/cooperative/${coopId}/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      // Map cooperative API fields to expected format
      const mappedAlerts = data.map(alert => ({
        id: alert.id_alerte || alert.id,
        zone: alert.zone || alert.nom_zone || "Unknown Zone",
        severity: alert.niveau_urgence === "urgence_maximale" ? "CRITIQUE" : 
                  alert.niveau_urgence === "alerte" ? "ATTENTION" : "INFO",
        status: alert.statut === "active" ? "OUVERTE" : 
                alert.statut === "traitée" ? "RESOLUE" : 
                alert.statut === "en_cours" ? "EN_COURS" : alert.statut?.toUpperCase() || "OUVERTE",
        triggeredAt: alert.date_heure_declenchement || alert.triggeredAt,
        temperature: alert.temperature,
        humidity: alert.humidity,
        sensorRef: alert.sensorRef || alert.id_capteur,
        message: alert.message,
        resolvedAt: alert.resolvedAt
      }));
      setAlerts(mappedAlerts);
    } catch (error) {
      console.error("Error fetching alerts", error);
      setAlerts([]);
    } finally {
      setLoading(false);
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
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10 animate-in fade-in duration-700">
      
      {/* Calm & Premium Header Card */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] p-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Bell className="w-7 h-7 text-[#B88A44]" />
            </div>
            <div>
              <h1 className="page-title text-[#1F2A22]">Zone Alerts Ledger</h1>
              <p className="secondary-text text-[14px] mt-1 text-[#6B7468]">Real-time territorial events &middot; Auto-refresh enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats.critical > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-[12px] border border-rose-100">
                <Flame className="w-4 h-4 text-rose-600" />
                <span className="metadata text-[13px] text-rose-700 font-[900] tracking-widest uppercase">{stats.critical} Critical</span>
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
            { label: "Critical", value: stats.critical, color: "text-rose-600", bg: "bg-rose-50", danger: true },
          ].map((stat, i) => (
            <div key={i} className={`rounded-[16px] border border-[#4F5C4A]/[0.05] p-4 ${stat.bg}`}>
              <p className="metadata text-[11px] font-[800] uppercase tracking-widest text-[#6B7468]">{stat.label}</p>
              <p className={`text-[28px] font-[800] mt-1 leading-none tracking-tight ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F8F7F2] p-4 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.02)]">
        <div className="flex items-center gap-3">
          <span className="metadata text-[12px] font-[800] text-[#6B7468] tracking-widest uppercase">Status</span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[12px] border border-[#4F5C4A]/[0.05]">
            {[
              { value: "all", label: "All" },
              { value: "OUVERTE", label: "Open" },
              { value: "EN_COURS", label: "Progress" },
              { value: "RESOLUE", label: "Resolved" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-[12px] font-[700] rounded-[8px] transition-all flex items-center gap-2 ${
                  statusFilter === opt.value
                    ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10"
                    : "text-[#6B7468] hover:text-[#1F2A22]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-[#4F5C4A]/20 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <span className="metadata text-[12px] font-[800] text-[#6B7468] tracking-widest uppercase">Severity</span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[12px] border border-[#4F5C4A]/[0.05]">
            {[
              { value: "all", label: "All" },
              { value: "CRITIQUE", label: "Critical" },
              { value: "ATTENTION", label: "Warning" },
              { value: "INFO", label: "Info" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSeverityFilter(opt.value)}
                className={`px-4 py-2 text-[12px] font-[700] rounded-[8px] transition-all ${
                  severityFilter === opt.value
                    ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10"
                    : "text-[#6B7468] hover:text-[#1F2A22]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[13px] text-[#6B7468] font-bold">
          Showing <span className="font-[800] text-[#1F2A22]">{filteredAlerts.length}</span> events
        </div>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin mb-4" />
          <p className="text-[#6B7468] font-[700]">Scanning event ledger...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <div className="w-[64px] h-[64px] bg-[#DCE3D6] rounded-[24px] flex items-center justify-center mb-6 border border-[#4F5C4A]/[0.10]">
            <CheckCircle2 className="w-8 h-8 text-[#4E6B4A]" />
          </div>
          <h3 className="section-title text-[#1F2A22] text-[20px] font-[800]">Territories Nominal</h3>
          <p className="text-[#6B7468] mt-1 text-[14px] font-medium">No active alerts matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-[16px]">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === "CRITIQUE";
            const isOpen = alert.status === "OUVERTE";
            const isInProgress = alert.status === "EN_COURS";
            const isResolved = alert.status === "RESOLUE";
            const isExpanded = expandedAlert === alert.id;

            // Argan palette dynamic accent color
            let accentColor = "#4E6B4A"; // Faible / INFO -> Deep sage green
            if (alert.severity === "CRITIQUE") accentColor = "#B55A3C"; // Critique -> Burnt clay
            else if (alert.severity === "ATTENTION") accentColor = "#B88A44"; // Modérée -> Argan gold

            let displayStatus = alert.status;
            if (isResolved) displayStatus = "Resolved";
            else if (alert.status === "ANNULEE") displayStatus = "Dismissed";
            else if (isInProgress) displayStatus = "In Progress";
            else displayStatus = "Active";

            const IconComp = isCritical ? Flame : isOpen ? AlertTriangle : isInProgress ? Zap : CheckCircle2;

            return (
              <div
                key={alert.id}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                className="group relative overflow-hidden shadow-[0_12px_40px_rgba(31,42,33,0.03)] hover:shadow-[0_16px_50px_rgba(31,42,33,0.05)] hover:-translate-y-[2px] transition-all duration-500 cursor-pointer"
                style={{ 
                  background: 'linear-gradient(135deg, #F7F4EE 0%, #EEF1EC 100%)',
                  borderRadius: '34px 20px 40px 24px',
                  border: '1px solid rgba(79, 92, 74, 0.08)'
                }}
              >
                {/* Asymmetrical Blurred Soft Background Accent */}
                <div 
                  className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] opacity-[0.14] group-hover:opacity-[0.24] group-hover:scale-110 blur-[60px] transition-all duration-700 ease-out pointer-events-none rounded-full z-0"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Subtle Topographical Lines / Contour Overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none z-0"
                  style={{
                    backgroundImage: `radial-gradient(ellipse at 90% -20%, transparent 40%, #1F2A22 41%, transparent 42%),
                                      radial-gradient(ellipse at 90% -20%, transparent 50%, #1F2A22 51%, transparent 52%),
                                      radial-gradient(ellipse at 90% -20%, transparent 60%, #1F2A22 61%, transparent 62%),
                                      radial-gradient(ellipse at 90% -20%, transparent 70%, #1F2A22 71%, transparent 72%)`,
                    backgroundSize: '150% 150%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-stretch min-h-[160px]">
                  
                  {/* Left Hero Composition */}
                  <div className="flex-1 p-6 md:p-8 md:pr-10 flex flex-col justify-center gap-1.5">
                    
                    {/* Metadata Ribbon */}
                    <div className="metadata flex items-center gap-3 text-[11px] uppercase tracking-widest font-[800] transition-opacity duration-300 group-hover:opacity-75" style={{ color: accentColor }}>
                      <span className="font-mono">#{alert.id}</span>
                      <div className="w-1.5 h-1.5 rounded-full opacity-40 bg-current" />
                      <span>{getTimeAgo(alert.triggeredAt)}</span>
                      <div className="w-1.5 h-1.5 rounded-full opacity-40 bg-current" />
                      <span>{alert.severity || "INFO"}</span>
                    </div>

                    {/* Dominant Typography Header */}
                    <h2 className="text-[32px] font-[800] text-[#1F2A22] mt-1.5 group-hover:translate-x-1 transition-transform duration-500 ease-out tracking-tight leading-none">
                      {alert.zone}
                    </h2>

                    {/* Cinematic Detailed Info Row */}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      
                      {alert.sensorRef && (
                        <div className="flex items-center gap-2 bg-[#F8F7F2]/60 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-[#4F5C4A]/10 shadow-[0_2px_8px_rgba(31,42,33,0.02)]">
                          <Cpu className="w-4 h-4 text-[#6B7468]/80" />
                          <span className="text-[12px] font-[800] text-[#4F5C4A] uppercase tracking-wider">{alert.sensorRef}</span>
                        </div>
                      )}
                      
                      {(alert.temperature || alert.humidity) && (
                        <div className="flex items-center gap-3 bg-[#F8F7F2]/60 backdrop-blur-md px-3.5 py-1.5 rounded-[12px] border border-[#4F5C4A]/10 shadow-[0_2px_8px_rgba(31,42,33,0.02)]">
                          {alert.temperature && (
                            <div className="flex items-center gap-1.5 font-[800] text-[13px] text-[#1F2A22]">
                              <Thermometer className="w-3.5 h-3.5" style={{ color: accentColor }} />
                              {alert.temperature}°C
                            </div>
                          )}
                          {alert.temperature && alert.humidity && <span className="w-[1px] h-3 bg-[#4F5C4A]/20" />}
                          {alert.humidity && (
                            <div className="flex items-center gap-1.5 font-[800] text-[13px] text-[#1F2A22]">
                              <Droplets className="w-3.5 h-3.5 text-[#4F5C4A]/80" />
                              {alert.humidity}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded Drawer Context */}
                    {isExpanded && alert.message && (
                        <div className="mt-6 p-5 bg-[#DCE3D6]/40 backdrop-blur-md rounded-[20px] border border-[#4F5C4A]/10 relative overflow-hidden animate-in slide-in-from-top-2 duration-300">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: accentColor }} />
                        <p className="text-[14px] text-[#2F4A36] leading-relaxed font-semibold pl-2">
                          {alert.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Immersive Colored Shape Area */}
                  <div className="md:w-[240px] shrink-0 relative overflow-hidden flex flex-row md:flex-col items-center md:items-stretch justify-between p-6 border-t md:border-t-0 border-[#4F5C4A]/10">
                    
                    {/* Integrated Status Shape */}
                    <div className="relative z-10 md:self-end">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-[14px] backdrop-blur-md shadow-sm border"
                           style={{
                             backgroundColor: `color-mix(in srgb, ${accentColor} 8%, rgba(247,244,238,0.95))`,
                             borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                             color: accentColor
                           }}
                      >
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                        <span className="text-[12px] font-[900] uppercase tracking-widest leading-none mt-0.5">{displayStatus}</span>
                      </div>
                    </div>

                    {/* Lower Right Dynamic Form Element (The "Watermark" Icon) */}
                    <div className="absolute -bottom-8 -right-8 w-40 h-40 opacity-[0.05] group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 pointer-events-none" style={{ color: accentColor }}>
                      <IconComp className="w-full h-full" />
                    </div>

                    {/* Expand Details Signifier */}
                    {!isExpanded && (
                      <div className="mt-auto md:self-end flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Eye className="w-3.5 h-3.5 text-[#1F2A22]" />
                        <span className="text-[10px] uppercase font-[900] tracking-widest text-[#1F2A22]">Expand</span>
                      </div>
                    )}
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
