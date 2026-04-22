import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, Phone, X, CheckCircle, XCircle, Volume2, Flame, Thermometer, Shield } from 'lucide-react';

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

  const isCritical = alert.severity === 'CRITIQUE' || alert.severity === 'urgence_maximale';
  const isWarning = alert.severity === 'ATTENTION' || alert.severity === 'alerte_elevee';
  
  // Argan palette accent based on severity
  const accentColor = isCritical ? '#B55A3C' : isWarning ? '#B88A44' : '#4E6B4A';
  const severityLabel = isCritical ? 'Critical Emergency' : isWarning ? 'High Priority' : 'Standard Alert';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#1F2A22]/40 backdrop-blur-sm" />
        
        <audio ref={audioRef} src={ALERT_SOUND_URL} />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-[#F8F7F2] shadow-[0_40px_100px_rgba(31,42,33,0.25)] max-w-md w-full overflow-hidden"
          style={{ borderRadius: '34px 20px 40px 24px' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Blurred Accent Background */}
          <div 
            className="absolute right-[-15%] top-[-20%] w-[60%] h-[140%] opacity-[0.18] blur-[70px] pointer-events-none rounded-full z-0"
            style={{ backgroundColor: accentColor }}
          />

          {/* Contour Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none z-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at 90% -20%, transparent 40%, #1F2A22 41%, transparent 42%),
                                radial-gradient(ellipse at 90% -20%, transparent 50%, #1F2A22 51%, transparent 52%),
                                radial-gradient(ellipse at 90% -20%, transparent 60%, #1F2A22 61%, transparent 62%)`,
              backgroundSize: '150% 150%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />

          {/* Header */}
          <div className="relative z-10 p-8 pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center border shadow-sm"
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${accentColor} 12%, #F8F7F2)`,
                    borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`
                  }}
                >
                  <Flame className="w-6 h-6 animate-pulse" style={{ color: accentColor }} />
                </div>
                <div>
                  <h2 className="text-[20px] font-[800] text-[#1F2A22] tracking-tight">
                    New Alert
                  </h2>
                  <div className="metadata flex items-center gap-2 text-[11px] mt-0.5" style={{ color: accentColor }}>
                    {isCritical && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />}
                    <span>{severityLabel}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isPlaying && (
                  <button
                    onClick={stopSound}
                    className="w-[38px] h-[38px] rounded-[12px] bg-[#ECE9E1] border border-[#4F5C4A]/[0.10] flex items-center justify-center hover:bg-[#DCE3D6] transition-all"
                  >
                    <Volume2 className="w-4 h-4 text-[#6B7468]" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="w-[38px] h-[38px] rounded-[12px] bg-[#ECE9E1] border border-[#4F5C4A]/[0.10] flex items-center justify-center hover:bg-[#DCE3D6] transition-all"
                >
                  <X className="w-4 h-4 text-[#6B7468]" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 pt-6 space-y-3">
            
            {/* Location */}
            <div className="flex items-start gap-3 p-4 bg-[#ECE9E1]/60 rounded-[16px] border border-[#4F5C4A]/[0.08]">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-[#A64D4D]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#A64D4D]" />
              </div>
              <div>
                <p className="metadata text-[10px]">Location</p>
                <p className="font-[800] text-[16px] text-[#1F2A22] leading-tight">{alert.zone || 'Unknown Zone'}</p>
                <p className="text-[12px] text-[#6B7468] font-[600] mt-0.5">{alert.region || 'Souss-Massa Region'}</p>
              </div>
            </div>

            {/* Cooperative */}
            {alert.cooperative && (
              <div className="flex items-start gap-3 p-4 bg-[#ECE9E1]/60 rounded-[16px] border border-[#4F5C4A]/[0.08]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#4E6B4A]/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-[#4E6B4A]" />
                </div>
                <div>
                  <p className="metadata text-[10px]">Cooperative</p>
                  <p className="font-[800] text-[16px] text-[#1F2A22] leading-tight">{alert.cooperative}</p>
                </div>
              </div>
            )}

            {/* Temperature */}
            {alert.temperature && (
              <div className="p-4 rounded-[16px] border text-center"
                style={{ 
                  backgroundColor: `color-mix(in srgb, ${accentColor} 6%, #F8F7F2)`,
                  borderColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Thermometer className="w-5 h-5" style={{ color: accentColor }} />
                  <p className="text-[32px] font-[800] leading-none" style={{ color: accentColor }}>{alert.temperature}°C</p>
                </div>
                <p className="metadata text-[10px] mt-1.5" style={{ color: accentColor }}>Detected Temperature</p>
              </div>
            )}

            {/* Severity Badge */}
            <div className="flex items-center justify-center">
              <div 
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-[14px] backdrop-blur-md shadow-sm border"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accentColor} 8%, rgba(247,244,238,0.95))`,
                  borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
                  color: accentColor
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ backgroundColor: accentColor }} />
                <span className="badge text-[11px]">
                  {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'INFO'} · {alert.timeAgo || 'Just now'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={handleIgnore}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-[#ECE9E1] hover:bg-[#DCE3D6] text-[#6B7468] hover:text-[#1F2A22] font-[800] text-[12px] uppercase tracking-widest rounded-[16px] transition-all border border-[#4F5C4A]/[0.10]"
              >
                <XCircle className="w-4 h-4" />
                Ignore
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center justify-center gap-2 px-5 py-4 bg-[#4E6B4A] hover:bg-[#3d5439] text-white font-[800] text-[12px] uppercase tracking-widest rounded-[16px] transition-all shadow-[0_8px_24px_rgba(78,107,74,0.25)] active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" />
                Take Mission
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
