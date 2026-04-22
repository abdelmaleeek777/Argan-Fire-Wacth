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
  FileText,
  Search,
  Bell,
  Leaf,
  Flame
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

  const currentNav = navItems.find((item) => item.path === location.pathname);
  const pageTitle = currentNav?.name || "Dashboard";

  return (
    <div className="flex h-screen w-full bg-[#ECE9E1] text-[#1F2A22] overflow-hidden">
      
      {/* Fixed Sidebar */}
      <aside className="w-[228px] bg-[#DCE3D6] hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r border-[#4F5C4A]/[0.10] overflow-hidden">
        
        {/* Subtle Argan Branch Pattern SVG */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 90 Q 30 50 80 10 M80 10 Q 70 30 90 40 M30 50 Q 20 30 40 20' stroke='%232F4A36' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '150px' }}></div>
        
        <div className="p-8 pb-6 relative z-10">
          <Link to="/admin" className="flex flex-col items-start gap-0.5">
            <div className="flex items-center">
              <img src="/arganLogo.png" alt="Argan Fire Watch" className="h-12 w-14 object-contain" />
              <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
                <span className="text-[#4E6B4A] font-bold">Argan</span><br />
                <span className="text-[#B88A44]"> Fire Watch</span>
              </span>
            </div>
            <span className="metadata text-[9px] leading-none text-[#6B7468] ml-1 mt-1">
              Monitoring Center
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 relative z-10 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
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
                <span className="text-[14px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
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
        
        {/* Header - Fixed height */}
        <header className="h-[80px] shrink-0 px-[32px] md:px-[40px] flex items-center justify-between border-b border-[#4F5C4A]/[0.08] bg-[#ECE9E1]/80 backdrop-blur-md sticky top-0 z-40">
          {/* Mobile Nav Toggle */}
          <div className="flex items-center gap-4 md:hidden mr-4">
            <button className="p-2 text-[#6B7468] bg-[#F8F7F2] rounded-[12px] border border-[#4F5C4A]/[0.10]">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col pt-1">
            <p className="metadata text-[11px] mb-0.5 opacity-90">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl text-[#1F2A22]">
                {pageTitle}
              </h1>
              <div className="flex items-center gap-1.5 text-[12px] text-[#2F4A36] bg-[#4E6B4A]/12 px-2 py-0.5 rounded-full font-[700] hidden sm:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4E6B4A] animate-pulse"></div>
                Systems Operational
              </div>
            </div>
          </div>

          {/* Right Box Tools */}
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#F8F7F2]/60 rounded-[12px] transition-all">
                <Search className="w-4.5 h-4.5" />
              </button>
              <button className="relative w-9 h-9 flex items-center justify-center text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#F8F7F2]/60 rounded-[12px] transition-all">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#B88A44] ring-2 ring-[#ECE9E1] rounded-full"></span>
              </button>
            </div>
            
            <div className="h-6 w-px bg-[#4F5C4A]/20 hidden sm:block"></div>
            
            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-[800] text-[#1F2A22] leading-none mb-0.5">
                  System Admin
                </p>
                <p className="text-[10px] text-[#6B7468] font-[700] uppercase tracking-wider leading-none opacity-80">
                  Secure Access
                </p>
              </div>
              <div className="w-[38px] h-[38px] rounded-[12px] bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] flex items-center justify-center text-[#4E6B4A] font-[800] text-[14px] shadow-sm">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto w-full relative p-[28px] md:p-[32px] custom-scrollbar h-full">
           <div className="max-w-[1600px] mx-auto">
             <Outlet />
           </div>
        </main>
      </div>
      
    </div>
  );
};

export default AdminLayout;
