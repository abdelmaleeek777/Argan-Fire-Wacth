import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Building2, Cpu, Users, AlertTriangle, Loader2, Map as MapIcon
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, AreaChart, Area
} from 'recharts';

const ADMIN_API = "/api/admin";

const DURATION_OPTIONS = [
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('7d');
  const [usersTrend, setUsersTrend] = useState([]);
  const [coopsTrend, setCoopsTrend] = useState([]);
  const [alertsTrend, setAlertsTrend] = useState([]);
  const [sensorsTrend, setSensorsTrend] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [duration]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const statsRes = await axios.get(`${ADMIN_API}/stats`, { headers });
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching stats", err);
      setStats({ totalCooperatives: 0, pendingApprovals: 0, activeSensors: 0, totalOwners: 0, activeAlerts: 0 });
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, coopsRes, alertsRes, sensorsRes] = await Promise.all([
        axios.get(`${ADMIN_API}/charts/users-trend?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/coops-trend?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/alerts-status-trend?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${ADMIN_API}/charts/sensors-trend?duration=${duration}`, { headers }).catch(() => ({ data: [] })),
      ]);
      
      setUsersTrend(usersRes.data?.length > 0 ? usersRes.data : generateStaticData('users'));
      setCoopsTrend(coopsRes.data?.length > 0 ? coopsRes.data : generateStaticData('coops'));
      setAlertsTrend(alertsRes.data?.length > 0 ? alertsRes.data : generateStaticData('alerts'));
      setSensorsTrend(sensorsRes.data?.length > 0 ? sensorsRes.data : generateStaticData('sensors'));
    } catch (err) {
      console.error("Error fetching chart data", err);
    } finally {
      setLoading(false);
    }
  };

  const generateStaticData = (type) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => {
      if (type === 'users') return { name: day, users: Math.floor(Math.random() * 5) };
      if (type === 'coops') return { name: day, approved: Math.floor(Math.random() * 3), pending: Math.floor(Math.random() * 2), rejected: Math.floor(Math.random() * 1) };
      if (type === 'alerts') return { name: day, active: Math.floor(Math.random() * 4), inProgress: Math.floor(Math.random() * 3), resolved: Math.floor(Math.random() * 5) };
      if (type === 'sensors') return { name: day, sensors: Math.floor(Math.random() * 4) };
      return { name: day };
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Coops", value: stats?.totalCooperatives || 0, icon: Building2, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Active Sensors", value: stats?.activeSensors || 0, icon: Cpu, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Active Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-600" },
    { label: "Total Users", value: stats?.totalOwners || 0, icon: Users, bg: "bg-purple-50", text: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of the Argan Fire Watch network.</p>
        </div>
        <Link to="/admin/map" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all hover:-translate-y-0.5">
          <MapIcon className="w-4 h-4" /> Open System Map
        </Link>
      </div>

      {/* Stats Cards - 4 at top */}
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
        
        {/* Users Registered Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800">Users Registered</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usersTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cooperatives Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800">Cooperatives Status</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coopsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Status Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Alerts Status</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                <Bar dataKey="active" name="Active" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensors Created Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800">Sensors Created</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSensors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="sensors" name="Sensors" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSensors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
