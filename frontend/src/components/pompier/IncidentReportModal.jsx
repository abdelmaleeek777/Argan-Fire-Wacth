import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Flame, Clock, MapPin, Loader2, CheckCircle } from 'lucide-react';
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
  { value: 'EN_COURS', label: 'Still Active', color: 'bg-rose-500' },
  { value: 'MAITRISE', label: 'Under Control', color: 'bg-amber-500' },
  { value: 'ETEINT', label: 'Extinguished', color: 'bg-emerald-500' }
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Report Submitted!</h2>
            <p className="text-slate-500 mt-2">The incident has been recorded and the alert marked as resolved.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Incident Report
                    </h2>
                    <p className="text-white/60 text-sm font-medium">
                      Complete the fire incident details
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Alert Info */}
            <div className="px-6 pt-6">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <MapPin className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                  <p className="font-bold text-slate-800">
                    {alert.zone?.nom_zone || alert.zone || 'Unknown Zone'}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fire Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, statut_incendie: opt.value }))}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.statut_incendie === opt.value
                          ? `${opt.color} text-white shadow-lg`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* End Date/Time */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Area Burned */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <Flame className="w-4 h-4 inline mr-1" />
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Presumed Cause */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Presumed Cause
                </label>
                <select
                  name="cause_presumee"
                  value={formData.cause_presumee}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Select a cause...</option>
                  {CAUSE_OPTIONS.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Observations & Notes
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleChange}
                  placeholder="Describe the situation, actions taken, damage assessment..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Report & Resolve Alert
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
