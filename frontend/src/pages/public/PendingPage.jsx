import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";

const PendingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-100/50 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-100/30 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-amber-900/5 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-amber-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20"
          >
            <Clock className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Under Review
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Your cooperative registration request is currently being reviewed by
            our administration team. You'll receive an email once your account
            has been approved.
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
            <p className="text-amber-700 text-xs font-semibold">
              ⏳ Typical review time is 1–3 business days
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingPage;
