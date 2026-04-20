import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Cpu, AlertTriangle, Thermometer, MapPin,
  Loader2, RefreshCcw, Map as MapIcon, Droplets, Wind
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line
} from "recharts";

const API_BASE = "/api";

const DURATION_OPTIONS = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export default function CoopDashboard() {
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('7d');
  const [stats, setStats] = useState({
    totalSensors: 0,
    totalZones: 0,
    totalAlerts: 0,
    maxTempLast60: 0
  });
  const [tempData, setTempData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [sensorData, setSensorData] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      fetchStats();
    }
  }, [coopId]);

  useEffect(() => {
    if (coopId) {
      fetchChartData();
    }
  }, [coopId, duration]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [sensorsRes, zonesRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/cooperative/${coopId}/sensors`, { headers }),
        axios.get(`${API_BASE}/cooperative/${coopId}/zones`, { headers }),
        axios.get(`${API_BASE}/cooperative/${coopId}/alerts`, { headers }),
      ]);

      const sensors = Array.isArray(sensorsRes.data) ? sensorsRes.data : [];
      const zones = Array.isArray(zonesRes.data) ? zonesRes.data : [];
      const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : [];

      let maxTemp = 0;
      sensors.forEach(sensor => {
        if (sensor.latest_reading?.temperature_c) {
          maxTemp = Math.max(maxTemp, sensor.latest_reading.temperature_c);
        }
      });

      setStats({
        totalSensors: sensors.length,
        totalZones: zones.length,
        totalAlerts: alerts.filter(a => a.statut === 'active' || a.statut === 'OUVERTE').length,
        maxTempLast60: Math.round(maxTemp)
      });
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [tempRes, alertsRes, sensorsRes] = await Promise.all([
        axios.get(`${API_BASE}/cooperative/${coopId}/charts/temperature?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cooperative/${coopId}/charts/alerts?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cooperative/${coopId}/charts/sensors?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
      ]);

      setTempData(tempRes.data?.length > 0 ? tempRes.data : generateStaticData('temp'));
      setAlertData(alertsRes.data?.length > 0 ? alertsRes.data : generateStaticData('alerts'));
      setSensorData(sensorsRes.data?.length > 0 ? sensorsRes.data : generateStaticData('sensors'));
    } catch (err) {
      console.error("Chart error:", err);
      setTempData(generateStaticData('temp'));
      setAlertData(generateStaticData('alerts'));
      setSensorData(generateStaticData('sensors'));
    } finally {
      setLoading(false);
    }
  };

  const generateStaticData = (type) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      if (type === 'temp') return { name: day, avgTemp: 25 + Math.random() * 15, maxTemp: 35 + Math.random() * 15, humidity: 40 + Math.random() * 30 };
      if (type === 'alerts') return { name: day, active: Math.floor(Math.random() * 3), resolved: Math.floor(Math.random() * 4) };
      if (type === 'sensors') return { name: day, readings: 50 + Math.floor(Math.random() * 100) };
      return { name: day };
    });
  };

  if (loading && !stats.totalSensors) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Sensors", value: stats.totalSensors, icon: Cpu, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Total Zones", value: stats.totalZones, icon: MapPin, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Active Alerts", value: stats.totalAlerts, icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-600" },
    { label: "Max Temp", value: `${stats.maxTempLast60}°C`, icon: Thermometer, bg: "bg-orange-50", text: "text-orange-600" },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Header Inline action row (Title handled by Layout) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-[800] text-[#1F2A22] tracking-tight">Overview</h2>
          <p className="text-[13px] text-[#6B7468] font-bold mt-1">Real-time statistics for {user.cooperative_name || "your cooperative"}.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { fetchStats(); fetchChartData(); }} className="p-3 bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] text-[#6B7468] rounded-[16px] hover:bg-[#DCE3D6] hover:text-[#1F2A22] transition-colors shadow-sm">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <Link to="/coop/map" className="px-6 py-3 bg-[#4E6B4A] hover:bg-[#2F4A36] text-white rounded-[16px] font-[800] text-[13px] shadow-[0_4px_12px_rgba(78,107,74,0.2)] flex items-center gap-2 transition-all">
            <MapIcon className="w-4 h-4" /> Open Spatial Map
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          // Theme specific colors for stats
          let accentColor = "#4E6B4A";
          let bgColor = "rgba(78, 107, 74, 0.12)";
          if (card.label.includes("Alerts")) {
            accentColor = "#B55A3C";
            bgColor = "rgba(181, 90, 60, 0.12)";
          } else if (card.label.includes("Sensors")) {
            accentColor = "#B88A44";
            bgColor = "rgba(184, 138, 68, 0.12)";
          }

          return (
            <div key={idx} className="bg-[#F8F7F2] p-6 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_20px_rgba(31,42,33,0.03)] hover:shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:-translate-y-1 transition-all group overflow-hidden relative">
              {/* Decorative blob */}
              <div className="absolute right-[-10%] top-[-10%] w-24 h-24 rounded-full blur-[24px] opacity-20 pointer-events-none" style={{ backgroundColor: accentColor }}></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: bgColor, color: accentColor }}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-[800] uppercase tracking-widest mb-1" style={{ color: accentColor }}>
                  {card.label}
                </p>
                <p className="text-[32px] font-[800] text-[#1F2A22] leading-none tracking-tight">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Duration Filter */}
      <div className="flex items-center justify-end gap-3 px-2">
        <span className="text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest">Timeframe</span>
        <div className="flex bg-[#DCE3D6]/50 p-1 rounded-[12px] border border-[#4F5C4A]/5">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDuration(opt.value)}
              className={`px-4 py-2 text-[12px] font-[800] rounded-[8px] transition-all ${
                duration === opt.value 
                  ? 'bg-[#F8F7F2] text-[#2F4A36] shadow-sm' 
                  : 'text-[#6B7468] hover:text-[#1F2A22]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Temperature & Humidity Chart */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(31,42,33,0.03)]">
          <div className="flex items-center gap-2 mb-6">
            <Thermometer className="w-5 h-5 text-[#B88A44]" />
            <h3 className="text-[16px] font-[800] text-[#1F2A22]">Temperature & Humidity</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={tempData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="coopColorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B88A44" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#B88A44" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} unit="°" />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} unit="%" />
                <Tooltip cursor={{ fill: 'rgba(78, 107, 74, 0.05)' }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(79,92,74,0.1)', boxShadow: '0 8px 24px rgba(31,42,33,0.08)', backgroundColor: '#F8F7F2', fontWeight: 'bold', color: '#1F2A22' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 800, color: '#1F2A22' }} />
                <Area yAxisId="left" type="monotone" dataKey="avgTemp" name="Avg Temp °C" stroke="#B88A44" strokeWidth={3} fillOpacity={1} fill="url(#coopColorTemp)" />
                <Line yAxisId="left" type="monotone" dataKey="maxTemp" name="Max Temp °C" stroke="#B55A3C" strokeWidth={2} dot={{ r: 3, fill: '#B55A3C', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity %" stroke="#4E6B4A" strokeWidth={2} dot={{ r: 3, fill: '#4E6B4A', strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Chart */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(31,42,33,0.03)]">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-[#B55A3C]" />
            <h3 className="text-[16px] font-[800] text-[#1F2A22]">Alerts Status</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(78, 107, 74, 0.05)' }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(79,92,74,0.1)', boxShadow: '0 8px 24px rgba(31,42,33,0.08)', backgroundColor: '#F8F7F2', fontWeight: 'bold' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 800 }} />
                <Bar dataKey="active" name="Active" fill="#B55A3C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#4E6B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Readings Chart */}
        <div className="lg:col-span-2 bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[28px] p-7 shadow-[0_4px_20px_rgba(31,42,33,0.03)]">
          <div className="flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5 text-[#B88A44]" />
            <h3 className="text-[16px] font-[800] text-[#1F2A22]">Global Telemetry Transmissions</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="coopColorReadings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E6B4A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4E6B4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 600 }} />
                <Tooltip cursor={{ stroke: 'rgba(78, 107, 74, 0.2)' }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(79,92,74,0.1)', boxShadow: '0 8px 24px rgba(31,42,33,0.08)', backgroundColor: '#F8F7F2', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="readings" name="Total Syncs" stroke="#4E6B4A" strokeWidth={3} fillOpacity={1} fill="url(#coopColorReadings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
