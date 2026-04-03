import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, Clock, XCircle, Search, MapPin, X as XIcon, Lock, Activity, Eye, Edit2, Archive } from 'lucide-react';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/axiosInstance';

export default function PompierIncendies() {
  const [incendies, setIncendies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Forms State
  const [selectedIncendie, setSelectedIncendie] = useState(null);
  const [obsFormId, setObsFormId] = useState(null); // id_incendie pour inline form
  const [clotureModal, setClotureModal] = useState(null); // id_incendie

  // Inline form state
  const [obsText, setObsText] = useState('');
  const [obsCause, setObsCause] = useState('inconnue');

  // Cloture form state
  const [clotureData, setClotureData] = useState({
    date_fin: new Date().toISOString().slice(0, 16),
    surface_brulee: '',
    observations: '',
    cause_presumee: 'inconnue'
  });

  useEffect(() => {
    fetchIncendies();
  }, []);

  const fetchIncendies = async () => {
    try {
      setLoading(true);
      // const res = await api.get('/api/incendies?pompier=true');
      const mockIncendies = [
        { id_incendie: 1, zone: 'Zone Nord', date_debut: new Date(Date.now() - 86400000).toISOString(), date_fin: null, surface_brulee: null, statut: 'actif', cause_presumee: 'inconnue', observations: '', logs: [{ id: 1, action: 'Initialisation', hash_integrite: '7f83b1657ff1...'}, { id: 2, action: 'Intervention équipe', hash_integrite: 'e3b0c44298fc...'}], poly: [[30.5, -9.5], [30.6, -9.4], [30.5, -9.3]] },
        { id_incendie: 2, zone: 'Zone Sud', date_debut: new Date(Date.now() - 172800000).toISOString(), date_fin: null, surface_brulee: 12.5, statut: 'maîtrisé', cause_presumee: 'négligence', observations: 'Feu circonscrit.', logs: [], poly: [[30.4, -9.6], [30.45, -9.55], [30.38, -9.5]] },
        { id_incendie: 3, zone: 'Forêt d\'Arganier Centrale', date_debut: new Date(Date.now() - 432000000).toISOString(), date_fin: new Date(Date.now() - 259200000).toISOString(), surface_brulee: 45.2, statut: 'clôturé', cause_presumee: 'foudre', observations: 'Dossier archivé.', logs: [], poly: [] }
      ];
      setTimeout(() => {
        setIncendies(mockIncendies);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'actif': return <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><Flame size={12}/> Actif</span>;
      case 'maîtrisé': return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><Activity size={12}/> Maîtrisé</span>;
      case 'éteint': return <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><CheckCircle size={12}/> Éteint</span>;
      case 'clôturé': return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><Archive size={12}/> Clôturé</span>;
      default: return null;
    }
  };

  const handleSaveObservations = async (id) => {
    try {
      // await api.patch(`/api/incendies/${id}/observations`, { observations: obsText, cause_presumee: obsCause });
      setIncendies(prev => prev.map(inc => inc.id_incendie === id ? { ...inc, observations: obsText, cause_presumee: obsCause } : inc));
      setObsFormId(null);
      setObsText('');
      setObsCause('inconnue');
      alert('Observations sauvegardées !');
    } catch(err) {
      console.error(err);
    }
  };

  const handleCloturer = async (id) => {
    try {
      // await api.patch(`/api/incendies/${id}/cloturer`, clotureData);
      setIncendies(prev => prev.map(inc => inc.id_incendie === id ? { ...inc, statut: 'clôturé', ...clotureData } : inc));
      setClotureModal(null);
      alert('Incendie clôturé avec succès.');
    } catch(err) {
      console.error(err);
    }
  };

  const filteredIncendies = incendies.filter(i => i.zone.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestion des Incendies</h1>
          <p className="text-slate-500 font-medium">Suivez l'évolution et clôturez les interventions.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-3xl w-full" />)
        ) : filteredIncendies.map(incendie => (
          <div key={incendie.id_incendie} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all ${incendie.statut === 'clôturé' ? 'opacity-60 grayscale-[50%]' : ''}`}>
            
            <div className="p-6 flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
              {/* Infos principales */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center break-words">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zone</span>
                  <span className="font-black text-sm text-slate-800 flex items-center gap-1"><MapPin size={14} className="text-emerald-500" /> {incendie.zone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Date début</span>
                  <span className="font-bold text-sm text-slate-700">{new Date(incendie.date_debut).toLocaleDateString('fr-MA')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Surface Brûlée</span>
                  <span className="font-bold text-sm text-slate-700">{incendie.surface_brulee ? `${incendie.surface_brulee} ha` : '--'}</span>
                </div>
                <div className="flex justify-start">
                  {getStatusBadge(incendie.statut)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setSelectedIncendie(incendie)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Eye size={16}/> Détails
                </button>
                {incendie.statut !== 'clôturé' && (
                   <button 
                     onClick={() => {
                        if(obsFormId === incendie.id_incendie) setObsFormId(null);
                        else {
                          setObsFormId(incendie.id_incendie);
                          setObsText(incendie.observations || '');
                          setObsCause(incendie.cause_presumee || 'inconnue');
                        }
                     }}
                     className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                   >
                     <Edit2 size={16}/> Observations
                   </button>
                )}
                {incendie.statut !== 'clôturé' && (
                  <button 
                    onClick={() => {
                      setClotureData(prev => ({ ...prev, observations: incendie.observations || '', cause_presumee: incendie.cause_presumee || 'inconnue' }));
                      setClotureModal(incendie.id_incendie);
                    }}
                    className="border-2 border-rose-100 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Clôturer
                  </button>
                )}
              </div>
            </div>

            {/* Inline Form Add Observations */}
            <AnimatePresence>
              {obsFormId === incendie.id_incendie && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50 border-t border-slate-100 px-6 py-4 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Observations Terrain</label>
                      <textarea 
                        value={obsText}
                        onChange={e => setObsText(e.target.value)}
                        placeholder="Décrivez vos observations terrain..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        rows="3"
                      />
                    </div>
                    <div className="w-full md:w-64 space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Cause Présumée</label>
                        <select 
                          value={obsCause}
                          onChange={e => setObsCause(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="inconnue">🤔 Inconnue</option>
                          <option value="négligence">🚭 Négligence</option>
                          <option value="intentionnel">🔥 Intentionnel</option>
                          <option value="foudre">⚡ Foudre</option>
                          <option value="chaleur_extreme">☀️ Chaleur extrême</option>
                        </select>
                      </div>
                      <button 
                        onClick={() => handleSaveObservations(incendie.id_incendie)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {filteredIncendies.length === 0 && !loading && (
          <div className="text-center p-12 bg-white rounded-3xl text-slate-400 font-bold border border-slate-100 border-dashed">Aucun incendie trouvé.</div>
        )}
      </div>

      {/* Drawer: Consulter détails */}
      <AnimatePresence>
        {selectedIncendie && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedIncendie(null)} className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Flame className="text-rose-500"/> Incendie #{selectedIncendie.id_incendie}
                </h2>
                <button onClick={() => setSelectedIncendie(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                  <XIcon size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Carte polygone */}
                {selectedIncendie.poly && selectedIncendie.poly.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-800 mb-3 uppercase tracking-wider">Zone Touchée</h3>
                     <div className="h-[250px] w-full rounded-3xl overflow-hidden shadow-inner border border-slate-100 relative z-0">
                       <MapContainer bounds={selectedIncendie.poly} zoomControl={false} style={{height: '100%', width: '100%'}}>
                         <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                         <Polygon positions={selectedIncendie.poly} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.4 }} />
                       </MapContainer>
                     </div>
                  </div>
                )}

                {/* Timeline & Logs */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">Timeline & Sécurité</h3>
                  <div className="relative pl-4 space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {selectedIncendie.logs && selectedIncendie.logs.map(log => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 z-10"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm ml-4 md:ml-0 md:group-odd:mr-4">
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{log.action}</h4>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 opacity-70">
                            <Lock size={10}/> {log.hash_integrite}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!selectedIncendie.logs || selectedIncendie.logs.length === 0) && (
                      <p className="pl-6 text-sm text-slate-400 font-medium">Aucun historique disponible.</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Clôture */}
      <AnimatePresence>
        {clotureModal && (
          <div className="fixed inset-0 bg-slate-900/40 z-[60] backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-6">
              
              <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-100">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
                  <Archive size={32} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Clôturer Définitivement</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Cette action est irréversible et archivera l'incendie (Hachage sécurisé généré).</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Date finale d'extinction</label>
                  <input type="datetime-local" value={clotureData.date_fin} onChange={e => setClotureData({...clotureData, date_fin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Surface Brûlée Totale (Hectares)</label>
                  <input type="number" step="0.1" placeholder="Ex: 12.5" value={clotureData.surface_brulee} onChange={e => setClotureData({...clotureData, surface_brulee: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Cause Confirmée (Optionnel)</label>
                  <select value={clotureData.cause_presumee} onChange={e => setClotureData({...clotureData, cause_presumee: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20">
                    <option value="inconnue">🤔 Inconnue</option>
                    <option value="négligence">🚭 Négligence</option>
                    <option value="intentionnel">🔥 Intentionnel</option>
                    <option value="foudre">⚡ Foudre</option>
                    <option value="chaleur_extreme">☀️ Chaleur extrême</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Rapport de clôture (Observations)</label>
                  <textarea value={clotureData.observations} onChange={e => setClotureData({...clotureData, observations: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-rose-500/20" placeholder="Décrivez l'état final..." />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button onClick={() => setClotureModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors">Annuler</button>
                <button onClick={() => handleCloturer(clotureModal)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2">
                  <Archive size={16}/> Clôturer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
