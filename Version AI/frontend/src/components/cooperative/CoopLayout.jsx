import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Cpu, Bell, Map as MapIcon, LogOut,
  Menu, X, Leaf, Flame, Search, BellDot, ChevronRight
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
    { name: "My Zones", path: "/coop/zones", icon: Leaf },
    { name: "Sensors", path: "/coop/sensors", icon: Cpu },
    { name: "Alerts", path: "/coop/alerts", icon: Bell, badge: true },
    { name: "Map View", path: "/coop/map", icon: MapIcon },
  ];

  const fetchActiveAlerts = async () => {
    try {
      const response = await axios.get(`/api/cooperative/${coopId}/alerts`);
      const allAlerts = Array.isArray(response.data) ? response.data : [];
      // Filter for active/open alerts only
      const openAlerts = allAlerts.filter(a => a.statut === "active" || a.statut === "OUVERTE");
      setActiveAlerts(openAlerts);
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

  const currentNav = navigation.find((item) => item.path === location.pathname);
  const pageTitle = currentNav?.name || "Dashboard";

  const userInitials = `${user.prenom?.[0] || "C"}${user.nom?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex h-screen w-full bg-[#ECE9E1] text-[#1F2A22] overflow-hidden">

      {/* Fixed Sidebar */}
      <aside className="w-[228px] bg-[#DCE3D6] hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r border-[#4F5C4A]/[0.10] overflow-hidden">

        {/* Argan Branch Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 90 Q 30 50 80 10 M80 10 Q 70 30 90 40 M30 50 Q 20 30 40 20' stroke='%232F4A36' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '150px' }}></div>

        <div className="p-8 pb-6 relative z-10">
          <Link to="/coop/dashboard" className="flex flex-col items-start gap-0.5">
            <div className="flex items-center">
              <img src="/arganLogo.png" alt="Argan Fire Watch" className="h-12 w-14 object-contain" />
              <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
                <span className="text-[#4E6B4A] font-bold">Argan</span><br />
                <span className="text-[#B88A44]"> Fire Watch</span>
              </span>
            </div>
            <span className="text-[9px] leading-none text-[#6B7468] font-semibold uppercase tracking-widest ml-1 mt-1">
              Cooperative Portal
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 relative z-10 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2.5 h-[44px] px-3 rounded-[12px] transition-all duration-200 group ${
                  isActive
                    ? "bg-[#CBD8C8] text-[#2F4A36] font-bold"
                    : "text-[#6B7468] hover:bg-[#CBD8C8]/50 hover:text-[#1F2A22] font-semibold"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-[#B88A44] rounded-r-full shadow-[0_0_8px_rgba(184,138,68,0.4)]" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    isActive ? "text-[#2F4A36]" : "text-[#6B7468] group-hover:text-[#4E6B4A]"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[14px] flex-1">{item.name}</span>
                {item.badge && activeAlerts.length > 0 && (
                  <span className={`text-[10px] font-[900] px-2 py-0.5 rounded-full ${
                    isActive ? "bg-[#B88A44]/20 text-[#B88A44]" : "bg-[#B55A3C]/15 text-[#B55A3C]"
                  }`}>
                    {activeAlerts.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 relative z-10 mb-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 h-[44px] w-full px-3 text-[#6B7468] hover:bg-[#F8F7F2]/50 hover:text-[#1F2A22] rounded-[16px] transition-all duration-200 font-bold"
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-[228px] h-screen overflow-hidden bg-[#ECE9E1]">

        {/* Header */}
        <header className="h-[80px] shrink-0 px-[32px] md:px-[40px] flex items-center justify-between border-b border-[#4F5C4A]/[0.08] bg-[#ECE9E1]/80 backdrop-blur-md sticky top-0 z-40">

          {/* Mobile toggle */}
          <div className="flex items-center gap-4 md:hidden mr-4">
            <button
              className="p-2 text-[#6B7468] bg-[#F8F7F2] rounded-[12px] border border-[#4F5C4A]/[0.10]"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col pt-1">
            <p className="text-[11px] mb-0.5 opacity-90 text-[#6B7468] font-semibold uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-baseline gap-3">
              <h1 className="text-[22px] font-[800] text-[#1F2A22] tracking-tight leading-none">
                {pageTitle}
              </h1>
              <div className="flex items-center gap-1.5 text-[12px] text-[#2F4A36] bg-[#4E6B4A]/12 px-2 py-0.5 rounded-full font-[700] hidden sm:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4E6B4A] animate-pulse"></div>
                Monitoring Active
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#F8F7F2]/60 rounded-[12px] transition-all">
                <Search className="w-4 h-4" />
              </button>
              <button className="relative w-9 h-9 flex items-center justify-center text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#F8F7F2]/60 rounded-[12px] transition-all">
                <BellDot className="w-4 h-4" />
                {activeAlerts.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#B55A3C] ring-2 ring-[#ECE9E1] rounded-full"></span>
                )}
              </button>
            </div>

            <div className="h-6 w-px bg-[#4F5C4A]/20 hidden sm:block"></div>

            {/* User profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-[800] text-[#1F2A22] leading-none mb-0.5">
                  {user.prenom || "Coop"} {user.nom || "Owner"}
                </p>
                <p className="text-[10px] text-[#6B7468] font-[700] uppercase tracking-wider leading-none opacity-80">
                  Cooperative Owner
                </p>
              </div>
              <div className="w-[38px] h-[38px] rounded-[12px] bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] flex items-center justify-center text-[#4E6B4A] font-[800] text-[14px] shadow-sm">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full relative p-[28px] md:p-[32px] h-full">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="fixed inset-0 bg-[#1F2A22]/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[228px] bg-[#DCE3D6] shadow-2xl flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-[#4F5C4A]/[0.10]">
              <div className="flex items-center mt-1">
                <img src="/arganLogo.png" alt="Argan Fire Watch" className="h-12 w-14 object-contain" />
                <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
                  <span className="text-[#4E6B4A] font-bold">Argan</span><br />
                  <span className="text-[#B88A44]"> Fire Watch</span>
                </span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#6B7468] hover:bg-[#CBD8C8] rounded-[10px] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative flex items-center gap-2.5 h-[44px] px-3 rounded-[12px] transition-all ${
                      isActive
                        ? "bg-[#CBD8C8] text-[#2F4A36] font-bold"
                        : "text-[#6B7468] hover:bg-[#CBD8C8]/50 hover:text-[#1F2A22] font-semibold"
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[20px] bg-[#B88A44] rounded-r-full" />}
                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[14px]">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#4F5C4A]/[0.10]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 h-[44px] w-full px-3 text-[#6B7468] hover:bg-[#F8F7F2]/50 hover:text-[#1F2A22] rounded-[12px] transition-all font-bold"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="text-[14px]">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


