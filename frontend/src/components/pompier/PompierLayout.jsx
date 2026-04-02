import React, { createContext, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Home, Bell, Flame, Activity, FileText,
  LogOut, ShieldAlert, User, WifiHigh
} from 'lucide-react';
import api from '../../utils/axiosInstance';

export const SocketContext = createContext(null);

const navLinks = [
  { path: '/pompier/dashboard', name: 'Dashboard', icon: Home },
  { path: '/pompier/alertes', name: 'Alertes', icon: Bell, badgeType: 'alertes' },
  { path: '/pompier/incendies', name: 'Incendies', icon: Flame },
  { path: '/pompier/capteurs', name: 'Capteurs', icon: Activity },
  { path: '/pompier/interventions', name: 'Interventions', icon: FileText },
  { path: '/pompier/notifications', name: 'Notifications', icon: Bell, badgeType: 'notifications' },
];

export default function PompierLayout() {
  const [socket, setSocket] = useState(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const navigate = useNavigate();

  // Données mockées ou fetchées
  const [user, setUser] = useState({
    id_pompier: 1,
    nom: 'Benani',
    prenom: 'Omar',
    matricule: 'P-1042',
    grade: 'lieutenant',
    statut: 'disponible',
    equipe: { nom_equipe: 'Alpha' }
  });

  useEffect(() => {
    // Initialisation du socket
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connecté (Pompier)');
    });

    newSocket.on('nouvelle_alerte', () => {
      setUnreadAlerts(prev => prev + 1);
    });

    newSocket.on('nouvelle_notification', () => {
      setUnreadNotifs(prev => prev + 1);
    });

    return () => newSocket.close();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <SocketContext.Provider value={{ socket, user }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shadow-sm relative z-20">
          <div className="p-6 pb-2 border-b border-slate-100/50">
            <div className="flex items-center gap-3 text-emerald-600 mb-8">
              <ShieldAlert size={28} className="stroke-[2.5]" />
              <h1 className="font-black text-xl tracking-tight">Argan-Fire Watch</h1>
            </div>
            
            <div className="mb-6 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user.prenom} {user.nom}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user.grade} - Eq. {user.equipe.nom_equipe}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-emerald-900/5 shadow-md' 
                        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} strokeWidth={2.5} />
                    <span className="font-bold text-sm tracking-wide">{link.name}</span>
                  </div>
                  {link.badgeType === 'alertes' && unreadAlerts > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                      {unreadAlerts}
                    </span>
                  )}
                  {link.badgeType === 'notifications' && unreadNotifs > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {unreadNotifs}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors font-bold text-sm"
            >
              <LogOut size={20} strokeWidth={2.5} />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 flex justify-around p-3 pb-safe">
          {navLinks.filter(l => ['Dashboard', 'Alertes', 'Incendies', 'Interventions', 'Capteurs'].includes(l.name)).map(link => {
             const Icon = link.icon;
             return (
               <NavLink
                 key={link.path}
                 to={link.path}
                 className={({isActive}) => `flex flex-col items-center p-2 rounded-xl ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}
               >
                 <Icon size={24} />
                 <span className="text-[10px] font-bold mt-1">{link.name}</span>
               </NavLink>
             );
          })}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 h-full relative">
          <Outlet />
        </main>
      </div>
    </SocketContext.Provider>
  );
}
