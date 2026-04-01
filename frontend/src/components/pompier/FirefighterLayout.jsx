import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Map,
  ShieldAlert,
  Flame
} from "lucide-react";

const FirefighterLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/pompier/dashboard", icon: LayoutDashboard },
    { name: "System Map", path: "/pompier/map", icon: Map },
    { name: "Fire Alerts", path: "/pompier/alerts", icon: ShieldAlert },
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
                Team Leader
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"}`}
                />
                {item.name}
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
            <span className="font-bold text-slate-900">Team Leader Portal</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
              {navItems.find((item) => item.path === location.pathname)?.name || "Team Leader Space"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800 leading-none">
                  El Idrissi
                </p>
                <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-widest">
                  Commander
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black shadow-md border-2 border-white">
                EI
              </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FirefighterLayout;
