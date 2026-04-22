import React, { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  Thermometer,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  MapPin,
  Signal,
  Zap,
  Droplets,
  Radio,
  Wind
} from "lucide-react";

function CoopSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({ isOpen: false, type: null, sensor: null });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      loadSensors();
    }
  }, [coopId]);

  const loadSensors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const [sensorsRes, zonesRes] = await Promise.all([
        fetch(`/api/cooperative/${coopId}/sensors`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(`/api/cooperative/${coopId}/zones`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      ]);

      const sensorsData = await sensorsRes.json();
      const zonesData = await zonesRes.json();
      
      const sensorsList = Array.isArray(sensorsData) ? sensorsData : [];
      const zonesList = Array.isArray(zonesData) ? zonesData : [];

      // Map id_zone to nom_zone for each sensor
      const mappedSensors = sensorsList.map(sensor => {
        const zone = zonesList.find(z => z.id_zone === sensor.id_zone);
        return {
          ...sensor,
          zone_name: zone ? zone.nom_zone : "Unknown Region"
        };
      });

      setSensors(mappedSensors);
    } catch (error) {
      console.error("Error loading sensors:", error);
      setSensors([]);
    }
    setLoading(false);
  };

  // Status config based on DB values: ACTIF, INACTIF, EN_MAINTENANCE
  const getStatusConfig = (status) => {
    switch (status) {
      case "ACTIF": return { 
        bg: "bg-emerald-500", 
        light: "bg-emerald-100", 
        text: "text-emerald-700",
        border: "border-emerald-200",
        glow: "shadow-emerald-200",
        label: "Active",
        dot: "bg-emerald-400 animate-pulse"
      };
      case "EN_MAINTENANCE": return { 
        bg: "bg-amber-500", 
        light: "bg-amber-100", 
        text: "text-amber-700",
        border: "border-amber-200",
        glow: "shadow-amber-200",
        label: "Maintenance",
        dot: "bg-amber-400"
      };
      case "INACTIF": return { 
        bg: "bg-slate-400", 
        light: "bg-slate-100", 
        text: "text-slate-600",
        border: "border-slate-200",
        glow: "shadow-slate-200",
        label: "Inactive",
        dot: "bg-slate-400"
      };
      default: return { 
        bg: "bg-slate-500", 
        light: "bg-slate-100", 
        text: "text-slate-700",
        border: "border-slate-200",
        glow: "shadow-slate-200",
        label: status || "Unknown",
        dot: "bg-slate-400"
      };
    }
  };

  const handleConfirmAction = async () => {
    if (modal.type === "restart" && modal.sensor) {
      setSensors(sensors.map(s =>
        s.id === modal.sensor.id
          ? { ...s, status: "ACTIF", connectivity: "excellent", lastPing: "Just now" }
          : s
      ));
    }
    closeModal();
  };

  const openModal = (type, sensor = null) => {
    setModal({ isOpen: true, type, sensor: sensor || {} });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, sensor: null });
  };

  const filteredSensors = sensors.filter((s) => {
    const sensorId = s.id_capteur || s.id || s.reference_serie || "";
    const sensorLocation = s.zone_name || s.location || s.nom_zone || "";
    
    const matchesSearch =
      String(sensorId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(sensorLocation).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Get temperature from latest_reading or direct field
    const temp = s.latest_reading?.temperature_c || s.temperature_c || s.temperature || 0;
    const isWarning = temp > 45;
    
    let matchesStatus = true;
    if (statusFilter === "all") {
      matchesStatus = true;
    } else if (statusFilter === "warning") {
      matchesStatus = isWarning;
    } else if (statusFilter === "normal") {
      matchesStatus = !isWarning;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Stats based on temperature - check latest_reading first
  const stats = {
    total: sensors.length,
    normal: sensors.filter(s => {
      const temp = s.latest_reading?.temperature_c || s.temperature_c || s.temperature || 0;
      return temp <= 45;
    }).length,
    warning: sensors.filter(s => {
      const temp = s.latest_reading?.temperature_c || s.temperature_c || s.temperature || 0;
      return temp > 45;
    }).length,
  };

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10 animate-in fade-in duration-700">
      
      {/* Calm & Premium Header Card */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] p-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Radio className="w-7 h-7 text-[#4E6B4A]" />
            </div>
            <div>
              <h1 className="page-title text-[#1F2A22]">Sensor Network</h1>
              <p className="secondary-text text-[14px] mt-1 text-[#6B7468]">IoT territorial monitoring • {sensors.length} devices deployed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={loadSensors}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] text-[#1F2A22] rounded-[14px] hover:bg-[#DCE3D6] hover:shadow-sm transition-all text-[13px] font-[800]"
            >
              <RefreshCw className={`w-4 h-4 text-[#4E6B4A] ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Minimal Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-[32px]">
          {[
            { label: "Total Deployed", value: stats.total, color: "text-[#1F2A22]", bg: "bg-[#DCE3D6]", icon: Cpu },
            { label: "Operating Normally", value: stats.normal, color: "text-[#4E6B4A]", bg: "bg-[#4E6B4A]/15", icon: Zap },
            { label: "Warning State", value: stats.warning, color: "text-[#B88A44]", bg: "bg-[#B88A44]/15", icon: AlertTriangle },
          ].map((stat, i) => (
            <div key={i} className={`rounded-[16px] border border-[#4F5C4A]/[0.05] p-5 ${stat.bg} flex justify-between items-center`}>
              <div>
                <p className="metadata text-[11px] font-[800] uppercase tracking-widest text-[#6B7468]">{stat.label}</p>
                <p className={`text-[32px] font-[800] mt-1 leading-none tracking-tight ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 opacity-40 ${stat.color}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F8F7F2] p-4 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.02)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7468] w-4 h-4" />
          <input
            type="text"
            placeholder="Search sensors or zones..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F4] border border-[#4F5C4A]/[0.10] rounded-[16px] text-[13px] font-[700] text-[#1F2A22] focus:outline-none focus:ring-2 focus:ring-[#4E6B4A]/30 focus:border-[#4E6B4A] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-px h-6 bg-[#4F5C4A]/20 hidden sm:block"></div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[16px] flex-shrink-0 border border-[#4F5C4A]/[0.05]">
          {[
            { value: "all", label: "All", count: stats.total },
            { value: "normal", label: "Normal", count: stats.normal },
            { value: "warning", label: "Warning", count: stats.warning },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 text-[12px] font-[800] tracking-wide rounded-[12px] transition-all flex items-center gap-2 ${
                statusFilter === opt.value ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10" : "text-[#6B7468] hover:text-[#1F2A22]"
              } ${opt.count === 0 && opt.value !== "all" ? "opacity-50" : ""}`}
            >
              {opt.label}
              <span className={`text-[10px] px-2 py-0.5 rounded-[8px] ${
                statusFilter === opt.value ? "bg-[#DCE3D6] text-[#4E6B4A]" : "bg-[#4F5C4A]/10 text-[#6B7468]"
              }`}>{opt.count}</span>
            </button>
          ))}
        </div>

        <span className="ml-auto text-[13px] text-[#6B7468] flex-shrink-0 font-[700]">
          Showing <span className="font-[800] text-[#1F2A22]">{filteredSensors.length}</span> devices
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin mb-4" />
          <p className="text-[#6B7468] font-[700]">Scanning sensor network...</p>
        </div>
      ) : filteredSensors.length === 0 ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] p-[64px] flex flex-col items-center justify-center shadow-sm">
          <div className="w-[64px] h-[64px] bg-[#DCE3D6] rounded-[24px] flex items-center justify-center mb-6 border border-[#4F5C4A]/[0.10]">
            <Cpu className="w-8 h-8 text-[#4E6B4A]" />
          </div>
          <h3 className="section-title text-[#1F2A22] text-[20px] font-[800]">No Sensors Found</h3>
          <p className="text-[#6B7468] mt-1 text-[14px] font-medium">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.map(sensor => {
            const sensorId = sensor.id_capteur || sensor.id || sensor.reference_serie || "Unknown";
            const sensorLocation = sensor.zone_name || sensor.location || sensor.nom_zone || "Unknown";
            const sensorStatus = sensor.statut || sensor.status || "ACTIF";
            const temp = sensor.temperature || sensor.latest_reading?.temperature_c || 0;
            const humidity = sensor.humidity || sensor.latest_reading?.humidite_pct || 0;
            const windSpeed = sensor.windSpeed || sensor.latest_reading?.wind_speed || 0;
            const signalQuality = sensor.signalQuality || 100;
            
            // Determine styling based on temp
            let accentColor = "#4E6B4A";
            let bgColor = "#F8F7F2";
            if (temp > 45) { accentColor = "#B55A3C"; bgColor = "rgba(181,90,60,0.03)" }
            else if (temp > 35) { accentColor = "#B88A44"; bgColor = "rgba(184,138,68,0.03)" }

            return (
              <div 
                key={sensorId}
                className="group relative bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_20px_rgba(31,42,33,0.03)] hover:shadow-[0_8px_32px_rgba(31,42,33,0.08)] transition-all duration-500 overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                {/* Decorative Accent Ring */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-125"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-[40px] h-[40px] rounded-[14px] flex items-center justify-center border shadow-sm backdrop-blur-md" 
                           style={{ backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}30` }}>
                        <Cpu className="w-5 h-5" style={{ color: accentColor }} />
                      </div>
                      <div>
                        <h3 className="font-[800] text-[#1F2A22] text-[15px] leading-tight group-hover:text-[#2F4A36] transition-colors">{sensorLocation}</h3>
                        <p className="text-[#6B7468] text-[10px] font-mono font-bold mt-0.5 tracking-wider uppercase">{sensorId}</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}></div>
                  </div>

                  {/* Temperature Display */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-start">
                      <span className="text-[48px] font-[900] tracking-tighter leading-none" style={{ color: accentColor }}>
                        {Math.round(temp)}
                      </span>
                      <span className="text-[20px] font-[800] mt-1 ml-0.5" style={{ color: accentColor }}>°C</span>
                    </div>
                  </div>

                  {/* Other Readings */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#ECE9E1]/60 rounded-[16px] p-3 text-center border border-[#4F5C4A]/5">
                      <Droplets className="w-3.5 h-3.5 text-[#4E6B4A] mx-auto mb-1 opacity-70" />
                      <p className="text-[16px] font-[900] text-[#1F2A22]">{humidity}%</p>
                      <p className="text-[9px] text-[#6B7468] font-[800] uppercase tracking-wider">Humidity</p>
                    </div>
                    <div className="bg-[#ECE9E1]/60 rounded-[16px] p-3 text-center border border-[#4F5C4A]/5">
                      <Wind className="w-3.5 h-3.5 text-[#4E6B4A] mx-auto mb-1 opacity-70" />
                      <p className="text-[16px] font-[900] text-[#1F2A22]">{windSpeed}</p>
                      <p className="text-[9px] text-[#6B7468] font-[800] uppercase tracking-wider">Wind km/h</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#4F5C4A]/10">
                    <div className="flex items-center gap-1.5 text-[#6B7468] text-[11px] font-bold">
                      <Signal className="w-3.5 h-3.5 text-[#4E6B4A]" />
                      <span>{signalQuality}% Signal</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7468] text-[11px] font-bold" style={{ color: accentColor }}>
                      <span className="uppercase tracking-widest text-[9px]">{sensorStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1F2A22]/40 backdrop-blur-md animate-in fade-in duration-300"></div>

          <div className="relative bg-[#FAF8F4] w-full max-w-lg rounded-[32px] shadow-[0_16px_40px_rgba(31,42,33,0.1)] border border-[#4F5C4A]/[0.10] overflow-hidden flex flex-col slide-in-from-bottom-5 animate-in duration-500">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#4F5C4A]/[0.08] flex items-center justify-between bg-[#ECE9E1]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DCE3D6] rounded-[12px] flex items-center justify-center text-[#4E6B4A]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-[800] text-[#1F2A22] leading-none mb-1">Sensor Details</h3>
                  <p className="text-[12px] text-[#6B7468] font-[700] uppercase tracking-wider">{modal.sensor?.id_capteur || modal.sensor?.id}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2.5 bg-[#FAF8F4] hover:bg-[#DCE3D6] text-[#6B7468] hover:text-[#1F2A22] rounded-[12px] transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {modal.sensor && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8F7F2] p-5 rounded-[24px] border border-[#4F5C4A]/10 text-center">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-2">Status</p>
                      <p className="font-[900] text-[16px] text-[#2F4A36] uppercase">{modal.sensor.status || modal.sensor.statut || "ACTIF"}</p>
                    </div>
                    <div className="bg-[#F8F7F2] p-5 rounded-[24px] border border-[#4F5C4A]/10 text-center">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-2">Signal Quality</p>
                      <p className="font-[900] text-[16px] text-[#2F4A36]">{modal.sensor.connectivity || modal.sensor.signalQuality || "N/A"}</p>
                    </div>
                    <div className="bg-[#B88A44]/[0.05] p-5 rounded-[24px] border border-[#B88A44]/20 text-center">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#B88A44] mb-2">Temperature</p>
                      <p className="font-[900] text-[20px] text-[#B88A44]">{modal.sensor.temperature || modal.sensor.latest_reading?.temperature_c || "N/A"}°C</p>
                    </div>
                    <div className="bg-[#4E6B4A]/[0.05] p-5 rounded-[24px] border border-[#4E6B4A]/20 text-center">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#4E6B4A] mb-2">Humidity</p>
                      <p className="font-[900] text-[20px] text-[#4E6B4A]">{modal.sensor.humidity || modal.sensor.latest_reading?.humidite_pct || "N/A"}%</p>
                    </div>
                    <div className="bg-[#F8F7F2] p-5 rounded-[24px] border border-[#4F5C4A]/10 col-span-2 text-center">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-2">Wind Speed</p>
                      <p className="font-[900] text-[16px] text-[#2F4A36]">{modal.sensor.windSpeed || modal.sensor.latest_reading?.wind_speed || 0} km/h</p>
                    </div>
                  </div>

                  <div className="bg-[#F8F7F2] p-5 rounded-[24px] border border-[#4F5C4A]/10 text-center">
                    <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-2 flex items-center justify-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location / Coordinates</p>
                    <p className="font-mono text-[13px] font-[700] text-[#1F2A22]">{modal.sensor.coordinates || `${modal.sensor.latitude || "N/A"}, ${modal.sensor.longitude || "N/A"}`}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#4F5C4A]/[0.08] bg-[#F8F7F2] flex justify-end gap-3">
              <button onClick={closeModal} className="px-6 py-2.5 font-[800] text-[13px] text-[#6B7468] hover:bg-[#DCE3D6] rounded-[16px] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoopSensors;
