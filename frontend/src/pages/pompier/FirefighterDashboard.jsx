import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Radio, UserCheck, Activity, Users, Flame,
  AlertTriangle, XCircle, Building2
} from 'lucide-react';
import axios from 'axios';
import useFirefighterSocket from '../../hooks/useFirefighterSocket';
import IncidentNotificationModal from '../../components/pompier/IncidentNotificationModal';

export const FirefighterDashboard = () => {
  const { 
    incidents, firefighters, myStatus, updateStatus, 
    isConnected, setInitialFirefighters, acceptMission, refuseMission 
  } = useFirefighterSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States Locaux
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [recentMissions, setRecentMissions] = useState([]);

  // Mock de l'utilisateur connecté (Chef d'équipe)
  const currentUser = { id: 1, nom: 'El Idrissi', prenom: 'Karim', grade: 'Commander', equipe_id: 1 };

  // Fetch initial des pompiers et des missions de l'équipe
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Simuler des appels API si les vrais n'existent pas encore
        try {
          const resPompiers = await axios.get('/api/pompiers', { headers });
          if (Array.isArray(resPompiers.data)) {
            setInitialFirefighters(resPompiers.data);
          } else {
            throw new Error("Not an array");
          }
        } catch (e) {
             console.warn("Utilisation de mock pour les pompiers", e);
             setInitialFirefighters([
                { id_pompier: 1, nom: 'El Idrissi', prenom: 'Karim', matricule: 'M-1023', grade: 'Lieutenant', telephone: '0661234567', specialite: 'Commandement', statut: 'disponible', equipe: 'Alpha' },
                { id_pompier: 2, nom: 'Benali', prenom: 'Youssef', matricule: 'M-1045', grade: 'Capitaine', telephone: '0661234568', specialite: 'Aéroporté', statut: 'en_intervention', equipe: 'Bravo' },
                { id_pompier: 3, nom: 'Touzani', prenom: 'Amine', matricule: 'M-1088', grade: 'Sapeur', telephone: '0661234569', specialite: 'Lutte terrain', statut: 'repos', equipe: 'Alpha' },
             ]);
        }

        try {
          const resMissions = await axios.get(`/api/equipes/${currentUser.equipe_id}/missions`, { headers });
          if (Array.isArray(resMissions.data)) {
            setRecentMissions(resMissions.data);
          } else {
            throw new Error("Not an array");
          }
        } catch (e) {
          console.warn("Utilisation de mock pour les missions", e);
          setRecentMissions([
             { id: 101, zone: 'Amskroud Forest', temp: '54°C', statut: 'Completed', date: '2026-03-29', duree: '4h 30m' },
             { id: 102, zone: 'Souss-Massa National Park', temp: '62°C', statut: 'In Progress', date: 'Today', duree: '1h 15m' },
          ]);
        }

      } catch (err) {
        setError('Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setInitialFirefighters, currentUser.equipe_id]);

  // Derived state (Stats)
  const stats = useMemo(() => {
    return {
      disponibles: firefighters.filter(f => f.statut === 'disponible').length,
      enIntervention: firefighters.filter(f => f.statut === 'en_intervention').length,
      equipesDeployees: [...new Set(firefighters.filter(f => f.statut === 'en_intervention').map(f => f.equipe))].length,
      incidentsActifs: incidents.length,
      cooperatives: 24, // Mock: data placeholder
      alertesAnnoncees: incidents.length + 3, // Mock: data placeholder
    };
  }, [firefighters, incidents]);

  // State dependencies removed for filters since Team List is removed

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      
      {/* Header Modal - Incident Notification */}
      {selectedIncident && (
        <IncidentNotificationModal 
          incident={selectedIncident} 
          onClose={() => setSelectedIncident(null)}
          onAccept={acceptMission}
          onRefuse={refuseMission}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-8 pt-6 pb-12 space-y-8">
        
        {/* HEADER DASHBOARD */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Manage missions and monitor incidents in real-time.</p>
          </div>

          {/* Connectivité Socket */}
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">{isConnected ? 'Connected (Live)' : 'Offline'}</span>
          </div>
        </header>

        {/* ERREUR BANNER */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 flex items-center justify-between rounded-r-xl">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-rose-500 mr-2"/>
              <p className="text-sm text-rose-700 font-bold">{error}</p>
            </div>
            <button onClick={() => setError(null)}><XCircle className="h-5 w-5 text-rose-400 hover:text-rose-600"/></button>
          </div>
        )}
        
        {/* SECTION 1 - STATS */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard title="Cooperatives" value={stats.cooperatives} icon={Building2} color="slate" />
          <StatCard title="Total Alerts" value={stats.alertesAnnoncees} icon={ShieldAlert} color="rose" />
          <StatCard title="Available Staff" value={stats.disponibles} icon={UserCheck} color="emerald" />
          <StatCard title="Deployments" value={stats.enIntervention} icon={Radio} color="orange" />
          <StatCard title="Active Incidents" value={stats.incidentsActifs} icon={Flame} color="rose" animatePulse={stats.incidentsActifs > 0} />
          <StatCard title="Deployed Teams" value={stats.equipesDeployees} icon={Users} color="slate" />
        </section>

        {/* SECTION 2 - NOTIFICATIONS EN ATTENTE */}
        <AnimatePresence>
          {incidents.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200 rounded-3xl p-6 shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                </span>
                <h2 className="text-xl font-black text-rose-900 tracking-tight">Incidents Awaiting Response</h2>
                <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">{incidents.length}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incidents.map((incident) => (
                  <motion.div 
                    key={incident.id_alerte} 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl p-5 border shadow-sm border-rose-100 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{incident?.zone?.nom_zone || 'Unknown Zone'}</h4>
                      <p className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded inline-block">Level: {incident?.niveau_urgence}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedIncident(incident)}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                    >
                      View Details
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* SECTION 4 - MISSIONS RECENTES (Full width now since team list is removed) */}
        <div className="grid grid-cols-1 gap-8">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recent Missions</h2>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="py-4 px-5 text-xs font-black text-slate-400 uppercase tracking-widest">Zone & Temp.</th>
                       <th className="py-4 px-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="py-4 px-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                     </tr>
                   </thead>
                   <tbody>
                      {recentMissions.map((mission, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4 px-5">
                            <p className="font-bold text-slate-800 text-sm mb-0.5">{mission.zone}</p>
                            <p className="text-xs text-rose-500 font-bold bg-rose-50 inline-block px-1.5 rounded">{mission.temp}</p>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${mission.statut === 'Completed' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                              {mission.statut}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                             <p className="text-xs font-semibold text-slate-500">{mission.date}</p>
                             <p className="text-[10px] text-slate-400 font-medium">{mission.duree}</p>
                          </td>
                        </tr>
                      ))}
                      {recentMissions.length === 0 && (
                        <tr><td colSpan="3" className="py-8 text-center text-sm text-slate-400">No recent missions.</td></tr>
                      )}
                   </tbody>
                 </table>
               </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

// Extrait Helper pour StatCard
const colorMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600' }
};

const StatCard = ({ title, value, icon: Icon, color, animatePulse }) => {
  const tColor = colorMap[color] || colorMap.slate;
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h3>
        <div className={`p-2 rounded-xl ${tColor.bg} ${tColor.text} ${animatePulse ? 'animate-pulse' : ''}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`text-4xl font-black text-slate-800 relative z-10 ${animatePulse ? tColor.text : ''}`}>{value}</p>
      {/* Deco BG */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${tColor.bg} rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0`}></div>
    </div>
  );
};

export default FirefighterDashboard;
