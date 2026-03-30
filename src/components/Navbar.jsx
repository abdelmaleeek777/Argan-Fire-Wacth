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
    { name: "Admin", path: "/admin" },
    { name: "Coopérative", path: "/coop" },
    { name: "Pompier", path: "/pompier/dashboard" },
  ];

  return (
    <div className=" w-full z-50 px-4 sm:px-6 lg:px-8 pt-6 pointer-events-none">
      <nav
        className={`max-w-5xl mx-auto transition-all duration-500 pointer-events-auto ${scrolled
            ? "bg-white/80 backdrop-blur-2xl border border-slate-200 py-3 px-6 rounded-[2rem] shadow-xl"
            : "bg-transparent py-2 px-4"
          }`}
      >
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-600/20"
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Argan<span className="text-emerald-600">Fire</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isHash = link.path.startsWith("/#");

              if (isHash) {
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => {
                      if (window.location.pathname === "/") {
                        const targetId = link.path.replace("/#", "");
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-emerald-50 hover:text-emerald-600 text-slate-600"
                  >
                    {link.name}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    if (link.path === "/" && window.location.pathname === "/") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-emerald-50 hover:text-emerald-600 text-slate-600"
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <Link
              to="/login"
              className="font-medium text-sm px-4 py-2 transition-colors hover:text-emerald-600 text-slate-600"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-1"
            >
              Sign Up
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl transition-colors text-slate-600 hover:bg-slate-100"
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
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="md:hidden absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] p-6 shadow-2xl pointer-events-auto"
          >
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-4 text-base font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-slate-600 font-medium py-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg"
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
