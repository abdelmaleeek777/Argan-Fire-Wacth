import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flame, Users, Map as MapIcon, ChevronRight, CircleDot } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';
import { SocketContext } from '../../components/pompier/PompierLayout';

export default function PompierDashboard() {
  const { user } = useContext(SocketContext) || {};
  const [stats, setStats] = useState({
    alertesActives: 0,
    incendiesEnCours: 0,
    pompiersDisponibles: 0,
    zonesSurveillees: 0
  });
  const [incendies, setIncendies] = useState([]);
  const [zones, setZones] = useState([]);
  const [alertesCritiques, setAlertesCritiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Loaders mockés ou réels
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fallback mockup en cas d'absence d'API backend
        const mockStats = { alertesActives: 3, incendiesEnCours: 2, pompiersDisponibles: 45, zonesSurveillees: 12 };
        const mockIncendies = [
          { id_incendie: 1, lat: 30.50, lng: -9.50, niveau: 'urgence_maximale', nom_zone: 'Zone Nord' },
          { id_incendie: 2, lat: 30.40, lng: -9.60, niveau: 'alerte', nom_zone: 'Zone Sud' }
        ];
        const mockAlertesCritiques = [
          { id_alerte: 10, zone: 'Zone Nord', temperature: 52, date: new Date().toISOString() },
          { id_alerte: 11, zone: 'Zone Sud', temperature: 48, date: new Date(Date.now() - 3600000).toISOString() }
        ];
        
        // Appels réels commentés/utilisés si API existante
        // const [resStats, resAlertes, resZones] = await Promise.all([
        //   api.get('/api/dashboard/pompier/stats'),
        //   api.get('/api/alertes?statut=active&limit=3&urgence=urgence_maximale'),
        //   api.get('/api/zones')
        // ]);
        // setStats(resStats.data);
        // setAlertesCritiques(resAlertes.data);
        // setZones(resZones.data);

        setTimeout(() => {
          setStats(mockStats);
          setIncendies(mockIncendies);
          setAlertesCritiques(mockAlertesCritiques);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError("Impossible de charger les données du tableau de bord.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUrgencyColor = (niveau) => {
    switch (niveau) {
      case 'vigilance': return '#F59E0B';
      case 'alerte': return '#F97316';
      case 'urgence_maximale': return '#EF4444';
      default: return '#EF4444';
    }
  };

  const statCards = [
    { label: 'Alertes Actives', count: stats.alertesActives, icon: Bell, col: 'rose', pulse: stats.alertesActives > 0 },
    { label: 'Incendies Actifs', count: stats.incendiesEnCours, icon: Flame, col: 'orange' },
    { label: 'Pompiers Dispo', count: stats.pompiersDisponibles, icon: Users, col: 'emerald' },
    { label: 'Zones En Feu (Carte)', count: incendies.length, icon: MapIcon, col: 'slate' }
  ];

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
        </div>
        <div className="h-[380px] bg-slate-200 rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans">
      
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between text-rose-800 font-bold">
          <span>{error}</span>
          <button onClick={() => window.location.reload()} className="underline cursor-pointer">Réessayer</button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bonjour, {user ? `${user.grade} ${user.prenom}` : 'Lieutenant'}</h1>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <CircleDot size={14} className={user?.statut === 'disponible' ? 'text-emerald-500 animate-pulse' : 'text-rose-500'} />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Statut : {user?.statut === 'disponible' ? 'Disponible' : 'Non disponible'}
            </span>
          </div>
        </div>
        <p className="text-slate-500 font-medium mt-1">Voici la situation sur le terrain aujourd'hui.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-${c.col}-50 text-${c.col}-500 flex items-center justify-center`}>
                <c.icon size={24} strokeWidth={2.5} className={(c.pulse && c.count > 0) ? 'animate-pulse' : ''} />
              </div>
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
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Zones contenant des incendies</h2>
          <div className="h-[380px] w-full bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-emerald-900/5 shadow-xl relative z-0">
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
              
              {/* Markers */}
              {incendies.map(inc => (
                <CircleMarker
                  key={inc.id_incendie}
                  center={[inc.lat, inc.lng]}
                  radius={12}
                  pathOptions={{ 
                    color: getUrgencyColor(inc.niveau), 
                    fillColor: getUrgencyColor(inc.niveau), 
                    fillOpacity: 0.6 
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <span className="font-bold text-sm block">{inc.nom_zone}</span>
                    <span className="text-xs text-rose-600 block">{inc.niveau.replace('_', ' ')}</span>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 w-48 text-center text-sans text-sm">
                      <Flame size={24} className="text-rose-500 mx-auto mb-2" />
                      <p className="font-black text-slate-800 mb-1">{inc.nom_zone}</p>
                      <button 
                        onClick={() => navigate(`/pompier/incendies/${inc.id_incendie}`)}
                        className="w-full mt-3 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                      >
                        Voir détails de l'incendie
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Zones Poly (Mock) */}
              <Polygon positions={[
                [30.5, -9.5], [30.6, -9.4], [30.5, -9.3]
              ]} pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.2 }} />
            </MapContainer>
          </div>
        </div>

        {/* Alertes Critiques */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-rose-500">⚠</span> Alertes critiques
            </h2>
            <span className="bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-full font-black">
              {alertesCritiques.length}
            </span>
          </div>

          <div className="space-y-3">
            {alertesCritiques.map((alerte, i) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={alerte.id_alerte}
                className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm relative overflow-hidden group cursor-pointer"
                onClick={() => navigate('/pompier/alertes')}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl"></div>
                <div className="pl-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-slate-800">{alerte.zone}</h3>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full">
                      {new Date(alerte.date).toLocaleTimeString('fr-MA', { hour: '2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded drop-shadow-sm font-bold flex items-center gap-1">
                      <Flame size={12}/> {alerte.temperature}°C
                    </span>
                  </div>
                  <button className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Prendre en charge <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}

            {alertesCritiques.length === 0 && (
              <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-slate-400 font-bold text-sm">Aucune alerte critique.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
