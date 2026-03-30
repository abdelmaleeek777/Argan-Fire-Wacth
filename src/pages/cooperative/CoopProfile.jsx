import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Calendar,
  Users,
  Sprout,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText
} from "lucide-react";
import { useCoopData } from "../../hooks/useCoopData";

const CoopProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fallback state if accessed directly without registration data
  const initialState = location.state || {
    coopName: "",
    region: "",
    address: "",
    phone: "",
    zoneName: "",
    areaHectares: "",
  };

  const { coopData, updateCoopData, saveCoopData } = useCoopData({
    ...initialState,
    superficie_totale_ha: initialState.areaHectares || "",
    date_creation: "",
    nombre_membres: "",
    type_arganier: "mixte", // Default
    certifications: {
      bio: false,
      fair_trade: false,
      unesco: false,
    },
    description: "",
  });

  const handleCheckboxChange = (cert) => {
    updateCoopData({
      certifications: {
        ...coopData.certifications,
        [cert]: !coopData.certifications[cert],
      },
    });
  };

  const handleSave = async () => {
    if (!coopData.superficie_totale_ha || !coopData.date_creation || !coopData.nombre_membres) {
      setError("Veuillez remplir les champs obligatoires (*)");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Replace with actual ID logic from auth response if available
      await saveCoopData("profile-update"); 
      setSuccess(true);
      setTimeout(() => {
        navigate("/coop/dashboard");
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la sauvegarde. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

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
            Profil Sauvegardé
          </h2>
          <p className="text-slate-500 leading-relaxed mb-10">
            Les détails de votre coopérative ont été enregistrés avec succès. Vous allez être redirigé vers votre tableau de bord.
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/30 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <header className="mb-10 text-center md:text-left">
                <div className="inline-flex w-16 h-16 bg-emerald-600 rounded-2xl items-center justify-center text-white mb-6 shadow-lg shadow-emerald-600/20">
                  <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                  Compléter le Profil Coopérative
                </h2>
                <p className="text-slate-500 text-sm">
                  Finalisez les informations de votre domaine {coopData.coopName ? `pour ${coopData.coopName}` : ""}.
                </p>
              </header>

              <div className="space-y-10">
                {/* Section Informations Pré-remplies (Modifiables) */}
                <div>
                  <h3 className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-xs mb-6 px-1">
                    <ShieldCheck size={16} /> Détails Enregistrés
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Nom de la coopérative"
                      value={coopData.coopName}
                      onChange={(v) => updateCoopData({ coopName: v })}
                      icon={Building2}
                    />
                    <InputField
                      label="Téléphone"
                      value={coopData.phone}
                      onChange={(v) => updateCoopData({ phone: v })}
                      icon={Phone}
                    />
                    <InputField
                      label="Région"
                      value={coopData.region}
                      onChange={(v) => updateCoopData({ region: v })}
                      icon={MapPin}
                    />
                    <InputField
                      label="Adresse"
                      value={coopData.address}
                      onChange={(v) => updateCoopData({ address: v })}
                      icon={MapPin}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 my-8"></div>

                {/* Section Nouvelles Informations Spécifiques */}
                <div>
                  <h3 className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-xs mb-6 px-1">
                    <Sprout size={16} /> Informations Complémentaires
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <InputField
                      label="Date de Création *"
                      type="date"
                      value={coopData.date_creation}
                      onChange={(v) => updateCoopData({ date_creation: v })}
                      icon={Calendar}
                    />
                    <InputField
                      label="Total Membres *"
                      type="number"
                      value={coopData.nombre_membres}
                      onChange={(v) => updateCoopData({ nombre_membres: v })}
                      icon={Users}
                      placeholder="Ex: 15"
                    />
                    <InputField
                      label="Superficie Totale (ha) *"
                      type="number"
                      step="0.01"
                      value={coopData.superficie_totale_ha}
                      onChange={(v) => updateCoopData({ superficie_totale_ha: v })}
                      icon={MapPin}
                      placeholder={coopData.areaHectares || "0.00"}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Type d'arganier */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block">
                        Type d'Arganier
                      </label>
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl flex flex-col md:flex-row gap-2">
                        {["sauvage", "cultivé", "mixte"].map((type) => (
                          <button
                            key={type}
                            onClick={() => updateCoopData({ type_arganier: type })}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold capitalize transition-all ${
                              coopData.type_arganier === type
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block">
                        Certifications & Labels
                      </label>
                      <div className="flex flex-col gap-3">
                        <Checkbox
                          label="Certification Biologique (Bio)"
                          checked={coopData.certifications.bio}
                          onChange={() => handleCheckboxChange("bio")}
                        />
                        <Checkbox
                          label="Commerce Équitable (Fair Trade)"
                          checked={coopData.certifications.fair_trade}
                          onChange={() => handleCheckboxChange("fair_trade")}
                        />
                        <Checkbox
                          label="Patrimoine UNESCO"
                          checked={coopData.certifications.unesco}
                          onChange={() => handleCheckboxChange("unesco")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-8 space-y-2 group">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block">
                      Description de la coopérative
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-5 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                      <textarea
                        value={coopData.description}
                        onChange={(e) => updateCoopData({ description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all placeholder:text-slate-300 font-medium min-h-[120px] resize-y"
                        placeholder="Parlez-nous de l'histoire et des activités de votre coopérative..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-12 py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 shadow-emerald-900/10"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        Sauvegarder le profil
                        <Save className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Sub-components
const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", step }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-4 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 transition-all placeholder:text-slate-300 font-medium"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <div
    className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer select-none ${
      checked ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:border-slate-300"
    }`}
    onClick={onChange}
  >
    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${checked ? "bg-emerald-600" : "bg-white border border-slate-300"}`}>
      {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
    </div>
    <span className={`font-semibold text-sm ${checked ? "text-emerald-800" : "text-slate-600"}`}>
      {label}
    </span>
  </div>
);

export default CoopProfile;
