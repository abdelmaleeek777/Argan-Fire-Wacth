import React, { useState, useEffect } from 'react';
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
      case 'Active': return <span className="bg-[#A64D4D]/10 text-[#A64D4D] border border-[#A64D4D]/15 px-2.5 py-1 rounded-[8px] text-[10px] font-[800] uppercase tracking-wider flex items-center gap-1"><Flame size={12} className="animate-pulse"/> Active</span>;
      case 'Secured': return <span className="bg-[#4E6B4A]/10 text-[#4E6B4A] border border-[#4E6B4A]/15 px-2.5 py-1 rounded-[8px] text-[10px] font-[800] uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12}/> Secured</span>;
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
    <div className="flex flex-col gap-[28px] w-full pb-10">
      
      {/* Header — matches Admin */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
           <h2 className="text-3xl font-black text-[#1F2A22]">Incidents Tracker</h2>
           <p className="text-[#6B7468] font-bold text-[14px]">Monitor active fires and submit intervention completion.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7468]" size={18} />
          <input
            type="text"
            placeholder="Search by zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-[13px] font-[600] bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[12px] focus:outline-none focus:bg-white focus:border-[#B88A44]/30 transition-all text-[#1F2A22] placeholder-[#6B7468]/60"
          />
        </div>
      </div>

      {/* Table — matches Admin table style */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#ECE9E1]/60 border-b border-[#4F5C4A]/[0.08]">
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">ID</th>
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">Location</th>
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">Date / Duration</th>
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">Cause</th>
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">Status</th>
                <th className="p-5 text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
               {loading ? (
                 <tr><td colSpan="6" className="p-12 text-center text-[#6B7468] font-[700] text-[13px]">Loading database...</td></tr>
               ) : filtered.length === 0 ? (
                 <tr><td colSpan="6" className="p-12 text-center text-[#6B7468] font-[700] text-[14px]">No incidents found in the database.</td></tr>
               ) : filtered.map(inc => (
                 <tr key={inc.id} className="border-b border-[#4F5C4A]/[0.05] hover:bg-[#ECE9E1]/40 transition-colors">
                    <td className="p-5">
                      <span className="font-mono text-[11px] font-[800] text-[#6B7468] bg-[#ECE9E1] px-2 py-1 rounded-[8px]">
                        #{inc.id}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-[#4E6B4A]" />
                        <span className="font-[800] text-[13px] text-[#1F2A22]">{inc.zone}</span>
                      </div>
                    </td>
                    <td className="p-5">
                       <span className="font-[700] text-[13px] text-[#1F2A22] flex items-center gap-1">
                         <Clock size={12} className="text-[#6B7468]"/> {new Date(inc.startDate).toLocaleDateString()}
                       </span>
                       {inc.endDate && (
                         <span className="text-[10px] text-[#6B7468] font-[700] block mt-1 uppercase tracking-wider">End: {new Date(inc.endDate).toLocaleDateString()}</span>
                       )}
                    </td>
                    <td className="p-5 text-[13px] font-[700] text-[#6B7468]">{inc.cause}</td>
                    <td className="p-5">
                      {getStatusBadge(inc.status)}
                    </td>
                    <td className="p-5 text-right">
                      {inc.status === 'Active' ? (
                        <button 
                          onClick={() => handleFinishIntervention(inc.id)}
                          className="bg-[#4E6B4A] hover:bg-[#3d5439] text-white px-4 py-2 rounded-[10px] text-[10px] font-[800] uppercase tracking-wider transition-all shadow-md shadow-[#4E6B4A]/20 inline-flex items-center gap-2"
                        >
                          Finish Intervention
                        </button>
                      ) : (
                        <button disabled className="bg-[#ECE9E1] text-[#6B7468] px-4 py-2 rounded-[10px] text-[10px] font-[800] uppercase tracking-wider transition-all cursor-not-allowed inline-flex items-center gap-2 border border-[#4F5C4A]/[0.10]">
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
