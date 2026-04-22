import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronRight } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/#features" },
    { name: "About", path: "/#about" },
  ];

  return (
    <div className="absolute top-0 left-0 w-full z-[100] transition-colors duration-500">
      <nav
        className={`w-full transition-all duration-500 ${
          scrolled
            ? "bg-[#F8F7F2]/80 backdrop-blur-lg border-b border-[#4F5C4A]/[0.08] shadow-[0_4px_24px_rgba(31,42,33,0.02)]"
            : "bg-transparent py-2 border-b border-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-3 flex justify-between items-center">
          {/* Logo Area */}
          <Link to="/" className="flex items-center group">
            <img
              src="/arganLogo.png"
              alt="Argan Fire Watch"
              className="h-16 w-14 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
              <span className="text-[#4E6B4A] font-bold">Argan</span>
              <br />
              <span className="text-[#B88A44]"> Fire Watch</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isHash = link.path.startsWith("/#");
              const isActive =
                location.pathname === link.path ||
                (location.pathname === "/" && link.path === "/"); // simplfied logic for visual demo

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    if (isHash && window.location.pathname === "/") {
                      const targetId = link.path.replace("/#", "");
                      const targetElement = document.getElementById(targetId);
                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: "smooth" });
                      }
                    } else if (
                      link.path === "/" &&
                      window.location.pathname === "/"
                    ) {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-[13px] font-[800] tracking-widest uppercase transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? "text-[#4E6B4A] bg-[#DCE3D6]/60"
                      : "text-[#6B7468] hover:text-[#2F4A36]"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {!isActive && (
                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#4E6B4A] -translate-x-1/2 group-hover:w-1/2 transition-all duration-300 rounded-t-full opacity-0 group-hover:opacity-100" />
                  )}
                </Link>
              );
            })}

            <div className="w-px h-5 bg-[#4F5C4A]/20 mx-3" />

            <Link
              to="/login"
              className="px-4 py-2 text-[13px] font-[800] tracking-widest uppercase text-[#6B7468] hover:text-[#1F2A22] transition-colors"
            >
              Log In
            </Link>

            <Link
              to="/register"
              className="bg-[#4E6B4A] hover:bg-[#3A5037] text-white px-5 py-2.5 rounded-[14px] text-[12px] font-[800] uppercase tracking-widest transition-all shadow-md shadow-[#4E6B4A]/20 hover:shadow-lg hover:shadow-[#4E6B4A]/30 active:scale-95 flex items-center gap-1.5 border border-[#B88A44]/30 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B88A44]/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
              <span className="relative z-10">Sign Up</span>
              <ChevronRight
                size={14}
                className="relative z-10 group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-[12px] transition-colors text-[#6B7468] hover:bg-[#DCE3D6]/50"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="md:hidden bg-[#F8F7F2]/95 backdrop-blur-xl border-b border-[#4F5C4A]/10 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-[14px] font-[800] uppercase tracking-widest text-[#6B7468] hover:text-[#4E6B4A] hover:bg-[#DCE3D6]/50 rounded-[16px] transition-all"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 mt-4 border-t border-[#4F5C4A]/[0.08] flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-[14px] font-[800] uppercase tracking-widest text-[#1F2A22] py-4 rounded-[16px] hover:bg-[#DCE3D6]/30 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-[#4E6B4A] text-white py-4 rounded-[16px] text-[14px] font-[800] uppercase tracking-widest shadow-md border border-[#B88A44]/20"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
