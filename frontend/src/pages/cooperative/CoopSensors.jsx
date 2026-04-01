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
      const response = await fetch(`/api/cooperative/${coopId}/sensors`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      setSensors(Array.isArray(data) ? data : []);
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
    <div className="space-y-6">
      {/* Epic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-900 to-emerald-900 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTMwIDMwbDMwLTMwdjYwSDMweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Sensor Network
              </h1>
              <p className="text-cyan-200/80 text-sm mt-1">
                IoT monitoring • {sensors.length} devices deployed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={loadSensors}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-3 gap-4 mt-8">
          {[
            { label: "Total", value: stats.total, icon: Cpu, color: "from-slate-500/50 to-slate-600/50" },
            { label: "Normal", value: stats.normal, icon: Zap, color: "from-emerald-500/50 to-emerald-600/50" },
            { label: "Warning", value: stats.warning, icon: AlertTriangle, color: "from-rose-500/50 to-orange-500/50" },
          ].map((stat, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/10 p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-white/30" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 shadow-xl shadow-slate-200/50">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search sensors..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
          {[
            { value: "all", label: "All", dot: "bg-slate-500", count: stats.total },
            { value: "normal", label: "Normal", dot: "bg-emerald-500", count: stats.normal },
            { value: "warning", label: "Warning", dot: "bg-rose-500", count: stats.warning },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === opt.value ? "bg-white text-slate-800 shadow-lg" : "text-slate-500 hover:text-slate-700"
              } ${opt.count === 0 && opt.value !== "all" ? "opacity-50" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.dot} ${opt.value === "warning" && opt.count > 0 ? "animate-pulse" : ""}`}></span>
              {opt.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === opt.value ? "bg-slate-200" : "bg-slate-200/50"
              }`}>{opt.count}</span>
            </button>
          ))}
        </div>

        <span className="ml-auto text-sm text-slate-500 flex-shrink-0">
          <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">{filteredSensors.length}</span> sensors
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
            <Radio className="w-6 h-6 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-bold mt-6">Scanning sensor network...</p>
        </div>
      ) : filteredSensors.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Cpu className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800">No Sensors Found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSensors.map(sensor => {
            const sensorId = sensor.id_capteur || sensor.id || sensor.reference_serie || "Unknown";
            const sensorLocation = sensor.zone_name || sensor.location || sensor.nom_zone || "Unknown";
            const sensorStatus = sensor.statut || sensor.status || "ACTIF";
            const statusConfig = getStatusConfig(sensorStatus);
            const temp = sensor.temperature || sensor.latest_reading?.temperature_c || 0;
            const humidity = sensor.humidity || sensor.latest_reading?.humidite_pct || 0;
            const windSpeed = sensor.windSpeed || sensor.latest_reading?.wind_speed || 0;
            const signalQuality = sensor.signalQuality || 100;

            return (
              <div 
                key={sensorId}
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${statusConfig.light} flex items-center justify-center`}>
                        <Cpu className={`w-5 h-5 ${statusConfig.text}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{sensorLocation}</h3>
                        <p className="text-slate-400 text-[10px] font-mono">{sensorId}</p>
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`}></div>
                  </div>

                  {/* Temperature - Big Display with Shadow */}
                  <div className={`rounded-2xl p-4 mb-3 text-center shadow-lg ${
                    temp > 45 ? "bg-gradient-to-br from-rose-100 to-orange-100 shadow-rose-200/50" : 
                    temp > 35 ? "bg-gradient-to-br from-orange-100 to-amber-100 shadow-orange-200/50" : 
                    "bg-gradient-to-br from-emerald-100 to-cyan-100 shadow-emerald-200/50"
                  }`}>
                    <div className="flex items-center justify-center gap-1">
                      <Thermometer className={`w-6 h-6 ${temp > 45 ? "text-rose-500" : temp > 35 ? "text-orange-500" : "text-emerald-500"}`} />
                      <span className={`text-4xl font-black ${temp > 45 ? "text-rose-600" : temp > 35 ? "text-orange-600" : "text-emerald-600"}`}>
                        {Math.round(temp)}°
                      </span>
                    </div>
                  </div>

                  {/* Other Readings */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-700">{humidity}%</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Humidity</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Wind className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                      <p className="text-lg font-black text-slate-700">{windSpeed}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Wind km/h</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Signal className="w-3.5 h-3.5" />
                      <span>{signalQuality}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{sensorLocation}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-6 ${
              modal.type === "view" ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
              modal.type === "restart" ? "bg-gradient-to-r from-amber-500 to-orange-500" :
              "bg-gradient-to-r from-emerald-500 to-cyan-500"
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  {modal.type === "view" && <><Eye className="w-6 h-6" /> Sensor Details</>}
                  {modal.type === "restart" && <><RefreshCw className="w-6 h-6" /> Restart Sensor</>}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modal.type === "view" && modal.sensor && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className={`w-14 h-14 rounded-xl ${getStatusConfig(modal.sensor.status || modal.sensor.statut).light} flex items-center justify-center`}>
                      <Cpu className={`w-7 h-7 ${getStatusConfig(modal.sensor.status || modal.sensor.statut).text}`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 font-mono">{modal.sensor.id_capteur || modal.sensor.id}</h4>
                      <p className="text-slate-500 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {modal.sensor.zone_name || modal.sensor.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Status</p>
                      <p className={`font-bold ${getStatusConfig(modal.sensor.status || modal.sensor.statut).text}`}>{getStatusConfig(modal.sensor.status || modal.sensor.statut).label}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Signal</p>
                      <p className="font-bold text-slate-800">{modal.sensor.connectivity || modal.sensor.signalQuality || "N/A"}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-orange-500 mb-1">Temperature</p>
                      <p className="font-bold text-orange-600">{modal.sensor.temperature || modal.sensor.latest_reading?.temperature_c || "N/A"}°C</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Humidity</p>
                      <p className="font-bold text-blue-600">{modal.sensor.humidity || modal.sensor.latest_reading?.humidite_pct || "N/A"}%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl col-span-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Wind Speed</p>
                      <p className="font-bold text-slate-700">{modal.sensor.windSpeed || 0} km/h</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">GPS Coordinates</p>
                    <p className="font-mono text-sm text-slate-800">{modal.sensor.coordinates || `${modal.sensor.latitude || "N/A"}, ${modal.sensor.longitude || "N/A"}`}</p>
                  </div>
                </div>
              )}

              {modal.type === "restart" && modal.sensor && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-10 h-10 text-amber-600" />
                  </div>
                  <p className="text-slate-600 mb-2">Send remote restart signal to:</p>
                  <p className="text-xl font-black text-slate-900 font-mono mb-4">{modal.sensor.id_capteur || modal.sensor.id}</p>
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 text-left flex gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    Sensor will be offline for 30-60 seconds during reboot.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              {modal.type === "restart" && (
                <button onClick={handleConfirmAction} className="px-6 py-2.5 font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-lg shadow-amber-200 transition-all">
                  Restart Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoopSensors;
