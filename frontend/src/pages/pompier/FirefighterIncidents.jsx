import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle, Clock, Search, MapPin, Activity, Check } from 'lucide-react';
import api from '../../utils/axiosInstance';

export default function FirefighterIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

 const fetchIncidents = async () => {
  try {
    setLoading(true);

    const res = await api.get('/incidents');

    const formatted = res.data.map(i => ({
      id: i.id_alerte,
      zone: i.zone.nom_zone,
      status: i.statut === "ACTIVE" ? "Active" : "Secured",
      startDate: i.date_creation,
      cause: i.type_alerte
    }));

    setIncidents(formatted);

  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><Flame size={12} className="animate-pulse"/> Active</span>;
      case 'Secured': return <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1"><CheckCircle size={12}/> Secured</span>;
      default: return null;
    }
  };

  const handleFinishIntervention = async (id) => {
    if (window.confirm("Are you sure you want to finish this intervention? The incident will be marked as secured.")) {
      try {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'Secured', endDate: new Date().toISOString(), burntArea: 0 } : inc));
        // await api.patch(`/api/incidents/${id}/finish`);
      } catch(err) {
        console.error(err);
      }
    }
  };

  const filtered = incidents.filter(i => i.zone.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Flame className="text-orange-500" /> Incidents Tracker
          </h1>
          <p className="text-slate-500 font-medium">Monitor active fires and submit intervention completion.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-sm transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date / Duration</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cause</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-400 animate-pulse font-bold">Loading database...</td></tr>
               ) : filtered.length === 0 ? (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold border-dashed border-2 m-4">No incidents found in the database.</td></tr>
               ) : filtered.map(inc => (
                 <tr key={inc.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-black text-slate-800">#{inc.id}</td>
                    <td className="p-5 font-bold text-slate-700 flex items-center gap-2">
                       <MapPin size={16} className="text-emerald-500" /> {inc.zone}
                    </td>
                    <td className="p-5">
                       <span className="font-bold text-sm text-slate-600 block flex items-center gap-1">
                         <Clock size={12}/> {new Date(inc.startDate).toLocaleDateString()}
                       </span>
                       {inc.endDate && (
                         <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">End: {new Date(inc.endDate).toLocaleDateString()}</span>
                       )}
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-500">{inc.cause}</td>
                    <td className="p-5">
                      {getStatusBadge(inc.status)}
                    </td>
                    <td className="p-5 text-right">
                      {inc.status === 'Active' ? (
                        <button 
                          onClick={() => handleFinishIntervention(inc.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
                        >
                          Finish Intervention
                        </button>
                      ) : (
                        <button disabled className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-not-allowed inline-flex items-center gap-2">
                          <Check size={14}/> Completed
                        </button>
                      )}
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
