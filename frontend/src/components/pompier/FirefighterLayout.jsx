import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Bell,
  ShieldAlert,
  Flame,
  Map,
  AlertTriangle
} from "lucide-react";
import api from "../../utils/axiosInstance";

const FirefighterLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAlerts, setActiveAlerts] = useState(0);
  
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.nom || user.prenom || 'Firefighter';
  const userRole = user.role || 'POMPIER';
  const initials = (user.prenom?.[0] || 'F') + (user.nom?.[0] || '');

  // Fetch active alerts count
  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const res = await api.get('/dashboard/pompier/stats');
        setActiveAlerts(res.data.alertesActives || 0);
      } catch (err) {
        console.log('Could not fetch alerts count');
      }
    };
    
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("pompierStatus");
    localStorage.removeItem("currentMission");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/pompier/dashboard", icon: LayoutDashboard },
    { name: "Alerts", path: "/pompier/alertes", icon: AlertTriangle, badge: activeAlerts },
    { name: "Map", path: "/pompier/map", icon: Map },
    { name: "Incidents", path: "/pompier/incidents", icon: ShieldAlert },
    
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link to="/pompier/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-xl text-slate-900 tracking-tight leading-none block">
                Argan-Fire
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 block">
                Firefighter
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                  />
                  {item.name}
                </div>
                {item.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-slate-400 hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-slate-900">Firefighter Portal</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {navItems.find((item) => item.path === location.pathname)?.name || "Firefighter Portal"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 leading-none">
                  {userName}
                </p>
                <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-widest">
                  {userRole}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black shadow-md border-2 border-white">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FirefighterLayout;
