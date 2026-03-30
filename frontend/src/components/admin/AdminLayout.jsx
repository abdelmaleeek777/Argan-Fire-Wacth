import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Cpu,
  LogOut,
  Menu,
  Map,
  AlertTriangle,
  FileText
} from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "All Cooperatives", path: "/admin/cooperatives", icon: Building2 },
    { name: "Pending Approvals", path: "/admin/pending", icon: ShieldCheck },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Sensors", path: "/admin/sensors", icon: Cpu },
    { name: "Alerts", path: "/admin/alerts", icon: AlertTriangle },
    { name: "Fire Logs", path: "/admin/logs", icon: FileText },
    { name: "System Map", path: "/admin/map", icon: Map },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-emerald-900 tracking-tight">
              ArganFire Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-emerald-900">ArganFire Admin</span>
          </div>

          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.name ||
                "Admin"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 leading-none">
                  Admin User
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Super Administrator
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
