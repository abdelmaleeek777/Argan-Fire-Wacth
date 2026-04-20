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
  Wind,
} from "lucide-react";

function AdminSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    sensor: null,
  });

  useEffect(() => {
    loadSensors();
  }, []);

  const loadSensors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sensors");
      const data = await response.json();
      setSensors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading sensors:", error);
      setSensors([]);
    }
    setLoading(false);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "ACTIF":
        return {
          bg: "bg-[#4E6B4A]",
          light: "bg-[#4E6B4A]/10",
          text: "text-[#4E6B4A]",
          border: "border-[#4E6B4A]/20",
          label: "Active",
          dot: "bg-[#4E6B4A] animate-pulse",
        };
      case "EN_MAINTENANCE":
        return {
          bg: "bg-[#B88A44]",
          light: "bg-[#B88A44]/12",
          text: "text-[#B88A44]",
          border: "border-[#B88A44]/20",
          label: "Maintenance",
          dot: "bg-[#B88A44]",
        };
      case "INACTIF":
        return {
          bg: "bg-[#6B7468]",
          light: "bg-[#DCE3D6]",
          text: "text-[#6B7468]",
          border: "border-[#4F5C4A]/0.10",
          label: "Inactive",
          dot: "bg-[#6B7468]",
        };
      default:
        return {
          bg: "bg-[#6B7468]",
          light: "bg-[#DCE3D6]",
          text: "text-[#6B7468]",
          border: "border-[#4F5C4A]/0.10",
          label: status || "Unknown",
          dot: "bg-[#6B7468]",
        };
    }
  };

  const handleConfirmAction = async () => {
    if (modal.type === "restart" && modal.sensor) {
      setSensors(
        sensors.map((s) =>
          s.id === modal.sensor.id
            ? {
                ...s,
                status: "ACTIF",
                connectivity: "excellent",
                battery: 100,
                lastPing: "Just now",
              }
            : s,
        ),
      );
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
    const matchesSearch =
      String(s.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.cooperative?.toLowerCase().includes(searchQuery.toLowerCase());

    const temp = s.temperature || 0;
    const isWarning = temp > 45;

    let matchesStatus = true;
    if (statusFilter === "warning") matchesStatus = isWarning;
    else if (statusFilter === "normal") matchesStatus = !isWarning;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: sensors.length,
    normal: sensors.filter((s) => (s.temperature || 0) <= 45).length,
    warning: sensors.filter((s) => (s.temperature || 0) > 45).length,
  };

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10">
      {/* Cinematic Header */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] p-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Radio className="w-7 h-7 text-[#4E6B4A]" />
            </div>
            <div>
              <h1 className="text-[24px] font-[800] text-[#1F2A22] tracking-tight">
                Sensor Network REDESIGNED
              </h1>
              <p className="text-[14px] text-[#6B7468] mt-1 font-medium">
                IoT monitoring &middot; {sensors.length} devices deployed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadSensors}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] text-[#1F2A22] rounded-[14px] hover:bg-[#DCE3D6] hover:shadow-sm transition-all text-[13px] font-[800]"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#4E6B4A] ${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </button>
          </div>
        </div>

        {/* Minimal Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-[32px]">
          {[
            {
              label: "Total Deployed",
              value: stats.total,
              color: "text-[#1F2A22]",
              bg: "bg-[#DCE3D6]",
            },
            {
              label: "Normal Operation",
              value: stats.normal,
              color: "text-[#4E6B4A]",
              bg: "bg-[#4E6B4A]/10",
            },
            {
              label: "High Temp Warning",
              value: stats.warning,
              color: "text-[#B88A44]",
              bg: "bg-[#B88A44]/12",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`rounded-[16px] border border-[#4F5C4A]/[0.05] p-4 ${stat.bg}`}
            >
              <p className="text-[11px] font-[800] uppercase tracking-widest text-[#6B7468] font-bold">
                {stat.label}
              </p>
              <p
                className={`text-[28px] font-[800] mt-1 leading-none ${stat.color}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F8F7F2] p-4 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.02)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7468] w-4 h-4" />
          <input
            type="text"
            placeholder="Search by ID, Location..."
            className="w-full pl-10 pr-4 py-2 bg-[#DCE3D6] border-0 rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#4E6B4A] transition-all text-[13px] font-bold text-[#1F2A22] placeholder:text-[#6B7468] h-[40px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#6B7468] uppercase font-[800] tracking-widest">
            Status
          </span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[12px]">
            {[
              { value: "all", label: "All", count: stats.total },
              { value: "normal", label: "Normal", count: stats.normal },
              { value: "warning", label: "Warning", count: stats.warning },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 text-[12px] font-[700] rounded-[8px] transition-all flex items-center gap-2 ${
                  statusFilter === opt.value
                    ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm shadow-[#4F5C4A]/10"
                    : "text-[#6B7468] hover:text-[#1F2A22]"
                }`}
              >
                {opt.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-[800] ${
                    statusFilter === opt.value
                      ? "bg-[#DCE3D6] text-[#6B7468]"
                      : "bg-[#4E6B4A]/12 text-[#4E6B4A]"
                  }`}
                >
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/0.10 p-[64px] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin mb-4" />
          <p className="text-[#6B7468] font-[700]">
            Scanning sensor network...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]">
          {filteredSensors.map((sensor) => {
            const temp = sensor.temperature || 0;
            const humidity = sensor.humidity || 0;
            const windSpeed = sensor.windSpeed || 0;
            const signalQuality = sensor.signalQuality || 100;
            const sensorStatus = sensor.status || "ACTIF";
            const sensorId = sensor.id;
            const sensorTitle =
              sensor.cooperative || sensor.zoneName || "Unknown Coop";

            // Determine accent color based on temperature
            let accentColor = "#4E6B4A"; // Argan Green
            let bgColor = "rgba(78,107,74,0.03)";

            if (temp > 45) {
              accentColor = "#B55A3C"; // Alert Rose
              bgColor = "rgba(181,90,60,0.03)";
            } else if (temp > 35) {
              accentColor = "#B88A44"; // Argan Gold
              bgColor = "rgba(184,138,68,0.03)";
            } else if (sensorStatus === "INACTIF") {
              accentColor = "#6B7468";
              bgColor = "rgba(107,116,104,0.03)";
            }

            return (
              <div
                key={sensorId}
                className="group relative bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_20px_rgba(31,42,33,0.03)] hover:shadow-[0_8px_32px_rgba(31,42,33,0.08)] transition-all duration-500 overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                {/* Decorative Accent Blob */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-125"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[40px] h-[40px] rounded-[14px] flex items-center justify-center border shadow-sm backdrop-blur-md"
                        style={{
                          backgroundColor: `${accentColor}1A`,
                          borderColor: `${accentColor}30`,
                        }}
                      >
                        <Cpu
                          className="w-5 h-5"
                          style={{ color: accentColor }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-[800] text-[#1F2A22] text-[14px] leading-tight group-hover:text-[#2F4A36] transition-colors truncate">
                          {sensorTitle}
                        </h3>
                        <p className="text-[#6B7468] text-[10px] font-mono font-bold mt-0.5 tracking-wider uppercase">
                          {sensorId}
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`,
                      }}
                    ></div>
                  </div>

                  {/* Temperature Display */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-start">
                      <span
                        className="text-[48px] font-[900] tracking-tighter leading-none"
                        style={{ color: accentColor }}
                      >
                        {Math.round(temp)}
                      </span>
                      <span
                        className="text-[20px] font-[800] mt-1 ml-0.5"
                        style={{ color: accentColor }}
                      >
                        °C
                      </span>
                    </div>
                  </div>

                  {/* Other Readings */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#ECE9E1]/60 rounded-[16px] p-3 text-center border border-[#4F5C4A]/5">
                      <Droplets className="w-3.5 h-3.5 text-[#4E6B4A] mx-auto mb-1 opacity-70" />
                      <p className="text-[16px] font-[900] text-[#1F2A22]">
                        {humidity}%
                      </p>
                      <p className="text-[9px] text-[#6B7468] font-[800] uppercase tracking-wider">
                        Humidity
                      </p>
                    </div>
                    <div className="bg-[#ECE9E1]/60 rounded-[16px] p-3 text-center border border-[#4F5C4A]/5">
                      <Wind className="w-3.5 h-3.5 text-[#4E6B4A] mx-auto mb-1 opacity-70" />
                      <p className="text-[16px] font-[900] text-[#1F2A22]">
                        {windSpeed}
                      </p>
                      <p className="text-[9px] text-[#6B7468] font-[800] uppercase tracking-wider">
                        Wind km/h
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#4F5C4A]/10">
                    <div className="flex items-center gap-1.5 text-[#6B7468] text-[11px] font-bold">
                      <Signal className="w-3.5 h-3.5 text-[#4E6B4A]" />
                      <span>{signalQuality}%</span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[#6B7468] text-[11px] font-bold max-w-[100px] truncate"
                      style={{ color: accentColor }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{sensor.location}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A22]/30 backdrop-blur-md p-4">
          <div className="bg-[#F8F7F2] rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-[#4F5C4A]/0.10">
            <div className="p-6 border-b border-[#4F5C4A]/0.05 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#1F2A22]">
                Sensor Details
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-[#DCE3D6] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7468]" />
              </button>
            </div>
            <div className="p-6">
              {modal.sensor && (
                <div className="space-y-4">
                  {/* Modal content similar to detail layout */}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSensors;
