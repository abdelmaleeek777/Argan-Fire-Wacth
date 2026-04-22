import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Save, Send, Lock, X as XIcon, Edit2, Play, CheckCircle, Flame, Clock } from 'lucide-react';
import api from '../../utils/axiosInstance';

export default function PompierIntervention() {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer
  const [selectedInter, setSelectedInter] = useState(null);
  const [form, setForm] = useState({
    observations: '',
    cause_presumee: 'inconnue',
    date_fin: '',
    surface_brulee_ha: '',
    vehicules_deployes: 1
  });

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      // Mock data
      const mockInterventions = [
        { id_intervention: 1, id_incendie: 101, zone: 'Zone Nord', date_debut: new Date().toISOString(), date_fin: null, statut: 'ouvert', est_soumis: false },
        { id_intervention: 2, id_incendie: 102, zone: 'Igherm Sub', date_debut: new Date(Date.now() - 86400000).toISOString(), date_fin: new Date(Date.now() - 3600000).toISOString(), observations: 'Feu étouffé.', cause_presumee: 'foudre', surface_brulee_ha: 12, vehicules_deployes: 3, statut: 'terminée', est_soumis: true, hash: 'a2f9c8...44fc' }
      ];
      setTimeout(() => {
        setInterventions(mockInterventions);
        setLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const openDrawer = (inter) => {
    setSelectedInter(inter);
    setForm({
      observations: inter.observations || '',
      cause_presumee: inter.cause_presumee || 'inconnue',
      date_fin: inter.date_fin ? inter.date_fin.slice(0, 16) : new Date().toISOString().slice(0, 16),
      surface_brulee_ha: inter.surface_brulee_ha || '',
      vehicules_deployes: inter.vehicules_deployes || 1
    });
  };

  const handleSaveDraft = async () => {
    // api.patch ...
    setInterventions(prev => prev.map(i => i.id_intervention === selectedInter.id_intervention ? { ...i, ...form } : i));
    setSelectedInter(null);
  };

  const handleSubmitFinal = async () => {
    if(window.confirm("Atteneiton: Cette action scellera le rapport de manière cryptographique et il ne sera plus modifiable. Confirmer ?")) {
      // api.patch ... /final
      const hash_mock = `SHA256: ${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;
      setInterventions(prev => prev.map(i => i.id_intervention === selectedInter.id_intervention ? { ...i, ...form, statut: 'terminée', est_soumis: true, hash: hash_mock } : i));
      setSelectedInter(null);
    }
  };

  const Timeline = ({ currentLevel }) => {
    const steps = [
      { name: 'Alerte Reçue', status: 'done' },
      { name: 'Mission Acceptée', status: 'done' },
      { name: 'En Route', status: 'done' },
      { name: 'Sur Place', status: currentLevel === 'ouvert' ? 'current' : 'done' },
      { name: 'Maîtrisé', status: currentLevel === 'ouvert' ? 'pending' : 'done' },
      { name: 'Rapport Soumis', status: currentLevel === 'terminée' ? 'done' : 'pending' }
    ];

    return (
      <div className="relative flex justify-between items-center w-full px-2 mt-8 mb-4">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded-full"></div>
        {steps.map((step, idx) => (
           <div key={idx} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-4 border-white ${step.status === 'done' ? 'bg-emerald-500 text-white' : (step.status === 'current' ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400')}`}>
                 {step.status === 'done' ? <CheckCircle size={14}/> : (idx + 1)}
              </div>
              <span className={`absolute max-w-[60px] text-center text-[9px] top-10 font-black uppercase ${step.status === 'done' ? 'text-emerald-700' : (step.status === 'current' ? 'text-orange-600' : 'text-slate-400')}`}>
                {step.name}
              </span>
           </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 font-sans h-full">
      <div>
         <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rapports d'Intervention</h1>
         <p className="text-slate-500 font-medium">Saisissez les données post-mission.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Incendie</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Zone</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Dates</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Statut</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan="5" className="p-5 text-center text-slate-400 animate-pulse font-bold">Chargement...</td></tr>
               ) : interventions.map(inter => (
                 <tr key={inter.id_intervention} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-800">#{inter.id_incendie}</td>
                    <td className="p-5 font-bold text-slate-700">{inter.zone}</td>
                    <td className="p-5 text-xs font-bold text-slate-500 hidden md:table-cell">
                      {new Date(inter.date_debut).toLocaleDateString('fr-MA')}
                      {inter.date_fin ? <span className="block text-[10px] text-slate-400">Fin: {new Date(inter.date_fin).toLocaleDateString()}</span> : null}
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black ${inter.est_soumis ? 'bg-slate-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                        {inter.statut}
                      </span>
                    </td>
                    <td className="p-5">
                      <button 
                        onClick={() => openDrawer(inter)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all ${inter.est_soumis ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                      >
                         {inter.est_soumis ? <><FileText size={14}/> Consulter</> : <><Edit2 size={14}/> Rédiger Rapport</>}
                      </button>
                    </td>
                 </tr>
               ))}
               {interventions.length === 0 && !loading && (
                 <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold border-dashed border-2 m-5">Aucune intervention en cours.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedInter && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInter(null)} className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full md:w-[520px] bg-slate-50 z-50 shadow-2xl flex flex-col">
               
               <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between z-10">
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                   <FileText className="text-emerald-500"/> Rapport d'Intervention
                 </h2>
                 <button onClick={() => setSelectedInter(null)} className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors text-slate-500">
                   <XIcon size={20} />
                 </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-visible">
                    <h3 className="text-slate-800 font-black mb-1">Résumé Mission</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase mb-12">Incendie #{selectedInter.id_incendie} • {selectedInter.zone}</p>
                    <Timeline currentLevel={selectedInter.statut} />
                 </div>

                 {selectedInter.est_soumis && (
                   <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 font-mono text-xs flex items-center gap-2">
                     <Lock size={16} className="text-emerald-600"/> Crypté & Immuable
                     <span className="ml-auto opacity-60 text-[10px]">{selectedInter.hash}</span>
                   </div>
                 )}

                 <form className="space-y-6">
                    {/* Section 1 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-3 border-b pb-2 border-slate-100">1. Observations Terrain</label>
                      <textarea
                        disabled={selectedInter.est_soumis}
                        value={form.observations}
                        onChange={e => setForm({...form, observations: e.target.value})}
                        className="w-full border-none bg-slate-50 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-none disabled:opacity-60"
                        rows="4"
                        placeholder="Conditions géographiques, vents, ressources utilisées, météo locale..."
                      ></textarea>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-3 border-b pb-2 border-slate-100">2. Origine / Cause Présumée</label>
                      <select
                        disabled={selectedInter.est_soumis}
                        value={form.cause_presumee}
                        onChange={e => setForm({...form, cause_presumee: e.target.value})}
                        className="w-full border-none bg-slate-50 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-none disabled:opacity-60"
                      >
                         <option value="inconnue">Inconnue</option>
                         <option value="négligence">Négligence Humaine</option>
                         <option value="intentionnel">Intentionnel (Criminel)</option>
                         <option value="foudre">Foudre</option>
                         <option value="chaleur_extreme">Chaleur Extrême</option>
                      </select>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block border-b pb-2 border-slate-100">3. Clôture & Bilan</label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Fin Intervention</label>
                           <input type="datetime-local" disabled={selectedInter.est_soumis} value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-none font-bold text-sm focus:ring-2 disabled:opacity-60" />
                        </div>
                        <div>
                           <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Surface (Hectares)</label>
                           <input type="number" step="0.1" disabled={selectedInter.est_soumis} value={form.surface_brulee_ha} onChange={e => setForm({...form, surface_brulee_ha: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border-none font-bold text-sm focus:ring-2 disabled:opacity-60" placeholder="0.0" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="text-[10px] uppercase font-black text-slate-400 block mb-1">Véhicules Déployés</label>
                           <input type="number" disabled={selectedInter.est_soumis} value={form.vehicules_deployes} onChange={e => setForm({...form, vehicules_deployes: parseInt(e.target.value)})} className="w-full bg-slate-50 p-3 rounded-xl border-none font-bold text-sm focus:ring-2 disabled:opacity-60" min="1" />
                        </div>
                      </div>
                    </div>
                 </form>

               </div>

               {/* Footer Action */}
               <div className="p-6 bg-white border-t border-slate-200">
                  {selectedInter.est_soumis ? (
                    <button onClick={() => setSelectedInter(null)} className="w-full bg-slate-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle size={18}/> Rapport Validé & Scellé
                    </button>
                  ) : (
                    <div className="flex gap-4">
                       <button onClick={handleSaveDraft} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                         <Save size={18}/> Brouillon
                       </button>
                       <button onClick={handleSubmitFinal} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                         <Send size={18}/> Soumettre
                       </button>
                    </div>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
