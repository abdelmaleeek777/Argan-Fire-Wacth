import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Activity,
  Trees,
  ThermometerSun
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
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (response.status === 200) {
        const data = response.data;
        const user = data.user;
        
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        localStorage.setItem("token", data.token);

        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (
          user.role === "POMPIER" ||
          user.role === "FIREFIGHTER" ||
          user.role === "CHEF_EQUIPE"
        ) {
          navigate("/pompier/dashboard");
        } else if (user.statut === "approved") {
          navigate("/coop/dashboard");
        } else if (user.statut === "pending") {
          navigate("/pending");
        } else if (user.statut === "rejected") {
          navigate("/rejected");
        } else {
          navigate("/coop/dashboard");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reach the server. Please check your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#F8F7F2] flex flex-col lg:flex-row font-sans">
      
      {/* LEFT SIDE: Immersive Argan Atmosphere */}
      <div className="hidden lg:flex w-1/2 relative bg-[#1F2A22] overflow-hidden flex-col justify-between p-16 border-r border-[#4F5C4A]/20">
        {/* Topographic lines / subtle textures */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 Q 30 40 50 10 T 90 10' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M10 30 Q 30 60 50 30 T 90 30' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M10 50 Q 30 80 50 50 T 90 50' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M10 70 Q 30 100 50 70 T 90 70' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px'
          }}
        />
        
        {/* Soft morning forest gradients */}
        <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] bg-[#B88A44]/10 blur-[130px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] -right-[30%] w-[90%] h-[90%] bg-[#4E6B4A]/30 blur-[150px] rounded-full mix-blend-screen" />

        {/* Content Wrapper */}
        <div className="relative z-10 space-y-4 max-w-lg mt-8">
          <div className="flex items-center mb-10">
            
          </div>
          <h1 className="text-[52px] font-[800] text-[#F8F7F2] leading-[1.1] tracking-tight">
            Protecting the <br/><span className="text-[#DCE3D6]">Argan Forest</span>
          </h1>
          <p className="text-[#CBD8C8] text-[18px] leading-relaxed font-medium max-w-md border-l-2 border-[#4E6B4A] pl-5 mt-6">
            A state-of-the-art environmental monitoring platform securing Morocco's biosphere heritage.
          </p>
        </div>

        {/* Floating Glass Statistics Cards */}
        <div className="relative z-10 w-full max-w-lg space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 flex items-center gap-5 w-3/4"
          >
            <div className="w-12 h-12 rounded-[12px] bg-[#4E6B4A]/40 flex items-center justify-center border border-[#4E6B4A]/50">
              <Trees className="w-6 h-6 text-[#DCE3D6]" />
            </div>
            <div>
              <p className="text-[11px] text-[#A3B19B] font-[800] uppercase tracking-widest mb-1">Active Zones</p>
              <p className="text-[20px] font-[700] text-[#F8F7F2]">+20 Cooperatives</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 flex items-center gap-5 w-3/4 ml-auto"
          >
            <div className="w-12 h-12 rounded-[12px] bg-[#B88A44]/20 flex items-center justify-center border border-[#B88A44]/30">
              <ThermometerSun className="w-6 h-6 text-[#E5D0B1]" />
            </div>
            <div>
              <p className="text-[11px] text-[#A3B19B] font-[800] uppercase tracking-widest mb-1">Live Sensors</p>
              <p className="text-[20px] font-[700] text-[#F8F7F2]">Real-time telemetry</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Premium Login Panel */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 sm:p-12">
        {/* Soft subtle background glow for mobile */}
        <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-[#B88A44]/5 blur-[120px] rounded-full pointer-events-none lg:hidden" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Main Card */}
          <div className="bg-[#F8F7F2]/80 backdrop-blur-2xl border border-[#4F5C4A]/10 rounded-[40px] p-10 sm:p-12 shadow-[0_20px_80px_rgba(31,42,33,0.08)] relative overflow-hidden">
            {/* Very subtle top glow inside the card */}
            <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-[#DCE3D6]/50 rounded-full blur-[80px] pointer-events-none" />
            
            {/* Header */}
            <div className="mb-10 relative z-10">
              {/* Mobile logo (hidden on desktop since it's on the left) */}
              <div className="lg:hidden flex items-center mb-6">
                <img src="/arganLogo.png" alt="Argan Fire Watch" className="h-12 w-14 object-contain" />
                <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
                  <span className="text-[#4E6B4A] font-bold">Argan</span><br />
                  <span className="text-[#B88A44]"> Fire Watch</span>
                </span>
              </div>
              <h2 className="text-[32px] font-[800] text-[#1F2A22] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-[14px] font-medium text-[#6B7468] mt-2">
                Enter your credentials to access the dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 border border-rose-100 p-4 rounded-[16px] flex items-center gap-3 text-rose-600 text-[13px] font-[800] uppercase tracking-widest overflow-hidden"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7468] group-focus-within:text-[#4E6B4A] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.10] rounded-[16px] py-4 pl-14 pr-4 px-5 text-[#1F2A22] text-[15px] font-[700] focus:outline-none focus:border-[#4E6B4A] focus:ring-1 focus:ring-[#4E6B4A] transition-all placeholder:text-[#6B7468]/50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[10px] font-[800] text-[#4E6B4A] uppercase tracking-widest hover:text-[#2F4A36] transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7468] group-focus-within:text-[#4E6B4A] transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.10] rounded-[16px] py-4 pl-14 pr-4 px-5 text-[#1F2A22] text-[15px] font-[700] focus:outline-none focus:border-[#4E6B4A] focus:ring-1 focus:ring-[#4E6B4A] transition-all placeholder:text-[#6B7468]/50"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#4E6B4A] hover:bg-[#3A5037] disabled:bg-[#DCE3D6] disabled:text-[#6B7468] text-white font-[800] py-4 rounded-[16px] transition-all shadow-md shadow-[#4E6B4A]/20 hover:shadow-lg hover:shadow-[#4E6B4A]/30 flex items-center justify-center gap-3 active:scale-95 text-[15px] uppercase tracking-widest border border-[#B88A44]/30 relative overflow-hidden group mt-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B88A44]/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                ) : (
                  <span className="relative z-10">Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-[#4F5C4A]/[0.08] text-center relative z-10">
              <p className="text-[#6B7468] text-[13px] font-[800] uppercase tracking-widest">
                Don't have an account?
                <Link
                  to="/register"
                  className="text-[#4E6B4A] hover:text-[#2F4A36] ml-2 inline-flex items-center gap-1 group"
                >
                  Apply Here
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
