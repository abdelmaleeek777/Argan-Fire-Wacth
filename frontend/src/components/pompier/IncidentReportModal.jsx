import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Flame, Clock, MapPin, Loader2, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import api from '../../utils/axiosInstance';

const CAUSE_OPTIONS = [
  'Natural causes (lightning)',
  'Human negligence',
  'Agricultural burning',
  'Arson (suspected)',
  'Electrical fault',
  'Unknown',
  'Other'
];

const STATUS_OPTIONS = [
  { value: 'EN_COURS', label: 'Still Active', icon: Flame, accentColor: '#A64D4D', bgColor: 'rgba(166,77,77,0.08)' },
  { value: 'MAITRISE', label: 'Under Control', icon: Shield, accentColor: '#B88A44', bgColor: 'rgba(184,138,68,0.08)' },
  { value: 'ETEINT', label: 'Extinguished', icon: CheckCircle, accentColor: '#4E6B4A', bgColor: 'rgba(78,107,74,0.08)' }
];

export default function IncidentReportModal({ alert, onClose, onSuccess, isOpen }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    statut_incendie: 'ETEINT',
    superficie_brulee_ha: '',
    cause_presumee: '',
    observations: '',
    date_fin: new Date().toISOString().slice(0, 16)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Get the alert ID - try multiple possible field names
    const alertId = alert?.id_alerte || alert?.id;
    
    if (!alertId) {
      console.error('No alert ID found in:', alert);
      window.alert('Error: No alert ID found. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Submit incident report and resolve alert
      const payload = {
        id_alerte: alertId,
        statut_incendie: formData.statut_incendie,
        date_fin: formData.date_fin,
        superficie_brulee_ha: parseFloat(formData.superficie_brulee_ha) || 0,
        cause_presumee: formData.cause_presumee,
        observations: formData.observations
      };
      console.log('Submitting incident report:', payload);
      
      const response = await api.post('/incidents/report', payload);
      console.log('Response:', response.data);

      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting report:', err);
      console.error('Error response:', err.response?.data);
      window.alert('Failed to submit report: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  console.log('IncidentReportModal - alert:', alert, 'isOpen:', isOpen);
  
  if (!alert || !isOpen) return null;

  const selectedStatusOpt = STATUS_OPTIONS.find(s => s.value === formData.statut_incendie);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1F2A22]/40 backdrop-blur-sm" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-[#F8F7F2] shadow-[0_40px_100px_rgba(31,42,33,0.25)] max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]"
        style={{ borderRadius: '34px 20px 40px 24px' }}
        onClick={e => e.stopPropagation()}
      >
        {success ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#4E6B4A]/12 flex items-center justify-center mx-auto mb-6 border border-[#4E6B4A]/15">
              <CheckCircle className="w-10 h-10 text-[#4E6B4A]" />
            </div>
            <h2 className="text-[24px] font-[800] text-[#1F2A22]">Report Submitted</h2>
            <p className="text-[#6B7468] font-[600] mt-2 text-[14px]">The incident has been recorded and the alert marked as resolved.</p>
          </div>
        ) : (
          <>
            {/* Premium Header */}
            <div className="relative overflow-hidden p-8 pb-6">
              {/* Background accent glow */}
              <div className="absolute right-[-10%] top-[-30%] w-[50%] h-[150%] opacity-[0.12] blur-[60px] pointer-events-none rounded-full z-0" style={{ backgroundColor: '#B88A44' }} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10] shadow-sm">
                    <FileText className="w-6 h-6 text-[#B88A44]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-[800] text-[#1F2A22] tracking-tight">
                      Incident Report
                    </h2>
                    <p className="metadata text-[11px] mt-0.5">
                      Complete the fire incident details
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-[38px] h-[38px] rounded-[12px] bg-[#ECE9E1] border border-[#4F5C4A]/[0.10] flex items-center justify-center hover:bg-[#DCE3D6] transition-all"
                >
                  <X className="w-4 h-4 text-[#6B7468]" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {/* Alert Info Card */}
              <div className="px-8 mt-2">
              <div className="flex items-center gap-3 p-4 bg-[#ECE9E1]/60 rounded-[16px] border border-[#4F5C4A]/[0.08]">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#A64D4D]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#A64D4D]" />
                </div>
                <div>
                  <p className="metadata text-[10px]">Location</p>
                  <p className="font-[800] text-[14px] text-[#1F2A22]">
                    {alert.zone?.nom_zone || alert.zone || 'Unknown Zone'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
              
              {/* Fire Status — Premium Toggle */}
              <div>
                <label className="metadata text-[11px] block mb-3">
                  Fire Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {STATUS_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = formData.statut_incendie === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, statut_incendie: opt.value }))}
                        className={`relative flex flex-col items-center gap-2 px-4 py-4 rounded-[16px] transition-all duration-300 border ${
                          isSelected
                            ? 'shadow-md border-current'
                            : 'bg-[#ECE9E1]/60 border-[#4F5C4A]/[0.08] hover:bg-[#ECE9E1] text-[#6B7468]'
                        }`}
                        style={isSelected ? { 
                          backgroundColor: opt.bgColor,
                          color: opt.accentColor,
                          borderColor: `color-mix(in srgb, ${opt.accentColor} 30%, transparent)`
                        } : {}}
                      >
                        <Icon className="w-5 h-5" strokeWidth={isSelected ? 2.5 : 2} />
                        <span className="text-[11px] font-[800] uppercase tracking-wider">{opt.label}</span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: opt.accentColor }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* End Date/Time */}
              <div>
                <label className="metadata text-[11px] mb-2 block">
                  <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#ECE9E1]/60 border border-[#4F5C4A]/[0.10] rounded-[14px] focus:bg-white focus:border-[#B88A44]/30 focus:shadow-[0_0_0_3px_rgba(184,138,68,0.08)] outline-none transition-all text-[14px] font-[700] text-[#1F2A22]"
                />
              </div>

              {/* Area Burned */}
              <div>
                <label className="metadata text-[11px] mb-2 block">
                  <Flame className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Area Burned (hectares)
                </label>
                <input
                  type="number"
                  name="superficie_brulee_ha"
                  value={formData.superficie_brulee_ha}
                  onChange={handleChange}
                  placeholder="e.g. 2.5"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-[#ECE9E1]/60 border border-[#4F5C4A]/[0.10] rounded-[14px] focus:bg-white focus:border-[#B88A44]/30 focus:shadow-[0_0_0_3px_rgba(184,138,68,0.08)] outline-none transition-all text-[14px] font-[700] text-[#1F2A22] placeholder-[#6B7468]/50"
                />
              </div>

              {/* Presumed Cause */}
              <div>
                <label className="metadata text-[11px] mb-2 block">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                  Presumed Cause
                </label>
                <select
                  name="cause_presumee"
                  value={formData.cause_presumee}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#ECE9E1]/60 border border-[#4F5C4A]/[0.10] rounded-[14px] focus:bg-white focus:border-[#B88A44]/30 focus:shadow-[0_0_0_3px_rgba(184,138,68,0.08)] outline-none transition-all text-[14px] font-[700] text-[#1F2A22] appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7468' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Select a cause...</option>
                  {CAUSE_OPTIONS.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </div>

              {/* Observations */}
              <div>
                <label className="metadata text-[11px] mb-2 block">
                  Observations & Notes
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  placeholder="Describe the situation, actions taken, damage assessment..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#ECE9E1]/60 border border-[#4F5C4A]/[0.10] rounded-[14px] focus:bg-white focus:border-[#B88A44]/30 focus:shadow-[0_0_0_3px_rgba(184,138,68,0.08)] outline-none transition-all text-[14px] font-[700] text-[#1F2A22] placeholder-[#6B7468]/50 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-[#4E6B4A] hover:bg-[#3d5439] text-white font-[800] text-[13px] uppercase tracking-widest rounded-[16px] transition-all shadow-[0_8px_24px_rgba(78,107,74,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Report & Resolve
                  </>
                )}
              </button>
            </form>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
