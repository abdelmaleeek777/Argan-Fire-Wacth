import React from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { Activity, Bell, Map as MapIcon, LogOut, Trees } from "lucide-react";

const CoopLayout = () => {
  const location = useLocation();

  // In a real app we would check auth here
  const isAuthenticated = !!localStorage.getItem("token");
  const isCoop = localStorage.getItem("role") === "cooperative"; // Add your role check

  // Temporarily bypass auth check for UI building
  // if (!isAuthenticated || !isCoop) {
  //   return <Navigate to="/login" replace />;
  // }

  const navLinks = [
    {
      path: "/coop/dashboard",
      label: "Dashboard",
      icon: Activity,
    },
    {
      path: "/coop/alerts",
      label: "My Alerts",
      icon: Bell,
    },
    {
      path: "/coop/map",
      label: "Zone Map",
      icon: MapIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 hidden md:flex">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Cooperative Area</h2>
              <p className="text-xs text-slate-500">Tifawt Argan</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">Menu</p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-orange-50 text-orange-600 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-orange-500"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-orange-500" : "text-slate-400 group-hover:text-orange-400"
                    }`}
                  />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all w-full group"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Nav (Bottom Bar) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 pb-safe">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px] ${
                  isActive ? "text-orange-600" : "text-slate-500"
                }`}
              >
                <div className={`p-1.5 rounded-full ${isActive ? "bg-orange-50" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full md:pb-0 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CoopLayout;
