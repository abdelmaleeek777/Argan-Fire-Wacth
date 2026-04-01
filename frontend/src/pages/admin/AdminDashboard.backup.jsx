import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Building2, ShieldCheck, Cpu, Users, AlertTriangle, Loader2, Activity,
  TrendingUp, Map as MapIcon, Thermometer, Droplets, Wind, MapPin
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line, ComposedChart
} from 'recharts';

const ADMIN_API = "/api/admin";
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertsTrend, setAlertsTrend] = useState([]);
  const [zonesRisk, setZonesRisk] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [humidityWindData, setHumidityWindData] = useState([]);
  const [alertsBySeverity, setAlertsBySeverity] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, alertsRes, zonesRes, tempRes, humidityRes, severityRes] = await Promise.all([
        axios.get(`${ADMIN_API}/stats`, { headers }),
        axios.get(`${ADMIN_API}/charts/alerts-trend`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/zones-risk`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/temperature-avg`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/humidity-wind`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/alerts-by-severity`, { headers }).catch(() => ({ data: [] })),
      ]);
      
      setStats(statsRes.data);
      setAlertsTrend(alertsRes.data);
      setZonesRisk(zonesRes.data);
      setTemperatureData(tempRes.data);
      setHumidityWindData(humidityRes.data);
      setAlertsBySeverity(severityRes.data);
    } catch (err) {
      console.error("Error fetching data", err);
      setStats({
        totalCooperatives: 0, pendingApprovals: 0, activeSensors: 0, totalOwners: 0, activeAlerts: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Dashboard Analytics...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Coops", value: stats?.totalCooperatives || 0, icon: Building2, color: "emerald" },
    { label: "Pending Approvals", value: stats?.pendingApprovals || 0, icon: ShieldCheck, color: "amber" },
    { label: "Active Sensors", value: stats?.activeSensors || 0, icon: Cpu, color: "blue" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, color: "rose" },
    { label: "Total Users", value: stats?.totalOwners || 0, icon: Users, color: "purple" },
  ];

  const getColorClasses = (color) => {
    return {
      emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
      amber: { bg: "bg-amber-50", text: "text-amber-600" },
      blue: { bg: "bg-blue-50", text: "text-blue-600" },
      rose: { bg: "bg-rose-50", text: "text-rose-600" },
      purple: { bg: "bg-purple-50", text: "text-purple-600" },
    }[color] || { bg: "bg-slate-50", text: "text-slate-600" };
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time charts and metrics across the entire Argan network.</p>
        </div>
        <Link to="/admin/map" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all hover:-translate-y-0.5">
          <MapIcon className="w-4 h-4" /> Open System Map
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const { bg, text } = getColorClasses(card.color);
          
          return (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${bg} ${text} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{card.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Temperature Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                Temperature (24h)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Average and maximum temperature readings</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {temperatureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={temperatureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorMaxTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="°" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}°C`]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="avgTemp" name="Avg Temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                  <Area type="monotone" dataKey="maxTemp" name="Max Temp" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorMaxTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>No temperature data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Humidity & Wind Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                Humidity & Wind (24h)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Environmental conditions over time</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {humidityWindData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={humidityWindData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="km/h" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="humidity" name="Humidity %" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidity)" />
                  <Line yAxisId="right" type="monotone" dataKey="wind" name="Wind km/h" stroke="#64748b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>No humidity/wind data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Zones Risk Index */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Zone Risk Index
              </h3>
              <p className="text-xs text-slate-500 mt-1">Fire risk levels by forest zone</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            {zonesRisk.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zonesRisk} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} angle={-20} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => {
                      if (name === 'risk') return [`${value}/10`, 'Risk Index'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="risk" name="Risk Index" radius={[6, 6, 0, 0]}>
                    {zonesRisk.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.risk > 7 ? '#ef4444' : entry.risk > 5 ? '#f97316' : entry.risk > 3 ? '#eab308' : '#22c55e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>No zone data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts by Severity Pie */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Alerts by Severity
            </h3>
            <p className="text-xs text-slate-500 mt-1">Last 30 days distribution</p>
          </div>
          <div className="h-[240px] w-full">
            {alertsBySeverity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {alertsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-center">
                <div>
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No alerts recorded</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
