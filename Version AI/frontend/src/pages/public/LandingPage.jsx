import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  Shield,
  Flame,
  Map as MapIcon,
  Users,
  ArrowRight,
  Play,
  AlertCircle,
  Radio,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Leaf,
} from "lucide-react";
import { Link } from "react-router-dom";

const TopoPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] mix-blend-multiply"
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id="displacementFilter">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.01"
        numOctaves="3"
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale="50"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
    <path
      d="M-100 100 Q 200 50 500 200 T 1100 100 M-100 200 Q 200 150 500 300 T 1100 200 M-100 300 Q 200 250 500 400 T 1100 300 M-100 400 Q 200 350 500 500 T 1100 400 M-100 500 Q 200 450 500 600 T 1100 500 M-100 600 Q 200 550 500 700 T 1100 600 M-100 700 Q 200 650 500 800 T 1100 700"
      fill="none"
      stroke="#1F2A22"
      strokeWidth="1"
      strokeLinecap="round"
      filter="url(#displacementFilter)"
    />
    <path
      d="M-100 150 Q 200 100 500 250 T 1100 150 M-100 250 Q 200 200 500 350 T 1100 250 M-100 350 Q 200 300 500 450 T 1100 350"
      fill="none"
      stroke="#1F2A22"
      strokeWidth="0.5"
      strokeLinecap="round"
      filter="url(#displacementFilter)"
    />
  </svg>
);

