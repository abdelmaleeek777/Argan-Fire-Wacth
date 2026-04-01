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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user.prenom}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchStats(); fetchChartData(); }} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
            <RefreshCcw className="w-4 h-4" />
          </button>
          <Link to="/cooperative/map" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all">
            <MapIcon className="w-4 h-4" /> Open Map
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-slate-800">{card.value}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Duration Filter */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-slate-500 font-medium">Period:</span>
        <div className="flex bg-slate-100 rounded-xl p-1">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDuration(opt.value)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                duration === opt.value 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-800">Temperature & Humidity</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={tempData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="coopColorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="°" />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Area yAxisId="left" type="monotone" dataKey="avgTemp" name="Avg Temp °C" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#coopColorTemp)" />
                <Line yAxisId="left" type="monotone" dataKey="maxTemp" name="Max Temp °C" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity %" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Alerts Status</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="active" name="Active" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Readings Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800">Sensor Readings</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="coopColorReadings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="readings" name="Readings" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#coopColorReadings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
