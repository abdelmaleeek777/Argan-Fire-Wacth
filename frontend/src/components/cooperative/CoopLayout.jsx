import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  BarChart3, Cpu, Bell, Map as MapIcon, User, LogOut,
  Menu, X, ChevronRight
} from "lucide-react";
import axios from "axios";

export default function CoopLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  const navigation = [
    { name: "Dashboard", path: "/coop", icon: BarChart3 },
    { name: "My Zones", path: "/coop/zones", icon: MapIcon },
    { name: "Sensors", path: "/coop/sensors", icon: Cpu },
    { name: "Alerts", path: "/coop/alerts", icon: Bell, badge: true },
    { name: "Map", path: "/coop/map", icon: MapIcon },
  ];

  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/cooperative/${coopId}/alerts?limit=5&statut=OUVERTE`);
      setActiveAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    if (coopId) {
      fetchActiveAlerts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const interval = setInterval(fetchActiveAlerts, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [coopId, fetchActiveAlerts]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <MapIcon className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">ArganFire</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? "bg-emerald-50 text-emerald-700 font-semibold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && activeAlerts.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeAlerts.length}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 mb-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Right Actions */}
          <div className="flex items-center gap-3 lg:gap-5 ml-auto">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {activeAlerts.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white ring-2 ring-rose-200 animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden p-1 slide-in-from-top-2 animate-in duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Notifications</span>
                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                      {activeAlerts.length} ACTIVE
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {activeAlerts.length > 0 ? (
                      activeAlerts.map((alert) => (
                        <div key={alert.id_alerte} className="p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors cursor-pointer">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex-shrink-0 flex items-center justify-center">
                              <Bell className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{alert.zone}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{alert.message}</p>
                              <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase tracking-wider">
                                Temp: {alert.temperature_detectee}°C
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No active alerts</p>
                      </div>
                    )}
                  </div>
                  <Link to="/coop/alerts" className="block text-center py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
                    View all alerts
                  </Link>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

            {/* User Profile */}
            <div className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 rounded-xl transition-all">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-none">{user.prenom} {user.nom}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">Gérant Coop</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform shadow-sm">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Content Container */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-white h-full flex flex-col slide-in-from-left animate-in duration-300">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="text-emerald-600 w-6 h-6" />
                <span className="font-bold text-xl">ArganFire</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
