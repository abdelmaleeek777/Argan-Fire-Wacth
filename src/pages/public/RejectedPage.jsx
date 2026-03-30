import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowRight } from "lucide-react";

const RejectedPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-100/50 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-100/30 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-rose-900/5 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-rose-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/20"
          >
            <XCircle className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Request Declined
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
            Unfortunately, your cooperative registration request has been
            declined. You may submit a new registration with updated
            information.
          </p>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-8">
            <p className="text-rose-700 text-xs font-semibold">
              If you believe this is an error, please contact our support team.
            </p>
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/10 text-sm group"
          >
            Refill the form
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>

          <div className="mt-6">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RejectedPage;
