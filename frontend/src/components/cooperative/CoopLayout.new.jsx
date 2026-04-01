import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Cpu, Bell, Map as MapIcon, LogOut,
  Menu, X, TreePine, Leaf, Settings, HelpCircle, Search, Mail, BellDot
} from "lucide-react";
import axios from "axios";

export default function CoopLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  const navigation = [
    { name: "Dashboard", path: "/coop/dashboard", icon: LayoutDashboard },
    { name: "Zones", path: "/coop/zones", icon: Leaf },
    { name: "Sensors", path: "/coop/sensors", icon: Cpu },
    { name: "Alerts", path: "/coop/alerts", icon: Bell, badge: true },
    { name: "Map", path: "/coop/map", icon: MapIcon },
    { name: "Settings", path: "/coop/settings", icon: Settings },
    { name: "Help", path: "/coop/help", icon: HelpCircle },
  ];

  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get(`/api/cooperative/${coopId}/alerts?limit=5&statut=OUVERTE`);
      setActiveAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    if (coopId) {
      fetchActiveAlerts();
      const interval = setInterval(fetchActiveAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [coopId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafb]">
      {/* Clean Sidebar - Desktop */}
      <aside className="hidden lg:flex w-56 flex-col fixed top-0 left-0 h-screen bg-white border-r border-gray-100">
        {/* Logo */}
        <div className="p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TreePine className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-emerald-600">ArganFire</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.badge && activeAlerts.length > 0 && (
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"
                  }`}>
                    {activeAlerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* User Info - Left side */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                <span className="text-emerald-700 font-bold text-sm">
                  {(user.prenom?.[0] || 'U')}{(user.nom?.[0] || '')}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{user.prenom || 'User'} {user.nom || ''}</p>
                <p className="text-xs text-gray-500">{user.email || 'manager@coop.com'}</p>
              </div>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
                />
              </div>

              {/* Icons */}
              <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                <Mail className="w-5 h-5" />
              </button>
              <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                <BellDot className="w-5 h-5" />
                {activeAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  ⋮
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <TreePine className="text-white w-4 h-4" />
                </div>
                <span className="font-bold text-lg text-emerald-600">ArganFire</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="p-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-emerald-500 text-white" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
