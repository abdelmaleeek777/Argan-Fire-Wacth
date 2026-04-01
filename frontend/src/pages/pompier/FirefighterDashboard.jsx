import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flame, Map as MapIcon, CircleDot, User, Phone } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import { SocketContext } from '../../components/pompier/FirefighterLayout';

export default function FirefighterDashboard() {
  const { user } = useContext(SocketContext) || {};
  const [stats, setStats] = useState({
    activeAlerts: 0,
    activeIncidents: 0,
  });
  const [incidents, setIncidents] = useState([]);
  const [firefighters, setFirefighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fallback mockup
        const mockStats = { activeAlerts: 4, activeIncidents: 2 };
        const mockIncidents = [
          { id: 1, lat: 30.50, lng: -9.50, severity: 'urgence_maximale', zoneName: 'North Forest' },
          { id: 2, lat: 30.40, lng: -9.60, severity: 'alerte', zoneName: 'South Argan Valley' }
        ];
        const mockFirefighters = [
          { id: 101, name: 'Tarik S.', status: 'available', team: 'Alpha', phone: '06 12 34 56 78' },
          { id: 102, name: 'Youssef B.', status: 'unavailable', team: 'Alpha', phone: '06 98 76 54 32' },
          { id: 103, name: 'Karim L.', status: 'available', team: 'Bravo', phone: '06 11 22 33 44' },
          { id: 104, name: 'Ali M.', status: 'available', team: 'Delta', phone: '06 99 88 77 66' }
        ];

        setTimeout(() => {
          setStats(mockStats);
          setIncidents(mockIncidents);
          setFirefighters(mockFirefighters);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError("Unable to load dashboard data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUrgencyColor = (severity) => {
    switch (severity) {
      case 'vigilance': return '#F59E0B'; // amber
      case 'alerte': return '#F97316'; // orange
      case 'urgence_maximale': return '#EF4444'; // red
      default: return '#EF4444';
    }
  };

  const statCards = [
    { label: 'Active Alerts', count: stats.activeAlerts, icon: Bell, col: 'rose', pulse: stats.activeAlerts > 0 },
    { label: 'Active Incidents', count: stats.activeIncidents, icon: Flame, col: 'orange' },
    { label: 'Zones On Fire', count: incidents.length, icon: MapIcon, col: 'slate' }
  ];

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
        </div>
        <div className="h-[450px] bg-slate-200 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans">
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 font-bold">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="underline cursor-pointer">Retry</button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Hi, {user ? `${user.rank} ${user.firstName}` : 'Firefighter'}
          </h1>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Current Status</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-2 ${user?.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <CircleDot size={12} className={user?.status === 'available' ? 'animate-pulse' : ''} />
              {user?.status === 'available' ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
        <p className="text-slate-500 font-medium mt-1">Here is the current situation on the ground.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statCards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 text-${c.col}-500`}>
              <c.icon size={64} />
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-${c.col}-50 text-${c.col}-500 flex items-center justify-center mb-4 relative z-10`}>
              <c.icon size={24} strokeWidth={2.5} className={(c.pulse && c.count > 0) ? 'animate-pulse' : ''} />
            </div>
            <div className="relative z-10">
              <span className="text-4xl font-black text-slate-800 block mb-1">{c.count}</span>
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">{c.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Zones containing active incidents</h2>
          <div className="h-[450px] w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-emerald-900/5 shadow-xl relative z-0">
            <MapContainer 
              center={[30.4278, -9.5981]} 
              zoom={9} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
              />
              
              {incidents.map(inc => (
                <CircleMarker
                  key={inc.id}
                  center={[inc.lat, inc.lng]}
                  radius={12}
                  pathOptions={{ 
                    color: getUrgencyColor(inc.severity), 
                    fillColor: getUrgencyColor(inc.severity), 
                    fillOpacity: 0.6 
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <span className="font-bold text-sm block">{inc.zoneName}</span>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 w-48 text-center text-sans text-sm">
                      <Flame size={24} className="text-rose-500 mx-auto mb-2" />
                      <p className="font-black text-slate-800 mb-1">{inc.zoneName}</p>
                      <button 
                        onClick={() => navigate(`/pompier/incidents`)}
                        className="w-full mt-3 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                      >
                        View Incident Details
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              <Polygon positions={[
                [30.5, -9.5], [30.6, -9.4], [30.5, -9.3]
              ]} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2 }} />
            </MapContainer>
          </div>
        </div>

        {/* Firefighters Team Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Team Status</h2>
            <span className="bg-emerald-100 text-emerald-700 font-black text-xs px-2 py-0.5 rounded-full">
              {firefighters.filter(f => f.status === 'available').length} Available
            </span>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 h-[450px] overflow-y-auto space-y-3">
            {firefighters.map(ff => (
              <div key={ff.id} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-200 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ff.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{ff.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Phone size={10} /> {ff.phone}
                      </p>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ff.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {ff.status === 'available' ? 'Available' : 'Busy'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Team {ff.team}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
