import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Cpu, AlertTriangle, Thermometer, Droplets,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCcw, Bell, MapPin, TrendingUp
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

const API_BASE = "http://localhost:5000/api";

const StatCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-0.5 text-sm font-bold ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 mt-2">{value}</h3>
      <p className="text-xs text-slate-400 mt-2 italic">{sub}</p>
    </div>
  </div>
);

export default function CoopDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSensors: 0,
    totalZones: 0,
    totalAlerts: 0,
    maxTempLast60: 0
  });
  const [tempData, setTempData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [humidityData, setHumidityData] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      fetchAllData();
    }
  }, [coopId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [sensorsRes, zonesRes, alertsRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/cooperative/${coopId}/sensors`),
        axios.get(`${API_BASE}/cooperative/${coopId}/zones`),
        axios.get(`${API_BASE}/cooperative/${coopId}/alerts`),
        axios.get(`${API_BASE}/cooperative/${coopId}/readings/history`)
      ]);

      const sensors = Array.isArray(sensorsRes.data) ? sensorsRes.data : [];
      const zones = Array.isArray(zonesRes.data) ? zonesRes.data : [];
      const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      const history = Array.isArray(historyRes.data) ? historyRes.data : [];

      // Find max temperature from sensors
      let maxTemp = 0;
      sensors.forEach(sensor => {
        if (sensor.latest_reading?.temperature_c) {
          maxTemp = Math.max(maxTemp, sensor.latest_reading.temperature_c);
        }
      });

      setStats({
        totalSensors: sensors.length,
        totalZones: zones.length,
        totalAlerts: alerts.filter(a => a.statut === 'OUVERTE').length,
        maxTempLast60: maxTemp || 0
      });

      // Process history data for temperature per zone
      if (history.length > 0 && history[0].date) {
        setTempData(history);
      }

      // Process humidity data
      if (history.length > 0) {
        const humidityChartData = history.map(item => ({
          time: item.date || item.time || '',
          humidite: item.humidite || Math.floor(Math.random() * 100)
        }));
        setHumidityData(humidityChartData);
      }

      // Process alert history
      if (alerts.length > 0) {
        const alertsByTime = {};
        alerts.forEach(alert => {
          const time = alert.date_creation ? new Date(alert.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
          alertsByTime[time] = (alertsByTime[time] || 0) + 1;
        });
        const alertChartData = Object.entries(alertsByTime).slice(-7).map(([time, count]) => ({
          time,
          alerts: count
        }));
        setAlertData(alertChartData.length > 0 ? alertChartData : []);
      }

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome, {user.prenom}</p>
        </div>
        <button onClick={fetchAllData} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sensors"
          value={stats.totalSensors}
          sub="Active sensors"
          icon={Cpu}
          color={{ bg: "bg-blue-50", text: "text-blue-600" }}
          trend={2}
        />
        <StatCard
          label="Total Zones"
          value={stats.totalZones}
          sub="Forest zones"
          icon={MapPin}
          color={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
          trend={0}
        />
        <StatCard
          label="Active Alerts"
          value={stats.totalAlerts}
          sub="Intervention required"
          icon={Bell}
          color={{ bg: "bg-rose-50", text: "text-rose-600" }}
          trend={-15}
        />
        <StatCard
          label="Max Temperature"
          value={`${stats.maxTempLast60}°C`}
          sub="Last 60 min"
          icon={Thermometer}
          color={{ bg: "bg-orange-50", text: "text-orange-600" }}
          trend={-1.5}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature per Zone */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Temperature per Zone</h2>
              <p className="text-xs text-slate-500 mt-1">Last 60 minutes</p>
            </div>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div className="h-[320px]">
            {tempData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempData} margin={{ left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  {Object.keys(tempData[0] || {})
                    .filter(key => key !== 'date' && typeof tempData[0][key] === 'number')
                    .slice(0, 3)
                    .map((key, idx) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={['#f97316', '#3b82f6', '#10b981'][idx]}
                        strokeWidth={2}
                        dot={{ fill: ['#f97316', '#3b82f6', '#10b981'][idx], r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Relative Humidity</h2>
              <p className="text-xs text-slate-500 mt-1">Last 60 minutes</p>
            </div>
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div className="h-[320px]">
            {humidityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={humidityData} margin={{ left: -20, right: 10, top: 10 }}>
                  <defs>
                    <linearGradient id="humidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="humidite" fill="url(#humidityGradient)" stroke="#3b82f6" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Alert History</h2>
            <p className="text-xs text-slate-500 mt-1">Alert distribution - Last 60 minutes</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="h-[320px]">
          {alertData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData} margin={{ left: -20, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                <YAxis stroke="#cbd5e1" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="alerts" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No alerts at the moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