const BranchPattern = () => (
  <svg
    viewBox="0 0 200 300"
    className="absolute pointer-events-none opacity-[0.06]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M100 300 Q 90 200 100 100 Q 110 50 150 0 M100 150 Q 60 120 30 80 M100 200 Q 140 180 180 140 M70 110 Q 50 80 40 50 M130 140 Q 160 110 170 70"
      fill="none"
      stroke="#1F2A22"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const ArganLivingWindow = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const sequence = [
    {
      id: "sensors",
      digit: "+30",
      label: "Active Sensors",
      sub: "Monitoring argan zones in real time",
      barPos: "0%",
    },
    {
      id: "coops",
      digit: "+20",
      label: "Connected Cooperatives",
      sub: "Protecting the argan ecosystem together",
      barPos: "44%",
    },
    {
      id: "risk",
      digit: "+50",
      label: "Resolved Alerts",
      sub: "All alerts handled successfully",
      barPos: "88%",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sequence.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const fgX = useTransform(smoothX, [-300, 300], [-5, 5]);
  const fgY = useTransform(smoothY, [-300, 300], [-5, 5]);
  const mgX = useTransform(smoothX, [-300, 300], [-2, 2]);
  const mgY = useTransform(smoothY, [-300, 300], [-2, 2]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-default select-none group/window"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* 1. Background Layer: Low Sun, Contours & Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#B88A44]/15 to-transparent blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[20%] w-[280px] h-[280px] bg-gradient-to-t from-[#B88A44]/20 to-[#FAF8F4]/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-[25%] left-[25%] w-[120px] h-[120px] bg-gradient-to-tr from-[#B88A44]/30 to-white/10 rounded-full blur-[20px] opacity-60" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none grayscale">
          <path
            d="M0,450 Q200,420 400,460 T800,430"
            fill="none"
            stroke="#1F2A22"
            strokeWidth="1"
          />
          <path
            d="M0,480 Q250,450 500,490"
            fill="none"
            stroke="#1F2A22"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      {/* 2. Middle Layer: Hills & Mist */}
      <motion.div style={{ x: mgX, y: mgY }} className="absolute inset-0 z-10">
        <div className="absolute bottom-[-10%] left-[-20%] w-[140%] h-[50%] bg-[#556B5D]/18 blur-[50px] rounded-full transform -rotate-3" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[100%] h-[40%] bg-[#B88A44]/12 blur-[40px] rounded-full transform rotate-2" />
        <motion.div
          animate={{ x: [-20, 20] }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="absolute inset-0 opacity-20"
        >
          <div className="absolute top-[40%] left-[-20%] w-[150%] h-[30%] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-[60px]" />
        </motion.div>
      </motion.div>

      {/* 3. Foreground Layer: Argan Branch Silhouette */}
      <motion.div
        style={{ x: fgX, y: fgY }}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <svg className="absolute w-[180%] h-[180%] top-[-20%] right-[-40%] opacity-[0.12] grayscale mix-blend-multiply transition-opacity duration-1000">
          <path
            d="M800,50 Q600,100 450,250 T200,600"
            fill="none"
            stroke="#1F2A22"
            strokeWidth="4"
          />
          {[150, 250, 400, 550, 700].map((pos, i) => (
            <g
              key={i}
              transform={`translate(${800 - pos * 1.1}, ${50 + pos * 0.8}) rotate(${20 + i * 15})`}
            >
              <path d="M0,0 Q-30,-20 -50,0 T0,0" fill="#1F2A22" />
              <circle cx="-25" cy="-10" r="4" fill="#B88A44" opacity="0.6" />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* 4. Brand Signature (Upper-Left) */}
      <div className="absolute top-10 left-10 z-30 opacity-30 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#B88A44]" strokeWidth={1.5} />
          <div className="w-[1px] h-3 bg-[#1F2A22]/20" />
          <Flame className="w-3 h-3 text-[#B88A44]" />
        </div>
      </div>

      {/* 5. Meta-Content Block (Rotating Sequence) */}
      <div className="absolute bottom-[15%] left-8 z-40 max-w-[280px]">
        <div className="flex items-center gap-2 mb-6 h-4">
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#4E6B4A]" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#4E6B4A]/60 font-mono">
            Live Ecosystem Status
          </span>
        </div>

        <div className="min-h-[160px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={sequence[currentIndex].id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <div className="text-6xl lg:text-7xl font-light text-[#1F2A22] tracking-tighter leading-none mb-2">
                {sequence[currentIndex].digit}
              </div>
              <div className="text-sm font-medium text-[#1F2A22]/50 uppercase tracking-[0.15em] mb-6">
                {sequence[currentIndex].label}
              </div>
              <p className="text-[11px] font-medium text-[#1F2A22]/40 leading-relaxed uppercase tracking-wider">
                {sequence[currentIndex].sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Refined Sliding Status Indicator */}
        <div className="w-full max-w-[240px] mt-10">
          <div className="h-[1px] w-full bg-[#1F2A22]/10 relative mb-3">
            <motion.div
              initial={false}
              animate={{ left: sequence[currentIndex].barPos }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="absolute top-[-0.5px] w-12 h-[2px] bg-[#4E6B4A] shadow-[0_0_8px_rgba(78,107,74,0.4)]"
            />
          </div>
          <div className="flex flex-row gap-6 justify-between text-[8px] font-bold tracking-[0.15em] uppercase font-mono">
            <span
              className={
                currentIndex === 0
                  ? "text-[#1F2A22] opacity-100"
                  : "text-[#1F2A22]/30"
              }
            >
              Sensors
            </span>
            <span
              className={
                currentIndex === 1
                  ? "text-[#1F2A22] opacity-100"
                  : "text-[#1F2A22]/30"
              }
            >
              Cooperatives
            </span>
            <span
              className={
                currentIndex === 2
                  ? "text-[#1F2A22] opacity-100"
                  : "text-[#1F2A22]/30"
              }
            >
              Resolved Alerts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: custom * 0.15,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  }),
};

const textReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: custom * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const FeatureCard = ({ icon: Icon, title, description, custom }) => (
  <motion.div
    custom={custom}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    variants={fadeUpVariant}
    className="bg-[#FAF8F4] p-8 rounded-[2rem] border border-[#ECE7DC] hover:border-[#B88A44]/30 hover:shadow-2xl hover:shadow-[#B88A44]/5 transition-all duration-500 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#F3F0E8] rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:bg-[#B88A44]/10 transition-colors duration-700" />
    <div className="relative z-10">
      <div className="text-[#6F7B62] mb-8">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-semibold text-[#1F2A22] mb-4 tracking-tight">
        {title}
      </h3>
      <p className="text-[#1F2A22]/60 leading-relaxed text-sm">{description}</p>
    </div>
  </motion.div>
);

const Counter = ({ from, to }) => {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView && nodeRef.current) {
      const controls = animate(from, to, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(value);
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, inView]);

  return (
    <span
      ref={nodeRef}
      style={{
        fontSize: "inherit",
        letterSpacing: "inherit",
        fontWeight: "inherit",
        lineHeight: "inherit",
      }}
    >
      {from}
    </span>
  );
};

const LandingPage = () => {
  const containerRef = useRef(null);
  const { scrollY } = useScroll({ container: containerRef });

  const smoothY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const y1 = useTransform(smoothY, [0, 1000], [0, 150]);
  const y2 = useTransform(smoothY, [0, 1000], [0, -100]);
  const y3 = useTransform(smoothY, [0, 1000], [0, 80]);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-auto overflow-x-hidden scroll-smooth bg-[#F3F0E8] text-[#1F2A22] selection:bg-[#B88A44]/20 selection:text-[#1F2A22]"
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden h-screen w-screen">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-[#B88A44]/[0.03] blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] bg-[#4E6B4A]/[0.03] blur-[120px] rounded-full"
        />
        <TopoPattern />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 px-6 lg:px-12 mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center h-full min-h-[70vh]">
          {/* Left Content */}
          <div className="relative z-10 flex flex-col justify-center items-start">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUpVariant}
              custom={0}
              className="inline-flex items-center gap-3 border border-[#ECE7DC] bg-[#FAF8F4]/80 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-[#B56C4D] animate-pulse" />
              <span className="text-[#6F7B62] text-[10px] font-bold uppercase tracking-[0.15em]">
                Live Argan Monitoring
              </span>
            </motion.div>

            <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-medium leading-[1.05] tracking-[-0.03em] mb-8 text-[#1F2A22]">
              <motion.span
                variants={textReveal}
                custom={1}
                initial="hidden"
                animate="visible"
                className="block"
              >
                Protecting
              </motion.span>
              <motion.span
                variants={textReveal}
                custom={2}
                initial="hidden"
                animate="visible"
                className="block text-[#4E6B4A]"
              >
                Morocco’s
              </motion.span>
              <motion.span
                variants={textReveal}
                custom={3}
                initial="hidden"
                animate="visible"
                className="block flex items-center gap-4"
              >
                <span className="italic font-light">Green Gold</span>
              </motion.span>
              <motion.span
                variants={textReveal}
                custom={4}
                initial="hidden"
                animate="visible"
                className="block text-[3rem] md:text-[3.5rem] lg:text-[4rem] text-[#6F7B62] leading-[1.1]"
              >
                Before Fire Begins.
              </motion.span>
            </h1>

            <motion.p
              variants={fadeUpVariant}
              custom={5}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-[#1F2A22]/70 max-w-xl mb-12 leading-[1.6] font-medium"
            >
              Real-time monitoring across argan cooperatives, sensors and
              wildfire risk zones. Preserving the heritage of the dry landscape
              through innovation.
            </motion.p>

            <motion.div
              variants={fadeUpVariant}
              custom={6}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-start gap-4 w-full sm:w-auto"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto group relative overflow-hidden bg-[#4E6B4A] text-[#FAF8F4] font-medium px-8 py-4 rounded-full transition-all flex items-center justify-center gap-3 active:scale-95 shadow-md shadow-[#4E6B4A]/10"
              >
                <div className="absolute inset-0 bg-[#B88A44] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                <span className="relative z-10 tracking-wide text-sm uppercase">
                  Join the Network
                </span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>

            </motion.div>
          </div>

          {/* Right Composition */}
          <div className="relative z-10 h-[500px] lg:h-[600px] w-full flex items-center justify-center lg:justify-end">
            <motion.div
              style={{ y: y1 }}
              className="absolute right-0 top-0 w-64 opacity-50"
            >
              <BranchPattern />
            </motion.div>

            <div className="relative w-full max-w-[500px] aspect-square">
              {/* Map Preview Base */}

              {/* 3D Argan Asset behind cards */}
              <motion.div
                style={{ y: y3, x: "-50%", left: "50%" }}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                className="absolute top-[-35%] w-[160%] h-[160%] pointer-events-none z-10"
              >
                <img
                  src="/Argan3D.png"
                  alt="3D Argan Tree Illustration"
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_100px_rgba(31,42,33,0.35)]"
                />
              </motion.div>

              {/* Glass Card: Active Sensors */}
              <motion.div
                style={{ y: y2 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute top-[15%] -left-[10%] lg:-left-[15%] bg-[#FAF8F4]/80 backdrop-blur-xl p-6 rounded-3xl border border-[#ECE7DC] shadow-xl shadow-[#1F2A22]/5 w-[220px] z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F3F0E8] flex items-center justify-center border border-[#ECE7DC]">
                    <Radio className="w-5 h-5 text-[#6F7B62]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1F2A22] leading-none mb-1">
                      30
                    </div>
                    <div className="text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-widest">
                      Active Sensors
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Glass Card: Cooperatives */}
              <motion.div
                style={{ y: y3 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute bottom-[20%] -right-[5%] lg:-right-[10%] bg-[#FAF8F4]/90 backdrop-blur-xl p-5 rounded-3xl border border-[#ECE7DC] shadow-xl shadow-[#1F2A22]/5 w-[200px] z-20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#4E6B4A] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4E6B4A]"></span>
                  </span>
                  <span className="text-[10px] font-bold text-[#1F2A22]/60 uppercase tracking-wider">
                    Network Status
                  </span>
                </div>
                <div className="text-xl font-bold text-[#1F2A22] mb-1 leading-none">
                  20 Cooperatives
                </div>
                <div className="text-xs font-medium text-[#6F7B62]">
                  Securely Connected
                </div>
              </motion.div>

              {/* Alert Card containing clay accent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute top-[-5%] right-[10%] bg-[#FAF8F4] p-4 rounded-2xl border border-[#B56C4D]/30 shadow-lg shadow-[#B56C4D]/5 flex items-start gap-3 w-[180px] z-20"
              >
                <AlertCircle className="w-5 h-5 text-[#B56C4D] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-[#B56C4D] uppercase tracking-wider mb-0.5">
                    All Zones Clear
                  </div>
                  <div className="text-[11px] font-medium text-[#1F2A22]/60 leading-tight">
                    Normal conditions detected.
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative py-32 px-6 lg:px-12 bg-[#FAF8F4] border-y border-[#ECE7DC]"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg
            className="absolute w-full h-[500px] top-0 opacity-[0.02]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,100 C300,200 600,0 1000,100 C1400,200 1800,0 2000,100 L2000,0 L0,0 Z"
              fill="#1F2A22"
            />
          </svg>
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="max-w-2xl mb-20 text-center mx-auto lg:text-left lg:mx-0">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="text-4xl md:text-5xl font-medium text-[#1F2A22] mb-6 tracking-tight leading-tight"
            >
              Resilient Technology for <br />
              <span className="text-[#6F7B62] italic">Harsh Landscapes.</span>
            </motion.h2>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              className="w-16 h-[3px] bg-[#B88A44] rounded-full mx-auto lg:mx-0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Radio}
              title="Live Sensor Monitoring"
              description="Continuous data streams from robust IoT devices adapted to extreme dryland conditions."
              custom={1}
            />
            <FeatureCard
              icon={Users}
              title="Cooperative Fire Network"
              description="Directly connecting local argan cooperatives to instant alert systems."
              custom={2}
            />
            <FeatureCard
              icon={MapIcon}
              title="Argan Zone Risk Mapping"
              description="Dynamic digital twins mapping high-risk areas across the Souss-Massa region."
              custom={3}
            />
            <FeatureCard
              icon={Flame}
              title="Early Fire Detection"
              description="Thermal variance tracking triggering alerts before full ignition happens."
              custom={4}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="relative py-32 lg:py-48 px-6 lg:px-12 overflow-hidden bg-[#F3F0E8]"
      >
        {/* Oversized background text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.01] pointer-events-none select-none overflow-hidden">
          <h2 className="text-[15rem] lg:text-[25rem] font-bold text-[#1F2A22] leading-none whitespace-nowrap">
            ARGANIA
          </h2>
        </div>

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative z-10 items-center">
          <div className="lg:col-span-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-medium text-[#1F2A22] tracking-tighter leading-[1.05] mb-8"
            >
              It’s more than a forest. <br />
              <span className="text-[#8B7355] italic">It’s our legacy.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-[#1F2A22]/70 leading-[1.6] font-medium max-w-3xl mb-16"
            >
              The argan tree only grows in this specific pocket of the world.
              For generations, local cooperatives have guarded this green gold.
              Today, rising temperatures and dry winds threaten these lands. We
              built this network to listen to the forest—giving early warnings
              so fire never takes hold.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-12 border-t border-[#ECE7DC] pt-12"
            >
              <div>
                <div className="text-6xl font-light text-[#4E6B4A] mb-3 tracking-tighter">
                  +<Counter from={0} to={30} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#1F2A22]/50">
                  Sensors Deployed
                </div>
              </div>
              <div>
                <div className="text-6xl font-light text-[#B88A44] mb-3 tracking-tighter">
                  +<Counter from={0} to={20} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#1F2A22]/50">
                  Cooperatives Connected
                </div>
              </div>
              <div>
                <div className="text-6xl font-light text-[#B56C4D] mb-3 tracking-tighter">
                  +<Counter from={0} to={50} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#1F2A22]/50">
                  Total Alerts Resolved
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 relative h-full min-h-[400px] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="w-full max-w-[480px] aspect-[1/1.4] bg-[#F4F0E8]/20 rounded-t-full rounded-b-[4rem] overflow-hidden relative shadow-[0_60px_100px_-30px_rgba(31,42,34,0.1)]"
            >
              {/* Cinematic Living Window */}
              <div className="absolute inset-0">
                <ArganLivingWindow />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 pb-12 pt-8 lg:px-8 bg-[#F3F0E8]">
        <div className="mx-auto max-w-[1440px] bg-[#2F4A36] rounded-[3rem] lg:rounded-[4rem] p-16 lg:p-24 text-center relative overflow-hidden flex flex-col items-center shadow-2xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] right-[10%] w-[400px] h-[400px] bg-[#B88A44]/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-[#B56C4D]/15 rounded-full blur-[120px]" />
          </div>
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay">
            <svg width="100%" height="100%" preserveAspectRatio="none">
              <filter id="wind">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.005 0.05"
                  numOctaves="4"
                  result="noise"
                />
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
                  in="noise"
                />
              </filter>
              <rect
                width="100%"
                height="100%"
                filter="url(#wind)"
                fill="#fff"
              />
            </svg>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-medium text-[#FAF8F4] mb-8 tracking-tighter leading-[1.05]">
              Join the Network Protecting Morocco’s Argan Forest.
            </h2>
            <p className="text-[#ECE7DC] mb-12 text-lg lg:text-xl font-medium leading-[1.6] max-w-2xl mx-auto opacity-80">
              Stand with local communities. Equip them with real-time insights
              to act fast and keep the ancestral lands safe.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-4 bg-[#B88A44] hover:bg-[#A67B3B] text-[#FAF8F4] font-medium px-10 py-5 rounded-full transition-all active:scale-95 group text-sm uppercase tracking-widest shadow-xl shadow-[#B88A44]/20"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative bg-[#2F3A32] pt-24 pb-8 px-6 lg:px-12 overflow-hidden w-full border-t border-[#222b24]">
        {/* Soft Radial Gold Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#B88A44]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-[#4E6B4A]/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Topographic Background */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none">
          <TopoPattern />
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 mb-20">
            {/* Column 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              custom={0}
              className="flex flex-col items-start"
            >
              <Link to="/" className="flex items-center group mb-6">
                <img
                  src="/arganLogo.png"
                  alt="Argan Fire Watch"
                  className="h-16 w-18 object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-[14px] font-[800] tracking-tight whitespace-nowrap leading-tight">
                  <span className="text-[#4E6B4A] font-bold">Argan</span>
                  <br />
                  <span className="text-[#B88A44]"> Fire Watch</span>
                </span>
              </Link>
              <p className="text-[#ECE7DC]/60 text-[15px] leading-relaxed mb-8 font-medium max-w-xs">
                Protecting Morocco’s green gold through real-time monitoring and
                wildfire prevention.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#FAF8F4]/5 border border-[#FAF8F4]/10 flex items-center justify-center text-[#ECE7DC]/60 hover:text-[#B88A44] hover:bg-[#FAF8F4]/10 hover:border-[#B88A44]/30 transition-all duration-300"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#FAF8F4]/5 border border-[#FAF8F4]/10 flex items-center justify-center text-[#ECE7DC]/60 hover:text-[#B88A44] hover:bg-[#FAF8F4]/10 hover:border-[#B88A44]/30 transition-all duration-300"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[#FAF8F4]/5 border border-[#FAF8F4]/10 flex items-center justify-center text-[#ECE7DC]/60 hover:text-[#B88A44] hover:bg-[#FAF8F4]/10 hover:border-[#B88A44]/30 transition-all duration-300"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Column 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              custom={1}
              className="lg:pl-8"
            >
              <h4 className="text-[#FAF8F4] text-[18px] font-semibold mb-6 tracking-tight">
                Platform
              </h4>
              <ul className="flex flex-col gap-4 text-[14px]">
                {[
                  "Dashboard",
                  "Features",
                  "Monitoring",
                  "Alerts",
                  "Register",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to={link === "Register" ? "/register" : "#"}
                      className="text-[#ECE7DC]/60 hover:text-[#B88A44] font-medium transition-colors duration-300 inline-block hover:translate-x-1 transform origin-left"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 3 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              custom={2}
            >
              <h4 className="text-[#FAF8F4] text-[18px] font-semibold mb-6 tracking-tight">
                Resources
              </h4>
              <ul className="flex flex-col gap-4 text-[14px]">
                {[
                  "About",
                  "Documentation",
                  "Support",
                  "Contact",
                  "Privacy Policy",
                ].map((link) => (
                  <li key={link}>
                    <Link
                      to="#"
                      className="text-[#ECE7DC]/60 hover:text-[#B88A44] font-medium transition-colors duration-300 inline-block hover:translate-x-1 transform origin-left"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 4 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              custom={3}
            >
              <h4 className="text-[#FAF8F4] text-[18px] font-semibold mb-6 tracking-tight">
                Network
              </h4>
              <ul className="flex flex-col gap-4 mb-8 text-[14px]">
                <li className="text-[#ECE7DC]/80 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A44]"></span>
                  +30 sensors active
                </li>
                <li className="text-[#ECE7DC]/80 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A44]"></span>
                  +20 cooperatives connected
                </li>
                <li className="text-[#ECE7DC]/80 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88A44]"></span>
                  24/7 monitoring
                </li>
              </ul>

              <div className="inline-flex items-center gap-3 bg-[#FAF8F4]/5 border border-[#FAF8F4]/10 rounded-full px-5 py-2.5 shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4E6B4A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4E6B4A]"></span>
                </span>
                <span className="text-[12px] font-bold text-[#FAF8F4] uppercase tracking-widest">
                  System Operational
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariant}
            custom={4}
            className="border-t border-[#FAF8F4]/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <p className="text-[#ECE7DC]/50 text-xs font-bold uppercase tracking-widest">
              © 2026 Argan Fire Watch
            </p>
            <p className="text-[#ECE7DC]/50 text-xs font-bold uppercase tracking-widest text-center md:text-right">
              Designed to protect Morocco’s argan forest.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
