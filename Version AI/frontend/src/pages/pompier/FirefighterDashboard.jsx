import React, { useState, useEffect } from 'react';
import { 
  Bell, Flame, Map as MapIcon, AlertTriangle, 
  Loader2, Activity, Shield, Clock, CheckCircle, Leaf
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import { 
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import AlertNotificationModal from '../../components/pompier/AlertNotificationModal';
import { usePompierState } from '../../hooks/usePompierState';

export default function FirefighterDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { pompierStatus, setPompierStatus, currentMission, takeMission } = usePompierState();
  
  const [stats, setStats] = useState({
    activeAlerts: 0,
    resolvedAlerts: 0,
    totalAlerts: 0
  });
  const [alertsTrend, setAlertsTrend] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAlert, setNewAlert] = useState(null);
  const [lastAlertId, setLastAlertId] = useState(null);

  useEffect(() => {
    fetchData();
    // Poll for new alerts every 15 seconds
    const interval = setInterval(checkNewAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStats, resAlerts] = await Promise.all([
        api.get('/dashboard/pompier/stats'),
        api.get('/dashboard/pompier/alertes-critiques')
      ]);

      // Use stats from backend
      setStats({
        activeAlerts: resStats.data.alertesActives || 0,
        resolvedAlerts: resStats.data.alertesResolues || 0,
        totalAlerts: resStats.data.alertesTotal || 0
      });

      // Generate trend data
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const baseActive = resStats.data.alertesActives || 0;
      setAlertsTrend(days.map((day, i) => ({
        name: day,
        alerts: Math.max(0, baseActive - i + Math.floor(Math.random() * 3)),
        resolved: Math.floor(Math.random() * 4) + 1
      })));

      // Format recent alerts - use cooperative name if zone is unknown
      const alertsData = Array.isArray(resAlerts.data) ? resAlerts.data : [];
      const formattedAlerts = alertsData.slice(0, 5).map(alert => ({
        id_alerte: alert.id_alerte,
        zone: alert.nom_zone || alert.nom_cooperative || 'Zone',
        cooperative: alert.nom_cooperative || '',
        severity: alert.niveau_gravite || 'CRITIQUE',
        temperature: alert.temperature ? Math.round(alert.temperature) : null,
        timeAgo: 'Recently'
      }));
      setRecentAlerts(formattedAlerts);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const checkNewAlerts = async () => {
    // Only check for alerts if pompier is available (not on mission)
    if (pompierStatus !== 'available') return;
    
    try {
      const res = await api.get('/dashboard/pompier/alertes-critiques');
      const alertsData = Array.isArray(res.data) ? res.data : [];
      
      // Filter for open critical alerts only
      const openCriticalAlerts = alertsData.filter(a => 
        a.statut === 'OUVERTE' && 
        (a.niveau_gravite === 'CRITIQUE' || a.niveau_gravite === 'urgence_maximale')
      );
      
      if (openCriticalAlerts.length > 0) {
        const latestAlert = openCriticalAlerts[0];
        // Only show notification for new alerts
        if (latestAlert.id_alerte !== lastAlertId) {
          setNewAlert({
            id: latestAlert.id_alerte,
            id_alerte: latestAlert.id_alerte,
            zone: latestAlert.nom_zone || latestAlert.nom_cooperative || 'Zone',
            cooperative: latestAlert.nom_cooperative || '',
            severity: latestAlert.niveau_gravite,
            lat: latestAlert.lat,
            lng: latestAlert.lng
          });
          setLastAlertId(latestAlert.id_alerte);
        }
      }
    } catch (err) {
      console.log('Alert check failed');
    }
  };

  const handleTakeMission = (alert) => {
    takeMission(alert);
    setNewAlert(null);
    // Update alert status in backend
    api.put(`/incidents/${alert.id_alerte || alert.id}/status`, { statut: "EN_COURS" })
      .catch(err => console.error('Error updating alert status:', err));
  };

  const handleIgnoreAlert = () => {
    setNewAlert(null);
  };

  const statCards = [
    { 
      label: 'Active Alerts', 
      value: stats.activeAlerts, 
      icon: Bell, 
      colorTheme: "text-[#A64D4D]", 
      bgTheme: "bg-[#A64D4D]/12",
      pulse: stats.activeAlerts > 0,
      trendUp: false
    },
    { 
      label: 'Resolved', 
      value: stats.resolvedAlerts, 
      icon: CheckCircle, 
      colorTheme: "text-[#4E6B4A]", 
      bgTheme: "bg-[#4E6B4A]/12",
      trendUp: true
    },
    { 
      label: 'Total Alerts', 
      value: stats.totalAlerts, 
      icon: AlertTriangle, 
      colorTheme: "text-[#B88A44]", 
      bgTheme: "bg-[#B88A44]/10",
      trendUp: true
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 text-[#B88A44] animate-spin" />
        <p className="metadata text-[14px]">Securing Connection...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10">
      {/* Alert Notification Modal - Only show when available */}
      {pompierStatus === 'available' && (
        <AlertNotificationModal
          alert={newAlert}
          isOpen={!!newAlert}
          onTakeMission={handleTakeMission}
          onIgnore={handleIgnoreAlert}
          onClose={() => setNewAlert(null)}
        />
      )}

      {/* Top Banner Area — matches Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="flex flex-col">
           <h2 className="text-3xl font-black text-[#1F2A22]">Response Overview</h2>
           <p className="text-[#6B7468] font-bold text-[14px]">Fire response monitoring and mission status.</p>
        </div>
        <div className="w-full md:w-[340px] bg-[#DCE3D6] rounded-[24px] p-5 flex flex-col gap-4 shadow-inner border border-[#4F5C4A]/[0.10] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4E6B4A]/10 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="metadata text-[11px] text-[#1F2A22] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4E6B4A]" /> Responder Status
            </span>
            {/* Status Toggle Button */}
            <button
              onClick={() => {
                if (pompierStatus === 'available') {
                  setPompierStatus('unavailable');
                } else if (pompierStatus === 'unavailable') {
                  setPompierStatus('available');
                }
              }}
              disabled={pompierStatus === 'on_mission'}
              className={`badge flex items-center gap-1.5 px-3 py-1 rounded-[10px] shadow-sm border cursor-pointer transition-all ${
                pompierStatus === 'available' 
                  ? 'bg-[#F8F7F2] border-[#4E6B4A]/20' 
                  : pompierStatus === 'on_mission'
                  ? 'bg-[#B88A44]/10 border-[#B88A44]/20 cursor-not-allowed'
                  : 'bg-[#F8F7F2] border-[#4F5C4A]/[0.10]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                pompierStatus === 'available' ? 'bg-[#4E6B4A] animate-pulse' : 
                pompierStatus === 'on_mission' ? 'bg-[#B88A44]' : 'bg-[#6B7468]'
              }`}></span>
              <span className="metadata text-[10px] text-[#2F4A36]">
                {pompierStatus === 'available' ? 'Available' : 
                 pompierStatus === 'on_mission' ? 'On Mission' : 'Unavailable'}
              </span>
            </button>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col gap-0.5">
              <p className="metadata text-[13px] text-[#6B7468]"><span className="text-[#1F2A22]">{stats.activeAlerts}</span> ACTIVE ALERTS</p>
              <p className="metadata text-[13px] text-[#6B7468]"><span className="text-[#1F2A22]">{stats.resolvedAlerts}</span> RESOLVED</p>
            </div>
            <Link to="/pompier/map" className="px-4 py-2 bg-[#B88A44] hover:bg-[#A37B3D] text-white rounded-[12px] text-[12px] font-[800] uppercase tracking-widest transition-all shadow-md shadow-[#B88A44]/20 active:scale-95">
               Map View
            </Link>
          </div>
        </div>
      </div>

      {/* Active Mission Banner */}
      {pompierStatus === 'on_mission' && currentMission && (
        <div className="bg-[#B88A44] rounded-[24px] p-5 flex items-center justify-between text-white shadow-[0_8px_24px_rgba(184,138,68,0.2)] border border-[#B88A44]/30">
          <div className="flex items-center gap-4">
            <div className="w-[42px] h-[42px] rounded-[14px] bg-white/20 flex items-center justify-center">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-[800] text-[14px] uppercase tracking-wider">Active Mission</div>
              <div className="text-[13px] text-white/80 font-[600]">
                {currentMission.zone || currentMission.cooperative} — {currentMission.cooperative || 'Responding'}
              </div>
            </div>
          </div>
          <Link 
            to="/pompier/mission"
            className="px-4 py-2 bg-white text-[#B88A44] rounded-[12px] font-[800] text-[12px] uppercase tracking-widest hover:bg-white/90 transition-all shadow-sm"
          >
            View Mission
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-[#A64D4D]/10 border border-[#A64D4D]/20 p-4 rounded-[16px] flex items-center justify-between text-[#A64D4D] font-bold">
          <span>{error}</span>
          <button onClick={fetchData} className="underline cursor-pointer text-[13px]">Retry</button>
        </div>
      )}

      {/* Stat Cards Row — matches Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[24px]">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-[#F8F7F2] w-full h-[150px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] hover:shadow-[0_12px_40px_rgba(31,42,33,0.1)] transition-all duration-300 p-[24px] flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className={`w-[42px] h-[42px] rounded-[14px] ${card.bgTheme} ${card.colorTheme} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <Icon className={`w-[20px] h-[20px] ${card.pulse ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                </div>
                <div className="h-[25px] w-[60px] opacity-40 group-hover:opacity-100 transition-all">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{v:2},{v:5},{v:3},{v:7},{v:4},{v:8}]} margin={{top:0, right:0, left:0, bottom:0}}>
                         <Area type="monotone" dataKey="v" stroke={card.trendUp ? "#4E6B4A" : "#A64D4D"} fill="none" strokeWidth={2} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <p className="metadata text-[10px] mb-1">{card.label}</p>
                <p className="text-[34px] font-[800] text-[#1F2A22] leading-none tracking-tighter">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row — 2 columns matching Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[28px]">
        
        {/* Alerts This Week — Area Chart */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] h-[360px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#A64D4D]/10 flex items-center justify-center border border-[#A64D4D]/10">
                <AlertTriangle className="w-4.5 h-4.5 text-[#A64D4D]" />
              </div>
              Alerts This Week
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alertsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAlertsPompier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A64D4D" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#A64D4D" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolvedPompier" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E6B4A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4E6B4A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCE3D6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7468', fontWeight: 700 }} dx={-10} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(31,42,33,0.1)', background: '#F8F7F2' }} 
                  itemStyle={{ fontWeight: 800 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Area type="monotone" dataKey="alerts" name="New Alerts" stroke="#A64D4D" strokeWidth={3} fillOpacity={1} fill="url(#colorAlertsPompier)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#4E6B4A" strokeWidth={3} fillOpacity={1} fill="url(#colorResolvedPompier)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] rounded-[32px] flex flex-col p-[24px] hover:shadow-[0_12px_40px_rgba(31,42,33,0.08)] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="section-title text-[#1F2A22] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#B88A44]/10 flex items-center justify-center border border-[#B88A44]/10">
                <Clock className="w-4.5 h-4.5 text-[#B88A44]" />
              </div>
              Recent Activity
            </h3>
            <Link to="/pompier/alertes" className="text-[12px] font-[800] text-[#B88A44] hover:text-[#A37B3D] uppercase tracking-widest transition-all">
              View All →
            </Link>
          </div>
          
          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            {recentAlerts.length > 0 ? recentAlerts.map((alert, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-4 bg-[#ECE9E1]/60 rounded-[16px] hover:bg-[#ECE9E1] transition-all border border-[#4F5C4A]/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-[38px] h-[38px] rounded-[12px] flex items-center justify-center ${
                    alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'bg-[#A64D4D]/12 text-[#A64D4D]' :
                    alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'bg-[#B88A44]/12 text-[#B88A44]' :
                    'bg-[#4E6B4A]/12 text-[#4E6B4A]'
                  }`}>
                    <Flame className="w-[18px] h-[18px]" />
                  </div>
                  <div>
                    <p className="font-[800] text-[14px] text-[#1F2A22] leading-none mb-1">{alert.zone}</p>
                    {alert.cooperative && alert.cooperative !== alert.zone && (
                      <p className="text-[11px] text-[#6B7468] font-[600]">{alert.cooperative}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-[8px] text-[10px] font-[800] uppercase tracking-wider border ${
                    alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'bg-[#A64D4D]/10 text-[#A64D4D] border-[#A64D4D]/15' :
                    alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'bg-[#B88A44]/10 text-[#B88A44] border-[#B88A44]/15' :
                    'bg-[#4E6B4A]/10 text-[#4E6B4A] border-[#4E6B4A]/15'
                  }`}>
                    {alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'Critical' :
                     alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'Warning' : 'Info'}
                  </span>
                  {alert.temperature && (
                    <span className="text-[13px] font-[800] text-[#B88A44]">{alert.temperature}°C</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-[#6B7468]">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-[700] text-[14px]">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
