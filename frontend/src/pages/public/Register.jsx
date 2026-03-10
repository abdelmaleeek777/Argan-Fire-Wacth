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
  });

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
      setError("");
    }
  };

  const prevStep = () => setStep((s) => s - 1);

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
    } else if (step === 2) {
      if (
        !formData.coopName ||
        !formData.region ||
        !formData.address ||
        !formData.phone
      ) {
        setError("Please fill in cooperative details");
        return false;
      }
    } else if (step === 3) {
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
      await axios.post("http://localhost:5000/register", formData);
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

  const stepNames = ["Identity", "Cooperative", "Zone Area", "Review"];

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans border-t-4 border-emerald-600">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[3rem] text-center shadow-2xl shadow-emerald-900/5"
        >
          <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-600/20">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
            Registration Submitted
          </h2>
          <p className="text-slate-500 leading-relaxed mb-10">
            Your registration has been submitted successfully. The administrator
            will review your account and cooperative details within 24 hours.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors group"
          >
            Return to Landing Page
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/30 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <StepIndicator currentStep={step} stepNames={stepNames} />

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/5"
          >
            {/* Error Header */}
            {error && (
              <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 text-rose-600 text-sm font-bold animate-pulse">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="p-8 md:p-12">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                      Personal Information
                    </h2>
                    <p className="text-slate-500 text-sm">
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

              {/* Step 2: Cooperative Information */}
              {step === 2 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                      Cooperative Details
                    </h2>
                    <p className="text-slate-500 text-sm">
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Region
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                      <select
                        value={formData.region}
                        onChange={(e) =>
                          setFormData({ ...formData, region: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:border-emerald-600 transition-all appearance-none"
                      >
                        <option value="" disabled className="bg-white">
                          Select your region
                        </option>
                        {regions.map((r) => (
                          <option key={r} value={r} className="bg-white">
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

              {/* Step 3: Zone Selection */}
              {step === 3 && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                      Draw Risk Zone
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Select the exact area of your cooperative on the map.
                    </p>
                  </header>

                  <div className="h-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-inner relative group">
                    <MapContainer
                      center={[30.4278, -9.5981]}
                      zoom={9}
                      scrollWheelZoom={true}
                      className="h-full w-full"
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
                                color: "#059669",
                                fillOpacity: 0.3,
                              },
                            },
                          }}
                        />
                      </FeatureGroup>
                    </MapContainer>
                    <div className="absolute bottom-4 left-4 z-999 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3 shadow-lg">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                        <Maximize2 size={16} />
                      </div>
                      <span className="text-slate-900 font-bold">
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

              {/* Step 4: Review & Submit */}
              {step === 4 && (
                <div className="space-y-10">
                  <header>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                      Final Review
                    </h2>
                    <p className="text-slate-500 text-sm">
                      Please verify all information before submission.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Summary Card */}
                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl space-y-6 shadow-sm">
                      <h4 className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-xs">
                        <ShieldCheck size={16} /> Identity & Cooperative
                      </h4>
                      <div className="space-y-4">
                        <SummaryItem
                          label="Owner"
                          value={`${formData.prenom} ${formData.nom}`}
                        />
                        <SummaryItem label="Email" value={formData.email} />
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
                    <div className="h-[300px] rounded-3xl overflow-hidden border border-slate-200 opacity-90 pointer-events-none shadow-sm">
                      <MapContainer
                        center={[30.4278, -9.5981]}
                        zoom={12}
                        zoomControl={false}
                        className="h-full w-full"
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
                                color: "#059669",
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
                    className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 group cursor-pointer shadow-sm hover:border-emerald-200 transition-colors"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        confirmCheck: !formData.confirmCheck,
                      })
                    }
                  >
                    <input
                      type="checkbox"
                      className="w-6 h-6 accent-emerald-600 rounded border-slate-300 bg-white"
                      checked={formData.confirmCheck || false}
                      onChange={() => {}} // handled by parent div click
                    />
                    <span className="text-slate-600 font-medium">
                      I confirm all the information above is correct and legally
                      binding.
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-12 flex items-center justify-between gap-6 pt-10 border-t border-slate-100">
                {step > 1 ? (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-5 text-slate-400 font-bold hover:text-slate-900 transition-all group"
                  >
                    <ArrowLeft
                      size={20}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                    Back
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="text-emerald-600 font-bold text-sm hover:underline"
                  >
                    Already have an account?
                  </Link>
                )}

                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 py-5 rounded-[1.5rem] flex items-center gap-3 transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
                  >
                    Next Step
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 lg:flex-none lg:w-64 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-12 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 shadow-emerald-900/10"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
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
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all placeholder:text-slate-300 font-medium"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
      {label}
    </span>
    <span className="text-slate-900 font-semibold">{value || "—"}</span>
  </div>
);

export default Register;
