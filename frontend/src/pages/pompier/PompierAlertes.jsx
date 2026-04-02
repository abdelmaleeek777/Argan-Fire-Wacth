import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Flame, Wind, Activity, CheckCircle, ChevronRight, X as XIcon, Crosshair } from 'lucide-react';
import { SocketContext } from '../../components/pompier/PompierLayout';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/axiosInstance';

export default function PompierAlertes() {
  const { socket, user } = useContext(SocketContext) || {};
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('Toutes');
  const [filterGravite, setFilterGravite] = useState('Toutes');
  
  // Drawer
  const [selectedAlerte, setSelectedAlerte] = useState(null);

  useEffect(() => {
    fetchAlertes();

    if (socket) {
      socket.on('nouvelle_alerte', (alerte) => {
        // Son Bip
        new Audio('/alert-bip.mp3').play().catch(() => {});
        setAlertes((prev) => [alerte, ...prev]);
      });

      socket.on('alerte_mise_a_jour', (alerteMaj) => {
        setAlertes((prev) => prev.map(a => a.id_alerte === alerteMaj.id_alerte ? alerteMaj : a));
      });
    }

    return () => {
      if (socket) {
        socket.off('nouvelle_alerte');
        socket.off('alerte_mise_a_jour');
      }
    };
  }, [socket]);

  const fetchAlertes = async () => {
    try {
      setLoading(true);
      // const res = await api.get('/api/alertes?pompier=true');
      // setAlertes(res.data);
      
      // MOCKUP
      const mockupAlertes = [
        { id_alerte: 1, type_alerte: 'Température', zone: 'Ait Baha', niveau_gravite: 'Critique', message: 'Hausse anormale de température (> 55°C)', statut: 'nouvelle', date: new Date().toISOString(), lat: 30.12, lng: -9.00 },
        { id_alerte: 2, type_alerte: 'Fumée', zone: 'Igherm', niveau_gravite: 'Élevé', message: 'Détection de particules', statut: 'en_cours', date: new Date(Date.now() - 3600000).toISOString(), lat: 29.8, lng: -8.4 },
        { id_alerte: 3, type_alerte: 'Météo', zone: 'Souss', niveau_gravite: 'Faible', message: 'Risque de Chergui', statut: 'résolue', date: new Date(Date.now() - 86400000).toISOString(), lat: 30.4, lng: -9.5 }
      ];
      setTimeout(() => {
        setAlertes(mockupAlertes);
        setLoading(false);
      }, 500);

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const statusConfig = {
    'nouvelle': { badge: 'bg-rose-500 text-white animate-pulse', border: 'border-l-[6px] border-l-rose-500', icon: Flame },
    'en_cours': { badge: 'bg-orange-100 text-orange-600', border: 'border-l-[6px] border-l-orange-500', icon: Crosshair },
    'résolue': { badge: 'bg-emerald-100 text-emerald-600', border: 'border-l-[6px] border-l-emerald-500', icon: CheckCircle }
  };

  const graviteColor = {
    'Faible': 'text-slate-500',
    'Moyen': 'text-amber-500',
    'Élevé': 'text-orange-500',
    'Critique': 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded'
  };

  const filteredAlertes = alertes.filter(a => {
    const matchStatut = filterStatut === 'Toutes' || (
      filterStatut === 'Nouvelle' ? a.statut === 'nouvelle' :
      filterStatut === 'En cours' ? a.statut === 'en_cours' :
      a.statut === 'résolue'
    );
    const matchGravite = filterGravite === 'Toutes' || a.niveau_gravite === filterGravite;
    const matchSearch = a.zone.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        a.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatut && matchGravite && matchSearch;
  });

  const handlePrendreCharge = async (e, id_alerte) => {
    e.stopPropagation();
    try {
      // Optimistic Update
      setAlertes(prev => prev.map(a => a.id_alerte === id_alerte ? { ...a, statut: 'en_cours' } : a));
      
      // await api.patch(`/api/alertes/${id_alerte}`, { statut: 'en_cours', id_pompier: user?.id_pompier });
      if (socket) {
        socket.emit('alerte_prise_en_charge', { id_alerte, id_pompier: user?.id_pompier });
      }

      // Toast custom
      const t = document.createElement('div');
      t.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl shadow-xl z-50 animate-bounce duration-300';
      t.innerText = 'Alerte prise en charge ✓';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);

    } catch (error) {
      console.error(error);
      // rollback handled by fetching back if failed, but for simplicity skipped here
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatut('Toutes');
    setFilterGravite('Toutes');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestion des Alertes</h1>
          <p className="text-slate-500 font-medium">Réagissez rapidement aux détections.</p>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par zone ou message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-sm transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2 uppercase self-center">Statut:</span>
            {['Toutes', 'Nouvelle', 'En cours', 'Résolue'].map(s => (
              <button 
                key={s} 
                onClick={() => setFilterStatut(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterStatut === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2 uppercase self-center">Gravité:</span>
            {['Toutes', 'Faible', 'Moyen', 'Élevé', 'Critique'].map(g => (
              <button 
                key={g} 
                onClick={() => setFilterGravite(g)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterGravite === g ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {g}
              </button>
            ))}
          </div>
          
          <button onClick={resetFilters} className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1">
            <X size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl w-full" />)
        ) : filteredAlertes.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 font-bold">
            Aucune alerte trouvée correspondant à vos critères.
          </div>
        ) : (
          filteredAlertes.map(alerte => {
            const config = statusConfig[alerte.statut] || statusConfig['nouvelle'];
            const StatusIcon = config.icon;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={alerte.id_alerte}
                onClick={() => setSelectedAlerte(alerte)}
                className={`bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all cursor-pointer ${config.border} flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${graviteColor[alerte.niveau_gravite]}`}>
                      {alerte.niveau_gravite}
                    </span>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {alerte.type_alerte} — {alerte.zone}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-2 truncate max-w-xl">{alerte.message}</p>
                  <div className="text-xs text-slate-400 font-bold">
                    {new Date(alerte.date).toLocaleString('fr-MA')}
                  </div>
                </div>

                <div className="flex  items-center gap-4 shrink-0 justify-between md:justify-end">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${config.badge}`}>
                    {<StatusIcon size={14} />} {alerte.statut.replace('_', ' ')}
                  </span>

                  <div className="flex items-center gap-2">
                    {alerte.statut === 'nouvelle' && (
                      <button 
                        onClick={(e) => handlePrendreCharge(e, alerte.id_alerte)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Prendre en charge
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedAlerte && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAlerte(null)}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                <h2 className="text-xl font-black text-slate-800">Détails de l'alerte #{selectedAlerte.id_alerte}</h2>
                <button onClick={() => setSelectedAlerte(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                  <XIcon size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Meta infos */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Statut</span>
                     <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusConfig[selectedAlerte.statut].badge}`}>
                       {selectedAlerte.statut.replace('_', ' ')}
                     </span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Date</span>
                     <span className="text-sm font-bold text-slate-700">{new Date(selectedAlerte.date).toLocaleString('fr-MA')}</span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Zone</span>
                     <span className="text-sm font-bold text-slate-700">{selectedAlerte.zone}</span>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <span className="text-xs text-slate-400 block font-bold mb-1 uppercase">Gravité</span>
                     <span className="text-sm font-bold text-slate-700">{selectedAlerte.niveau_gravite}</span>
                   </div>
                </div>

                {/* Message  */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-2">Message système</h3>
                  <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border font-mono text-sm border-rose-100">
                    > {selectedAlerte.message}
                  </div>
                </div>

                {/* Mini carte */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-2">Localisation</h3>
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                    {selectedAlerte.lat && selectedAlerte.lng ? (
                      <MapContainer center={[selectedAlerte.lat, selectedAlerte.lng]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <CircleMarker center={[selectedAlerte.lat, selectedAlerte.lng]} radius={15} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.5 }} />
                      </MapContainer>
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Coordonnées GPS indisponibles</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedAlerte.statut === 'nouvelle' && (
                  <button 
                    onClick={(e) => { handlePrendreCharge(e, selectedAlerte.id_alerte); setSelectedAlerte(null); }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-900/20"
                  >
                    Accepter et Prendre en charge
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
