import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, Flame, Map as MapIcon, AlertTriangle, 
  Loader2, Activity, Shield, Clock, CheckCircle
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
      color: 'rose',
      gradient: 'from-rose-500 to-pink-600',
      pulse: stats.activeAlerts > 0 
    },
    { 
      label: 'Resolved Alerts', 
      value: stats.resolvedAlerts, 
      icon: CheckCircle, 
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      label: 'Total Alerts', 
      value: stats.totalAlerts, 
      icon: AlertTriangle, 
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
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

      {/* Epic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-900 to-orange-900 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-xl shadow-rose-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Welcome, {user.prenom || user.nom || 'Firefighter'}
              </h1>
              <p className="text-rose-200/80 text-sm mt-1">
                Fire Response Command Center • {stats.resolvedAlerts} alerts resolved
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Toggle Button */}
            <button
              onClick={() => {
                if (pompierStatus === 'available') {
                  setPompierStatus('unavailable');
                } else if (pompierStatus === 'unavailable') {
                  setPompierStatus('available');
                }
                // Can't change status while on mission
              }}
              disabled={pompierStatus === 'on_mission'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all ${
                pompierStatus === 'available' 
                  ? 'bg-emerald-500/20 border-emerald-400/30 hover:bg-emerald-500/30' 
                  : pompierStatus === 'on_mission'
                  ? 'bg-amber-500/20 border-amber-400/30 cursor-not-allowed'
                  : 'bg-slate-500/20 border-slate-400/30 hover:bg-slate-500/30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                pompierStatus === 'available' ? 'bg-emerald-400 animate-pulse' : 
                pompierStatus === 'on_mission' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />
              <span className="text-white font-bold text-sm">
                {pompierStatus === 'available' ? 'Available' : 
                 pompierStatus === 'on_mission' ? 'On Mission' : 'Unavailable'}
              </span>
            </button>
            <Link 
              to="/pompier/map"
              className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all shadow-lg text-sm font-bold"
            >
              <MapIcon className="w-4 h-4" /> Open Map
            </Link>
          </div>
        </div>
      </div>

      {/* Active Mission Banner */}
      {pompierStatus === 'on_mission' && currentMission && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-bold">Active Mission</div>
              <div className="text-sm text-white/80">
                {currentMission.zone || currentMission.cooperative} - {currentMission.cooperative || 'Responding'}
              </div>
            </div>
          </div>
          <Link 
            to="/pompier/mission"
            className="px-4 py-2 bg-white text-amber-600 rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
          >
            View Mission
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 font-bold">
          <span>{error}</span>
          <button onClick={fetchData} className="underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Stats Cards - Only 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-5 rounded-full -translate-y-8 translate-x-8`} />
              <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 text-${card.color}-500 flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${card.pulse ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-3xl font-black text-slate-800">{card.value}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Single Chart - Alerts This Week */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-slate-800">Alerts This Week</h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={alertsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <RechartsTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Area type="monotone" dataKey="alerts" name="New Alerts" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">Recent Activity</h3>
          </div>
          <Link to="/pompier/alertes" className="text-sm font-bold text-rose-500 hover:text-rose-600">
            View All →
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentAlerts.length > 0 ? recentAlerts.map((alert, i) => (
            <div 
              key={i}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'bg-rose-100 text-rose-600' :
                  alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{alert.zone}</p>
                  {alert.cooperative && alert.cooperative !== alert.zone && (
                    <p className="text-xs text-slate-500">{alert.cooperative}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'bg-rose-100 text-rose-700' :
                  alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale' ? 'Critical' :
                   alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee' ? 'Warning' : 'Info'}
                </span>
                {alert.temperature && (
                  <span className="text-sm font-bold text-orange-600">{alert.temperature}°C</span>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
