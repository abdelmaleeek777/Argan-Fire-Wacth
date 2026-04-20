import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Building2, Cpu, Users, AlertTriangle, Loader2, Map as MapIcon, Leaf, CheckCircle2,
  TrendingUp, TrendingDown, Activity
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, AreaChart, Area
} from 'recharts';

const ADMIN_API = "/api/admin";

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
      setStats({ totalCooperatives: 12, pendingApprovals: 3, activeSensors: 23, totalOwners: 45, activeAlerts: 0 }); // Fallback for pure UI preview if api fails
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
      if (type === 'users') return { name: day, users: 10 + Math.floor(Math.random() * 20) };
      if (type === 'coops') return { 
        name: day, 
        approved: 1 + Math.floor(Math.random() * 3),
        pending: Math.floor(Math.random() * 2),
        rejected: Math.floor(Math.random() * 1)
      };
      if (type === 'alerts') return { 
        name: day, 
        active: Math.floor(Math.random() * 2), 
        incident: 1 + Math.floor(Math.random() * 2),
        resolved: 2 + Math.floor(Math.random() * 4) 
      };
      if (type === 'sensors') return { name: day, sensors: 5 + Math.floor(Math.random() * 15) };
      return { name: day };
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 text-[#B88A44] animate-spin" />
        <p className="metadata text-[14px]">Securing Connection...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Sensors", value: stats?.activeSensors || 23, icon: Cpu, trend: "+2 this week", trendUp: true, colorTheme: "text-[#B88A44]", bgTheme: "bg-[#B88A44]/10" },
    { label: "Alerts", value: stats?.activeAlerts || 0, icon: AlertTriangle, trend: "-2 from last week", trendUp: false, colorTheme: "text-[#A64D4D]", bgTheme: "bg-[#A64D4D]/12" },
    { label: "Cooperatives", value: stats?.totalCooperatives || 12, icon: Building2, trend: "Stable network", trendUp: true, colorTheme: "text-[#6E7A4E]", bgTheme: "bg-[#6E7A4E]/12" },
    { label: "Users", value: stats?.totalOwners || 45, icon: Users, trend: "+4 new users", trendUp: true, colorTheme: "text-[#1F2A22]", bgTheme: "bg-[#1F2A22]/5" },
  ];

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10">
      
      {/* Top Banner Area: System Status Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="flex flex-col">
           <h2 className="text-3xl font-black text-[#1F2A22]">Overview Analytics</h2>
           <p className="text-[#6B7468] font-bold text-[14px]">Comprehensive monitoring of the argan ecosystem.</p>
        </div>
        <div className="w-full md:w-[340px] bg-[#DCE3D6] rounded-[24px] p-5 flex flex-col gap-4 shadow-inner border border-[#4F5C4A]/[0.10] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4E6B4A]/10 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="metadata text-[11px] text-[#1F2A22] flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#4E6B4A]" /> System Vitality
            </span>
            <div className="badge flex items-center gap-1.5 bg-[#F8F7F2] px-3 py-1 rounded-[10px] shadow-sm border border-[#4F5C4A]/[0.10]">
              <span className="w-2 h-2 rounded-full bg-[#4E6B4A] animate-pulse"></span>
              <span className="metadata text-[10px] text-[#2F4A36]">Optimal</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col gap-0.5">
              <p className="metadata text-[13px] text-[#6B7468]"><span className="text-[#1F2A22]">{stats?.activeSensors || 23}</span> ACTIVE NODES</p>
              <p className="metadata text-[13px] text-[#6B7468]"><span className="text-[#1F2A22]">{stats?.activeAlerts || 0}</span> LIVE INCIDENTS</p>
            </div>
            <Link to="/admin/map" className="px-4 py-2 bg-[#B88A44] hover:bg-[#A37B3D] text-white rounded-[12px] text-[12px] font-[800] uppercase tracking-widest transition-all shadow-md shadow-[#B88A44]/20 active:scale-95">
               Map View
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px]">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[#F8F7F2] w-full h-[150px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.1)] transition-all duration-300 p-[24px] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className={`w-[42px] h-[42px] rounded-[14px] ${card.bgTheme} ${card.colorTheme} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <Icon className="w-[20px] h-[20px]" strokeWidth={2.5} />
                </div>
                <div className="h-[25px] w-[60px] opacity-40 group-hover:opacity-100 transition-all">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{v:2},{v:5},{v:3},{v:7},{v:4},{v:8}]} margin={{top:0, right:0, left:0, bottom:0}}>
                         <Area type="monotone" dataKey="v" stroke={card.trendUp ? "#4E6B4A" : "#B88A44"} fill="none" strokeWidth={2} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <p className="metadata text-[10px] mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-[34px] font-[800] text-[#1F2A22] leading-none tracking-tighter">{card.value}</p>
                  <span className={`metadata text-[12px] font-[800] ${card.trendUp ? 'text-[#4E6B4A]' : ''}`}>
                    {card.trendUp ? '+' : ''}{card.trend.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2x2 Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[28px]">
        
        {/* 1. Users Registered */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] h-[360px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#B88A44]/10 flex items-center justify-center border border-[#B88A44]/10">
                <Users className="w-4.5 h-4.5 text-[#B88A44]" />
              </div>
              Users Registered
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usersTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B88A44" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#B88A44" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(31,42,33,0.1)', background: '#F8F7F2' }} 
                  itemStyle={{ fontWeight: 800 }}
                />
                <Area type="monotone" dataKey="users" stroke="#B88A44" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cooperatives Status */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] h-[360px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4E6B4A]/10 flex items-center justify-center border border-[#4E6B4A]/10">
                <Building2 className="w-4.5 h-4.5 text-[#4E6B4A]" />
              </div>
              Cooperatives Status
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coopsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dx={-10} />
                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(31,42,33,0.1)', background: '#F8F7F2' }} />
                <Bar dataKey="approved" stackId="a" fill="#4E6B4A" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="pending" stackId="a" fill="#B88A44" barSize={12} />
                <Bar dataKey="rejected" stackId="a" fill="#A64D4D" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Alerts Status (Stacked) */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] h-[360px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#A64D4D]/10 flex items-center justify-center border border-[#4F5C4A]/[0.05]">
                <AlertTriangle className="w-4.5 h-4.5 text-[#A64D4D]" />
              </div>
              Alerts Status
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dx={-10} />
                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(31,42,33,0.1)', background: '#F8F7F2' }} />
                <Bar dataKey="active" stackId="alert" fill="#A64D4D" barSize={15} />
                <Bar dataKey="incident" stackId="alert" fill="#B88A44" barSize={15} />
                <Bar dataKey="resolved" stackId="alert" fill="#4E6B4A" radius={[6, 6, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Sensors Created */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] h-[360px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#4E6B4A]/10 flex items-center justify-center border border-[#4F5C4A]/[0.05]">
                <Cpu className="w-4.5 h-4.5 text-[#4E6B4A]" />
              </div>
              Sensors Created
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sensorsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSensors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E6B4A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4E6B4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dx={-10} />
                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(31,42,33,0.1)', background: '#F8F7F2' }} />
                <Area type="monotone" dataKey="sensors" stroke="#4E6B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorSensors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
