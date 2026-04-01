import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Thermometer, Wind, Droplets, Compass, Flame, 
  Map as MapIcon, Loader2, Info, ChevronDown, User 
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as turf from '@turf/turf';

export const IncidentNotificationModal= ({ incident, onAccept, onRefuse, onClose }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isAccepting, setIsAccepting] = useState(false);
  const [showRefuseReasons, setShowRefuseReasons] = useState(false);
  const [refuseStatus, setRefuseStatus] = useState('');
  
  // Data extraction from incident object
  const {
    id_alerte,
    zone = {},
    capteur = {},
    temperature_detectee,
    niveau_urgence,
    probabilite_propagation_pct,
    direction_propagation_deg,
    vitesse_propagation_ha_h,
    meteo = {},
    equipes_notifiees = [],
    date_heure_declenchement,
  } = incident || {};

  const myTeam = equipes_notifiees[0] || {};
  const chef = myTeam.chef || {};

  // Parse location
  const centerPosition = [zone?.latitude_centre || 30.42, zone?.longitude_centre || -8.85];
  const distanceToCaserne = 15.2; // Mocked for exact turk formula if coordinates known: turf.distance(...)

  // Calculate direction text
  const getDirectionText = (deg) => {
    if (deg >= 45 && deg <= 135) return "Est - ⚠ Vent Chergui actif";
    if (deg > 135 && deg <= 225) return "Sud";
    if (deg > 225 && deg <= 315) return "Ouest";
    return "Nord";
  };

  // Countdown timer logic
  useEffect(() => {
    if (!date_heure_declenchement) return;
    
    const triggerTime = new Date(date_heure_declenchement).getTime();
    const now = new Date().getTime();
    const diffSeconds = Math.max(0, Math.floor((triggerTime + 5 * 60 * 1000 - now) / 1000));
    
    setTimeLeft(diffSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeoutRefuse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [date_heure_declenchement]);

  const handleTimeoutRefuse = async () => {
     // Auto refuse silently
     try {
       await axios.patch(`/api/alerts/${id_alerte}/refuse`, { id_equipe: myTeam.id_equipe, raison: 'Timeout (Sans réponse)' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
       if(onRefuse) onRefuse(id_alerte, myTeam.id_equipe, chef.id, 'Timeout');
       onClose();
     } catch (error) {
       console.error(error);
       onClose();
     }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await axios.patch(`/api/alerts/${id_alerte}/assign`, { id_equipe: myTeam.id_equipe }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if(onAccept) onAccept(id_alerte, myTeam.id_equipe, chef.id);
      navigate(`/pompier/mission/${id_alerte}`);
    } catch (error) {
      console.error(error);
      setIsAccepting(false);
      alert("Erreur lors de l'acceptation");
    }
  };

  const handleRefuse = async (reason) => {
    setRefuseStatus('loading');
    try {
      await axios.patch(`/api/alerts/${id_alerte}/refuse`, { id_equipe: myTeam.id_equipe, raison: reason }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if(onRefuse) onRefuse(id_alerte, myTeam.id_equipe, chef.id, reason);
      onClose();
    } catch (error) {
      console.error(error);
      setRefuseStatus('error');
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!incident) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <h2 className="font-black tracking-widest text-lg uppercase">🔥 Incident Détecté</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className={`font-mono font-bold text-sm px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-800 animate-pulse' : 'bg-rose-700'}`}>
                ⏱ Répondre dans : {formatTime(timeLeft)}
              </div>
              <button onClick={onClose} className="p-1 hover:bg-rose-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* 1. Localisation (Map + Risk) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <MapIcon className="text-emerald-600 w-5 h-5" />
                    {zone.nom_zone || "Zone Inconnue"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-lg w-fit">
                    <MapPin className="w-4 h-4" />
                    {centerPosition[0].toFixed(4)}, {centerPosition[1].toFixed(4)}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">📍 à ~{distanceToCaserne}km de la caserne</p>
                </div>
                <div className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-rose-200">
                  Risque {zone.niveau_risque_base}
                </div>
              </div>
              
              <div className="h-[200px] w-full rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0">
                <MapContainer center={centerPosition} zoom={13} className="h-full w-full" zoomControl={false} dragging={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <CircleMarker 
                    center={centerPosition} 
                    radius={30} 
                    pathOptions={{ fillColor: '#ef4444', color: '#ef4444', opacity: 0.5, fillOpacity: 0.3 }} 
                    className="animate-pulse"
                  />
                  {zone.polygon && (
                    <Polygon positions={zone.polygon} pathOptions={{ color: 'orange', fillOpacity: 0.1 }} />
                  )}
                </MapContainer>
              </div>
            </div>

            {/* Grid for Thermo & Propagation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thermique */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center relative">
                <div className="absolute top-4 left-4 bg-orange-100 p-2 rounded-xl text-orange-600">
                  <Thermometer className="w-5 h-5" />
                </div>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2 pt-2">Température</p>
                <h4 className="text-6xl font-black text-rose-600 mb-2">{temperature_detectee}°<span className="text-3xl text-rose-400">C</span></h4>
                <div className="bg-rose-50 text-rose-700 text-xs px-3 py-1.5 rounded-lg border border-rose-100 font-medium">
                  Seuil: {capteur.seuil_alerte_celsius}°C — Capteur: {capteur.numero_serie}
                </div>
              </div>

              {/* Propagation */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
                <h4 className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-4">Propagation Estimée</h4>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" className="stroke-slate-100 stroke-[6px] fill-none" />
                      <circle cx="32" cy="32" r="28" className="stroke-rose-500 stroke-[6px] fill-none" strokeDasharray="175" strokeDashoffset={175 - (175 * probabilite_propagation_pct) / 100} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-slate-800">
                      {probabilite_propagation_pct}%
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 justify-center">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      {getDirectionText(direction_propagation_deg)}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {vitesse_propagation_ha_h} ha/h
                    </div>
                  </div>
                </div>
                {niveau_urgence && (
                   <div className={`mt-4 w-full text-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest 
                    ${niveau_urgence === 'urgence_maximale' ? 'bg-red-600 text-white' : niveau_urgence === 'alerte' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-white'}`}>
                     Niveau : {niveau_urgence.replace('_', ' ')}
                   </div>
                )}
              </div>
            </div>

            {/* Meteo */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative">
              <h4 className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-4">Météo Initiale</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500"><Droplets className="w-4 h-4 text-blue-500"/> <span className="text-xs font-semibold">Humidité</span></div>
                  <span className="text-lg font-black text-slate-800">{meteo.humidite_pct}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500"><Wind className="w-4 h-4 text-slate-400"/> <span className="text-xs font-semibold">Vent (km/h)</span></div>
                  <span className="text-lg font-black text-slate-800">{meteo.vitesse_vent_kmh}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-500"><Compass className="w-4 h-4 text-emerald-600"/> <span className="text-xs font-semibold">Dir. Vent</span></div>
                  <span className="text-lg font-black text-slate-800">{meteo.direction_vent_deg}°</span>
                </div>
                <div className="flex flex-col gap-1 relative">
                  <div className="flex items-center gap-1.5 text-slate-500"><Flame className="w-4 h-4 text-amber-500"/> <span className="text-xs font-semibold">Sécheresse</span></div>
                  <span className={`text-lg font-black ${meteo.indice_secheresse > 3.5 ? 'text-rose-600' : 'text-slate-800'}`}>{meteo.indice_secheresse}</span>
                </div>
              </div>
              {meteo.indice_secheresse > 3.5 && (
                <div className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-600" />
                  Risque extrême de propagation lié à la sécheresse actuelle.
                </div>
              )}
            </div>

            {/* Equipe Config */}
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
               <div>
                 <h4 className="text-slate-900 font-bold mb-1">Destinataire : {myTeam.nom_equipe || "Équipe Connectée"}</h4>
                 <p className="text-xs font-medium text-slate-500 mb-2">Comptage effectif : {myTeam.nombre_dispo || 4} pompiers disponibles</p>
                 <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                      {chef.prenom && chef.nom ? `${chef.prenom[0]}${chef.nom[0]}` : <User className="w-3 h-3"/>}
                    </div>
                    <span className="font-bold">Chef : {chef.prenom} {chef.nom}</span> • {chef.grade} • {chef.telephone}
                 </div>
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-slate-100 p-6 shrink-0 relative">
            {showRefuseReasons ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <p className="text-sm font-bold text-slate-700 mb-3 text-center">Raison du refus :</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['Équipe incomplète', 'Zone hors périmètre', 'En intervention', 'Autre'].map(r => (
                    <button key={r} onClick={() => handleRefuse(r)} className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-colors">
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowRefuseReasons(false)} className="w-full text-center text-xs text-slate-400 font-semibold hover:text-slate-600 underline">
                  Annuler
                </button>
              </motion.div>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRefuseReasons(true)}
                  disabled={isAccepting}
                  className="flex-1 py-4 flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                  >
                  ✗ Refuser
                </button>
                <button 
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className={`flex-[2] py-4 flex items-center justify-center gap-2 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none ${isAccepting ? 'bg-emerald-700 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-600/20'}`}
                >
                  {isAccepting ? <Loader2 className="w-6 h-6 animate-spin" /> : '✓ Accepter la mission'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncidentNotificationModal;
