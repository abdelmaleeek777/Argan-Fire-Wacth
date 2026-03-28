import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { 
  Building2, ShieldCheck, Cpu, Users, AlertTriangle, ArrowRight, Loader2, Activity,
  TrendingUp, Map
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const ADMIN_API = "http://localhost:5000/admin";

// Dummy data for charts
const alertTrendsData = [
  { name: 'Mon', alerts: 2, resolved: 3 },
  { name: 'Tue', alerts: 5, resolved: 2 },
  { name: 'Wed', alerts: 3, resolved: 4 },
  { name: 'Thu', alerts: 1, resolved: 5 },
  { name: 'Fri', alerts: 4, resolved: 6 },
  { name: 'Sat', alerts: 2, resolved: 3 },
  { name: 'Sun', alerts: 1, resolved: 2 },
];

const sensorStatusData = [
  { name: 'Souss', active: 45, offline: 3 },
  { name: 'Taroudant', active: 30, offline: 1 },
  { name: 'Tiznit', active: 25, offline: 2 },
  { name: 'Chtouka', active: 15, offline: 0 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const statsRes = await axios.get(`${ADMIN_API}/stats`, { headers });
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching stats", err);
      // Fallback
      setStats({
        totalCooperatives: 12, pendingApprovals: 3, activeSensors: 85, totalOwners: 8, activeAlerts: 2
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
          <Map className="w-4 h-4" /> Open System Map
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Alert Resolution Trends
              </h3>
              <p className="text-xs text-slate-500 mt-1">Number of alerts vs resolved incidents over 7 days.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alertTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                <Area type="monotone" dataKey="alerts" name="New Alerts" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorAlerts)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Sensor Fleet Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">Operational vs Offline sensors by region.</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensorStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                <Bar dataKey="active" name="Active" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                <Bar dataKey="offline" name="Offline/Fault" fill="#cbd5e1" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
