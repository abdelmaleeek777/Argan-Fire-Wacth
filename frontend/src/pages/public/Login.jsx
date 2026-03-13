import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        },
      );

      if (response.status === 200) {
        const data = response.data;
        console.log("Login successful:", data.message);

        if (data.user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reach the server. Please check your connection.",
      );
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-100/50 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-100/30 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] p-8 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
          {/* Subtle Decorative Ring */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20"
            >
              <ShieldCheck className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              Argan-Fire Watch
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 text-rose-600 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arganfire.ma"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium placeholder:text-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-3 active:scale-[0.98] text-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Sign In to Portal"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center relative z-10">
            <p className="text-slate-400 text-xs font-medium">
              Cooperative owner?
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-extrabold ml-1.5 inline-flex items-center gap-1 group"
              >
                Register
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
