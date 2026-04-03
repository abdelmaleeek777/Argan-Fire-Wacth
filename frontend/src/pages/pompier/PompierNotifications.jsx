import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flame, FileText, Server, CheckCheck, ArrowRight, Circle } from 'lucide-react';
import { SocketContext } from '../../components/pompier/PompierLayout';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosInstance';

export default function PompierNotifications() {
  const { socket, user } = useContext(SocketContext) || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreSelected, setFiltreSelected] = useState('Toutes');
  const navigate = useNavigate();

useEffect(() => {
  if (!user?.id_utilisateur) return;

  fetchNotifications();

  if (socket) {
    socket.on('nouvelle_notification', (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });
  }

  return () => {
    if (socket) socket.off('nouvelle_notification');
  };
}, [socket, user]);

const fetchNotifications = async () => {
  try {
    setLoading(true);

    const res = await api.get('/notifications', {
  params: { user_id: user?.id_utilisateur }
});

const data = res.data.map(n => ({
  id_notif: n.id_notif,
  type: n.type === "Alert" ? "Alerte" : n.type,
  message: n.message,
  lue: Boolean(n.is_read),          
  date: n.date,
  lier_alerte: n.linked_alert       
}));

setNotifications(data);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};





  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      // await api.patch(`/api/notifications/${id}/lire`);
      setNotifications(prev => prev.map(n => n.id_notif === id ? { ...n, lue: true } : n));
    } catch(err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // await api.patch('/api/notifications/lire-tout');
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
    } catch(err) {
      console.error(err);
    }
  };

  const getRelativeTime = (isoDate) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'À l\'instant';
    if (min < 60) return `Il y a ${min} min`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${Math.floor(hours / 24)} j`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Alerte': return <Flame className="text-rose-500" size={24} />;
      case 'Intervention': return <FileText className="text-orange-500" size={24} />;
      case 'Système': return <Server className="text-cyan-500" size={24} />;
      default: return <Bell className="text-emerald-500" size={24} />;
    }
  };

  // Filtrage
const filtered = notifications.filter(n => {
  if (filtreSelected === 'Toutes') return true;
  if (filtreSelected === 'Non lues') return !n.lue;
  if (filtreSelected === 'Alertes') return n.type === 'Alerte';
  if (filtreSelected === 'Interventions') return n.type === 'Intervention';
  if (filtreSelected === 'Système') return n.type === 'Système';
  return true;
});

  const counts = {
    'Toutes': notifications.length,
    'Non lues': notifications.filter(n => !n.lue).length,
    'Alertes': notifications.filter(n => n.type === 'Alerte').length,
    'Interventions': notifications.filter(n => n.type === 'Intervention').length,
    'Système': notifications.filter(n => n.type === 'Système').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Bell className="text-emerald-500"/> Notifications
          </h1>
          <p className="text-slate-500 font-medium mt-1">Historique des alertes et activités système.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          disabled={counts['Non lues'] === 0}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0"
        >
          <CheckCheck size={18} /> Tout marquer comme lu
        </button>
      </div>

      {/* Filtres alignés comme Pills */}
      <div className="flex flex-wrap items-center gap-3 py-2">
         {Object.keys(counts).map(filtre => (
           <button 
             key={filtre}
             onClick={() => setFiltreSelected(filtre)}
             className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
               filtreSelected === filtre 
                 ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                 : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
             }`}
           >
             {filtre.replace('Alertes', 'Alertes & Détections')}
             <span className={`px-2 py-0.5 rounded-full text-[10px] bg-white border border-slate-200 ${filtreSelected === filtre ? 'text-slate-800 font-black' : 'text-slate-500'}`}>
               {counts[filtre]}
             </span>
           </button>
         ))}
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl w-full" />)
        ) : filtered.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-3xl border border-slate-200 border-dashed text-slate-400 font-bold flex flex-col items-center justify-center gap-4">
             <Bell size={48} className="text-slate-200" />
             Aucune notification à afficher.
          </div>
        ) : (
          filtered.map((notif, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { if(!notif.lue) markAsRead(notif.id_notif) }}
              key={notif.id_notif}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                notif.lue 
                  ? 'bg-white border-slate-100/50 hover:border-slate-200 shadow-sm' 
                  : 'bg-emerald-50 border-emerald-200 hover:border-emerald-300 border-l-4 border-l-emerald-600 shadow-md transform hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                 <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm mt-1">
                    {getTypeIcon(notif.type)}
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.lue && <Circle size={8} fill="currentColor" className="text-emerald-600 animate-pulse" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${notif.lue ? 'text-slate-400' : 'text-emerald-700'}`}>{notif.type}</span>
                    </div>
                    <p className={`text-sm md:text-base leading-relaxed max-w-2xl ${notif.lue ? 'text-slate-400 font-medium' : 'text-slate-800 font-bold'}`}>
                      {notif.message}
                    </p>
                    <span className={`text-xs block mt-3 font-bold ${notif.lue ? 'text-slate-300' : 'text-emerald-600/60'}`}>
                      {getRelativeTime(notif.date)}
                    </span>
                 </div>
              </div>

              <div className="flex md:flex-col items-center justify-between gap-3 shrink-0 ml-14 md:ml-0 border-t border-slate-100 pt-4 md:border-none md:pt-0">
                {notif.lier_alerte && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/pompier/alertes`); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      notif.lue ? 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    Voir l'alerte <ArrowRight size={14} />
                  </button>
                )}
                {!notif.lue && (
                  <button 
                    onClick={(e) => markAsRead(notif.id_notif, e)}
                    className="text-emerald-600/50 hover:text-emerald-600 text-xs font-bold uppercase tracking-wider"
                  >
                    Marquer lu
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
}
