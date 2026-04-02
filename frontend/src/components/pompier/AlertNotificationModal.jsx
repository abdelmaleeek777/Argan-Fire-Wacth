import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, Phone, X, CheckCircle, XCircle, Volume2 } from 'lucide-react';

// Alert sound - using a simple beep sound
const ALERT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export default function AlertNotificationModal({ alert, onAccept, onIgnore, onClose, isOpen, onTakeMission }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Use onTakeMission if provided, otherwise use onAccept
  const handleMission = onTakeMission || onAccept;

  useEffect(() => {
    // Play alert sound when modal opens
    if (alert && isOpen && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [alert, isOpen]);

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleAccept = () => {
    stopSound();
    handleMission(alert);
  };

  const handleIgnore = () => {
    stopSound();
    if (onIgnore) onIgnore(alert);
  };

  const handleClose = () => {
    stopSound();
    if (onClose) onClose();
  };

  if (!alert || !isOpen) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITIQUE': return 'from-rose-600 to-red-700';
      case 'ATTENTION': return 'from-amber-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'CRITIQUE': return 'bg-rose-500';
      case 'ATTENTION': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <audio ref={audioRef} src={ALERT_SOUND_URL} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with pulsing animation */}
          <div className={`bg-gradient-to-br ${getSeverityColor(alert.severity)} p-6 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]" />
            
            {/* Pulsing circle animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={`w-32 h-32 rounded-full ${getSeverityBg(alert.severity)} opacity-30 animate-ping`} />
            </div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    🔥 NEW ALERT
                  </h2>
                  <p className="text-white/80 text-sm font-medium">
                    {alert.severity === 'CRITIQUE' ? 'Critical Emergency' : 
                     alert.severity === 'ATTENTION' ? 'High Priority' : 'Standard Alert'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isPlaying && (
                  <button
                    onClick={stopSound}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    <Volume2 className="w-5 h-5 text-white" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <MapPin className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-lg font-bold text-slate-800">{alert.zone || 'Unknown Zone'}</p>
                <p className="text-sm text-slate-500">{alert.region || 'Souss-Massa Region'}</p>
              </div>
            </div>

            {/* Cooperative */}
            {alert.cooperative && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl">
                <Phone className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cooperative</p>
                  <p className="text-lg font-bold text-slate-800">{alert.cooperative}</p>
                </div>
              </div>
            )}

            {/* Temperature if available */}
            {alert.temperature && (
              <div className="flex items-center justify-center p-4 bg-orange-50 rounded-2xl">
                <div className="text-center">
                  <p className="text-4xl font-black text-orange-600">{alert.temperature}°C</p>
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Detected Temperature</p>
                </div>
              </div>
            )}

            {/* Time */}
            <p className="text-center text-sm text-slate-400">
              Alert triggered {alert.timeAgo || 'just now'}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleIgnore}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                <XCircle className="w-5 h-5" />
                Ignore
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
              >
                <CheckCircle className="w-5 h-5" />
                Take Mission
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
