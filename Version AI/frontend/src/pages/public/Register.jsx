import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Map as MapIcon,
  Maximize2,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import * as turf from "@turf/turf";
import StepIndicator from "../../components/StepIndicator";

// Fix Leaflet marker icons
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const regions = [
  "Agadir-Ida-Outanane",
  "Taroudant",
  "Tiznit",
  "Chtouka-Ait-Baha",
  "Inezgane-Ait-Melloul",
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [areaHectares, setAreaHectares] = useState(0);

  // Email verification states
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const codeInputRefs = useRef([]);

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    coopName: "",
    region: "",
    address: "",
    phone: "",
    zoneName: "",
    polygon: null, // Will store geojson or array of coords
    confirmCheck: false,
  });

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendVerificationCode = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }
    
    setSendingCode(true);
    setError("");
    
    try {
      await axios.post("/api/auth/send-verification", { email: formData.email });
      setCodeSent(true);
      setResendTimer(60); // 60 seconds cooldown
      setVerificationCode(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...verificationCode];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setVerificationCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setVerifyingCode(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/verify-code", {
        email: formData.email,
        code: code,
      });
      
      if (response.data.verified) {
        setEmailVerified(true);
        setStep(3); // Move to cooperative step
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifyingCode(false);
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step === 1) {
        // After personal info, go to email verification
        setStep(2);
        if (!codeSent) {
          sendVerificationCode();
        }
      } else {
        setStep((s) => s + 1);
      }
      setError("");
    }
  };

  const prevStep = () => {
    if (step === 2) {
      // Going back from verification resets verification state
      setCodeSent(false);
      setVerificationCode(["", "", "", "", "", ""]);
    }
    setStep((s) => s - 1);
  };

  const validateStep = () => {
    if (step === 1) {
      if (
        !formData.prenom ||
        !formData.nom ||
        !formData.email ||
        !formData.password
      ) {
        setError("All fields are required");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    } else if (step === 3) {
      if (
        !formData.coopName ||
        !formData.region ||
        !formData.address ||
        !formData.phone
      ) {
        setError("Please fill in cooperative details");
        return false;
      }
    } else if (step === 4) {
      if (!formData.polygon) {
        setError("Please select your zone on the map");
        return false;
      }
      if (!formData.zoneName) {
        setError("Please give your zone a name");
        return false;
      }
    }
    return true;
  };

  const handleDrawCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const geojson = layer.toGeoJSON();
      setFormData((prev) => ({
        ...prev,
        polygon: geojson.geometry.coordinates[0],
      }));

      // Calculate area
      const area = turf.area(geojson);
      setAreaHectares((area / 10000).toFixed(2)); // sqm to hectares
      setError(""); // clear map warning
    }
  };

  const handleDrawDelete = () => {
    setFormData((prev) => ({ ...prev, polygon: null }));
    setAreaHectares(0);
  };

  const handleSubmit = async () => {
    if (!formData.confirmCheck) {
      setError("Please confirm information is correct");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post("/api/auth/register", formData);
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Component for Map Auto-Fit/Center
  const MapRefocus = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
      if (coords && coords.length > 0) {
        const bounds = L.latLngBounds(coords.map((c) => [c[1], c[0]]));
        map.fitBounds(bounds);
      }
    }, [coords, map]);
    return null;
  };

  const stepNames = ["Identity", "Verify Email", "Cooperative", "Zone Area", "Review"];

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-10 rounded-[32px] text-center shadow-[0_8px_24px_rgba(31,42,33,0.06)]"
        >
          <div className="w-24 h-24 bg-[#4E6B4A]/10 border border-[#4E6B4A]/20 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-[#4E6B4A]" />
          </div>
          <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-4 tracking-tight">
            Registration Submitted
          </h2>
          <p className="text-[#6B7468] text-[15px] leading-relaxed mb-10 font-medium">
            Your registration has been submitted successfully. The administrator
            will review your account and cooperative details within 24 hours.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#DCE3D6] text-[#1F2A22] font-[800] rounded-[16px] hover:bg-[#CBD8C8] transition-all group w-full justify-center"
          >
            Return to Login
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#F8F7F2] pt-8 pb-20 px-4 relative overflow-x-hidden flex flex-col items-center">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#B88A44]/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4E6B4A]/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="w-full max-w-4xl relative z-10 mb-8 flex flex-col items-center">
        <div className="flex items-center mb-6">
          
        </div>
        <h1 className="text-center text-[24px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
         
        </h1>
        <div className="w-full mt-10">
          <StepIndicator 
            currentStep={step} 
            totalSteps={stepNames.length} 
            stepNames={stepNames} 
          />
        </div>
      </div>

      <div className="w-full max-w-4xl relative z-10 mb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] rounded-[32px] overflow-hidden shadow-[0_8px_24px_rgba(31,42,33,0.06)] relative"
          >
            {/* Error Header */}
            {error && (
              <div className="bg-rose-50 border-b border-rose-100/50 px-6 py-4 flex items-center justify-center gap-3 text-rose-600 text-[13px] font-[800] uppercase tracking-widest animate-pulse">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="p-8 md:p-12">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
                      Personal Information
                    </h2>
                    <p className="text-[#6B7468] text-[14px] font-medium">
                      Please provide your legal identity to manage the
                      cooperative.
                    </p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="First Name"
                      value={formData.prenom}
                      onChange={(v) => setFormData({ ...formData, prenom: v })}
                      icon={User}
                      placeholder="Omar"
                    />
                    <InputField
                      label="Last Name"
                      value={formData.nom}
                      onChange={(v) => setFormData({ ...formData, nom: v })}
                      icon={User}
                      placeholder="El Mansouri"
                    />
                  </div>
                  <InputField
                    label="Email Address"
                    value={formData.email}
                    onChange={(v) => setFormData({ ...formData, email: v })}
                    icon={Mail}
                    placeholder="omar@atlas.ma"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(v) =>
                        setFormData({ ...formData, password: v })
                      }
                      icon={Lock}
                      placeholder="••••••••"
                    />
                    <InputField
                      label="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(v) =>
                        setFormData({ ...formData, confirmPassword: v })
                      }
                      icon={Lock}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Email Verification */}
              {step === 2 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
                      Verify Your Email
                    </h2>
                    <p className="text-[#6B7468] text-[14px] font-medium">
                      We've sent a 6-digit verification code to{" "}
                      <span className="font-[800] text-[#4E6B4A]">{formData.email}</span>
                    </p>
                  </header>

                  <div className="flex flex-col items-center space-y-10 py-6">
                    {/* Code Input */}
                    <div className="flex gap-3">
                      {verificationCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (codeInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => handleCodeKeyDown(index, e)}
                          className="w-14 h-16 text-center text-[24px] font-[800] text-[#1F2A22] bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.10] rounded-[16px] focus:outline-none focus:border-[#4E6B4A] focus:ring-1 focus:ring-[#4E6B4A] transition-all"
                        />
                      ))}
                    </div>

                    {/* Verify Button */}
                    <button
                      onClick={verifyCode}
                      disabled={verifyingCode || verificationCode.join("").length !== 6}
                      className="bg-[#4E6B4A] hover:bg-[#2F4A36] disabled:bg-[#DCE3D6] disabled:text-[#6B7468] text-white font-[800] px-12 py-4 rounded-[16px] flex items-center gap-3 transition-all shadow-md shadow-[#4E6B4A]/20 active:scale-95 text-[15px]"
                    >
                      {verifyingCode ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <>
                          <KeyRound size={20} />
                          Verify Code
                        </>
                      )}
                    </button>

                    {/* Resend Section */}
                    <div className="flex items-center gap-2 text-[13px] font-[800] uppercase tracking-widest">
                      <span className="text-[#6B7468]">Didn't receive the code?</span>
                      {resendTimer > 0 ? (
                        <span className="text-[#B88A44]">
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          onClick={sendVerificationCode}
                          disabled={sendingCode}
                          className="text-[#4E6B4A] hover:text-[#2F4A36] flex items-center gap-1.5 transition-colors"
                        >
                          {sendingCode ? (
                         <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                          Resend Code
                        </button>
                      )}
                    </div>

                    {/* Email verified badge */}
                    {emailVerified && (
                      <div className="flex items-center gap-2 bg-[#4E6B4A]/10 text-[#4E6B4A] border border-[#4E6B4A]/20 px-5 py-2.5 rounded-[12px] font-[800] text-[13px] uppercase tracking-widest">
                        <CheckCircle2 size={18} />
                        Email Verified
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Cooperative Information */}
              {step === 3 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
                      Cooperative Details
                    </h2>
                    <p className="text-[#6B7468] text-[14px] font-medium">
                      Help us locate and identify your Argan cooperative.
                    </p>
                  </header>
                  <InputField
                    label="Cooperative Name"
                    value={formData.coopName}
                    onChange={(v) => setFormData({ ...formData, coopName: v })}
                    icon={Building2}
                    placeholder="Argan Nour Cooperative"
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest ml-1">
                      Region
                    </label>
                    <div className="relative group">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7468] group-focus-within:text-[#4E6B4A] transition-colors" />
                      <select
                        value={formData.region}
                        onChange={(e) =>
                          setFormData({ ...formData, region: e.target.value })
                        }
                        className="w-full bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.10] rounded-[16px] py-4 pl-14 pr-4 text-[#1F2A22] text-[15px] font-[700] focus:outline-none focus:border-[#4E6B4A] focus:ring-1 focus:ring-[#4E6B4A] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-[#F8F7F2]">
                          Select your region
                        </option>
                        {regions.map((r) => (
                          <option key={r} value={r} className="bg-[#F8F7F2]">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <InputField
                    label="Full Address"
                    value={formData.address}
                    onChange={(v) => setFormData({ ...formData, address: v })}
                    icon={MapPin}
                    placeholder="N1, Province de Taroudant, Morocco"
                  />
                  <InputField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    icon={Phone}
                    placeholder="+212 600 000 000"
                  />
                </div>
              )}

              {/* Step 4: Zone Selection */}
              {step === 4 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
                      Draw Risk Zone
                    </h2>
                    <p className="text-[#6B7468] text-[14px] font-medium">
                      Select the exact area of your cooperative on the map.
                    </p>
                  </header>

                  <div className="h-[450px] rounded-[24px] overflow-hidden border border-[#4F5C4A]/[0.10] shadow-inner relative group isolate bg-[#DCE3D6]/20">
                    <MapContainer
                      center={[30.4278, -9.5981]}
                      zoom={9}
                      scrollWheelZoom={true}
                      className="h-full w-full z-0"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <FeatureGroup>
                        <EditControl
                          position="topright"
                          onCreated={handleDrawCreate}
                          onDeleted={handleDrawDelete}
                          draw={{
                            rectangle: false,
                            circle: false,
                            polyline: false,
                            circlemarker: false,
                            marker: false,
                            polygon: {
                              allowIntersection: false,
                              drawError: {
                                color: "#e1e1e1",
                                message:
                                  "<strong>Polygon cannot intersect itself!<strong>",
                              },
                              shapeOptions: {
                                color: "#4E6B4A",
                                fillColor: "#4E6B4A",
                                fillOpacity: 0.3,
                              },
                            },
                          }}
                        />
                      </FeatureGroup>
                    </MapContainer>
                    <div className="absolute bottom-6 left-6 z-[400] bg-[#F8F7F2] p-2 pr-5 rounded-[16px] border border-[#4F5C4A]/[0.10] flex items-center gap-3 shadow-md">
                      <div className="w-10 h-10 bg-[#4E6B4A] rounded-[12px] flex items-center justify-center text-white shadow-sm">
                        <Maximize2 size={18} />
                      </div>
                      <span className="text-[#1F2A22] font-[800] text-[15px]">
                        {areaHectares} Hectares
                      </span>
                    </div>
                  </div>

                  <InputField
                    label="Zone Name"
                    value={formData.zoneName}
                    onChange={(v) => setFormData({ ...formData, zoneName: v })}
                    icon={MapIcon}
                    placeholder="East Sector Argan Grove"
                  />
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {step === 5 && (
                <div className="space-y-10">
                  <header>
                    <h2 className="text-[28px] font-[800] text-[#1F2A22] mb-2 tracking-tight">
                      Final Review
                    </h2>
                    <p className="text-[#6B7468] text-[14px] font-medium">
                      Please verify all information before submission.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Summary Card */}
                    <div className="bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.05] p-8 rounded-[24px] space-y-6 shadow-sm">
                      <h4 className="flex items-center gap-2 text-[#4E6B4A] font-[800] uppercase tracking-widest text-[12px]">
                        <ShieldCheck size={16} /> Identity & Cooperative
                      </h4>
                      <div className="space-y-5">
                        <SummaryItem
                          label="Owner"
                          value={`${formData.prenom} ${formData.nom}`}
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-[0.2em] mb-1.5">
                            Email
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#1F2A22] font-[700] text-[15px]">{formData.email}</span>
                            <span className="inline-flex items-center gap-1 bg-[#4E6B4A] text-white text-[10px] px-2.5 py-0.5 rounded-[6px] font-[800] uppercase tracking-widest">
                              <CheckCircle2 size={12} />
                              Verified
                            </span>
                          </div>
                        </div>
                        <SummaryItem
                          label="Cooperative"
                          value={formData.coopName}
                        />
                        <SummaryItem
                          label="Region / Address"
                          value={`${formData.region}, ${formData.address}`}
                        />
                        <SummaryItem
                          label="Zone Name"
                          value={formData.zoneName}
                        />
                        <SummaryItem
                          label="Total Area"
                          value={`${areaHectares} Hectares`}
                        />
                      </div>
                    </div>

                    {/* Preview Map */}
                    <div className="h-full min-h-[300px] rounded-[24px] overflow-hidden border border-[#4F5C4A]/[0.10] opacity-90 pointer-events-none shadow-sm relative isolate">
                      <MapContainer
                        center={[30.4278, -9.5981]}
                        zoom={12}
                        zoomControl={false}
                        className="h-full w-full z-0 absolute inset-0"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {formData.polygon && (
                          <>
                            <Polygon
                              positions={formData.polygon.map((c) => [
                                c[1],
                                c[0],
                              ])}
                              pathOptions={{
                                color: "#4E6B4A",
                                fillColor: "#4E6B4A",
                                fillOpacity: 0.4,
                              }}
                            />
                            <MapRefocus coords={formData.polygon} />
                          </>
                        )}
                      </MapContainer>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-4 bg-[#F8F7F2] p-6 rounded-[20px] border border-[#4F5C4A]/[0.10] group cursor-pointer shadow-sm hover:border-[#4E6B4A]/50 transition-colors"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        confirmCheck: !formData.confirmCheck,
                      })
                    }
                  >
                    <div className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-colors ${formData.confirmCheck ? 'bg-[#4E6B4A] border-[#4E6B4A]' : 'bg-transparent border-[#6B7468] group-hover:border-[#4E6B4A]'}`}>
                      {formData.confirmCheck && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-[#1F2A22] font-[700] text-[14px]">
                      I confirm all the information above is correct and legally
                      binding.
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-12 flex flex-col-reverse md:flex-row items-center justify-between gap-6 pt-10 border-t border-[#4F5C4A]/[0.05]">
                {step > 1 && step !== 2 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center justify-center gap-2 px-8 py-4 text-[#6B7468] font-[800] hover:text-[#1F2A22] hover:bg-[#DCE3D6]/50 rounded-[14px] transition-all group w-full md:w-auto"
                  >
                    <ArrowLeft
                      size={20}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                    Back
                  </button>
                ) : step === 2 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center justify-center gap-2 px-8 py-4 text-[#6B7468] font-[800] hover:text-[#1F2A22] hover:bg-[#DCE3D6]/50 rounded-[14px] transition-all group w-full md:w-auto"
                  >
                    <ArrowLeft
                      size={20}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                    Change Email
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="text-[#4E6B4A] font-[800] text-[14px] hover:text-[#2F4A36] uppercase tracking-widest w-full md:w-auto text-center"
                  >
                    Already have an account?
                  </Link>
                )}

                {step === 2 ? (
                  // Step 2 has its own verify button, show nothing here
                  <div className="hidden md:block"></div>
                ) : step < 5 ? (
                  <button
                    onClick={nextStep}
                    className="bg-[#4E6B4A] hover:bg-[#2F4A36] text-white font-[800] px-10 py-4 rounded-[16px] flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#4E6B4A]/20 active:scale-95 w-full md:w-auto"
                  >
                    Next Step
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#B88A44] hover:bg-[#A37938] disabled:bg-[#DCE3D6] disabled:text-[#6B7468] text-white font-[800] px-10 py-4 rounded-[16px] flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#B88A44]/20 active:scale-95 w-full md:w-auto overflow-hidden"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const InputField = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7468] group-focus-within:text-[#4E6B4A] transition-colors" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.10] rounded-[16px] py-4 pl-14 pr-4 text-[#1F2A22] focus:outline-none focus:border-[#4E6B4A] focus:ring-1 focus:ring-[#4E6B4A] transition-all placeholder:text-[#6B7468]/50 font-[700] text-[15px]"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-[0.2em] mb-1.5">
      {label}
    </span>
    <span className="text-[#1F2A22] font-[700] text-[15px]">{value || "—"}</span>
  </div>
);

export default Register;
