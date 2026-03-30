import React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Leaf,
  Flame,
  Bell,
  Map,
  Users,
  ArrowRight,
  Play,
} from "lucide-react";
import { Link } from "react-router-dom";

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
  >
    <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
      <Icon className="w-8 h-8 text-emerald-600 group-hover:text-white" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
      {title}
    </h3>
    <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/50 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/30 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-4 text-center">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-5 py-2.5 rounded-full mb-10 shadow-sm"
          >
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-widest">
              Protecting Morocco's Green Gold
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl lg:text-8xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter"
          >
            Preserving our{" "}
            <span className="text-emerald-600 italic">Argan Forest</span>{" "}
            <br className="hidden lg:block" />
            through Innovation.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Advanced real-time monitoring powered by IoT and AI to protect
            Morocco's unique Argan ecosystem from environmental threats and
            wildfires.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-12 py-5 rounded-[1.5rem] transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95"
            >
              Join the Network
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 rounded-[1.5rem] font-bold text-slate-700 border border-slate-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-emerald-600">
                <Play size={18} fill="currentColor" />
              </div>
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-40 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Advanced Surveillance
            </h2>
            <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Flame}
              title="Early Detection"
              description="Smart sensors detecting heat variations and smoke patterns in milliseconds across the entire forest canopy."
              delay={0.1}
            />
            <FeatureCard
              icon={Bell}
              title="Instant Alerts"
              description="Real-time notifications sent directly to local cooperatives and fire services the moment a threat is identified."
              delay={0.2}
            />
            <FeatureCard
              icon={Map}
              title="AI Mapping"
              description="High-precision digital mapping of risk zones with predictive analysis for fire propagation tracking."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="relative py-24 lg:py-40 px-4 bg-white border-y border-slate-100"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
              Safeguarding Morocco's <br />
              Natural Heritage.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              The Argan forest is more than just trees; it's a vital ecosystem
              and a lifeline for thousands of families in Morocco's southwestern
              regions.
            </p>
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-600 mb-1">
                  24/7
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Monitoring
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-600 mb-1">
                  99%
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Accuracy
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-600 mb-1">
                  500+
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Sensors
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div className="relative p-12 bg-slate-50 rounded-[3rem] border border-slate-100">
            <Shield
              size={200}
              className="text-emerald-500/5 absolute -bottom-10 -right-10"
            />
            <div className="relative text-center">
              <div className="bg-white p-6 rounded-[2rem] inline-block mb-6 shadow-xl border border-slate-100">
                <Shield size={48} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                Enterprise Security
              </h3>
              <p className="text-slate-400 text-sm">
                Advanced encryption for forest safety data.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto bg-emerald-900 rounded-[4rem] p-16 text-center shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={300} className="text-white" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-black mb-8 tracking-tight">
            Ready to join?
          </h2>
          <p className="text-emerald-100/70 mb-12 text-lg max-w-xl mx-auto leading-relaxed">
            Help us expand the monitoring network and secure the future of the
            Argan ecosystem.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 bg-white text-emerald-900 font-black px-12 py-5 rounded-[2rem] hover:shadow-xl transition-all active:scale-95"
          >
            Join Argan-Fire Watch
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="py-16 px-4 text-center text-slate-400 text-sm font-medium uppercase tracking-widest">
        © 2026 Argan-Fire Watch. <br className="sm:hidden" />
        Technology for Morocco's Biodiversity.
      </footer>
    </div>
  );
};

export default LandingPage;
