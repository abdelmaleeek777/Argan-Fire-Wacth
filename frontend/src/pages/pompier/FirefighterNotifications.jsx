import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, CheckCircle, XCircle, Search, Clock, Thermometer, Wind, X as XIcon, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/axiosInstance';

export default function FirefighterNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      // MOCKUP DB ALERTS
      const mockAlerts = [
        { id: 1, type: 'Temperature', zone: 'North Forest', severity: 'Critical', message: 'Abnormal temperature rise (> 55°C)', status: 'new', temp: 58, humidity: 20, wind: 'Chergui (45km/h)', date: new Date().toISOString(), lat: 30.12, lng: -9.00 },
        { id: 2, type: 'Smoke', zone: 'Argan Valley', severity: 'High', message: 'Heavy smoke particles detected.', status: 'taken', temp: 42, humidity: 30, wind: 'Normal (15km/h)', date: new Date(Date.now() - 3600000).toISOString(), lat: 29.8, lng: -8.4 },
        { id: 3, type: 'System', zone: 'South Zone', severity: 'Low', message: 'Sensor C-THW disconnected.', status: 'ignored', temp: '--', humidity: '--', wind: '--', date: new Date(Date.now() - 86400000).toISOString(), lat: 30.4, lng: -9.5 }
      ];
      setTimeout(() => {
        setAlerts(mockAlerts);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const statusConfig = {
    'new': { badge: 'bg-rose-500 text-white animate-pulse', border: 'border-l-[6px] border-l-rose-500', icon: Flame, text: 'New Alert' },
    'taken': { badge: 'bg-emerald-100 text-emerald-700', border: 'border-l-[6px] border-l-emerald-500', icon: Crosshair, text: 'Taken In Charge' },
    'ignored': { badge: 'bg-slate-100 text-slate-500', border: 'border-l-[6px] border-l-slate-400', icon: XCircle, text: 'Ignored' }
  };

  const handleTakeCharge = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'taken' } : a));
      setSelectedAlert(null);
      // await api.patch(`/api/alerts/${id}`, { status: 'taken', firefighter_id: user?.id });
    } catch (err) { console.error(err); }
  };

  const handleIgnore = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ignored' } : a));
      setSelectedAlert(null);
      // await api.patch(`/api/alerts/${id}`, { status: 'ignored' });
    } catch (err) { console.error(err); }
  };

  const getRelativeTime = (isoDate) => {
    const min = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} mins ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours} hrs ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Bell className="text-emerald-500"/> Notifications
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage incoming alerts from the database.</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl w-full" />)
        ) : alerts.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 border-dashed text-slate-400 font-bold">
            No active alerts found in the database.
          </div>
        ) : (
          alerts.map(alert => {
            const config = statusConfig[alert.status] || statusConfig['new'];
            const StatusIcon = config.icon;
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-all cursor-pointer ${config.border} flex flex-col md:flex-row md:items-center justify-between gap-6`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${alert.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                      {alert.severity}
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      {alert.zone}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-3 truncate max-w-xl">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12}/> {getRelativeTime(alert.date)}</span>
                    <span className="flex items-center gap-1"><Thermometer size={12}/> {alert.temp}°C</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-black flex items-center gap-1.5 ${config.badge}`}>
                    <StatusIcon size={14} /> {config.text}
                  </span>

                  {alert.status === 'new' && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleIgnore(alert.id, e)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Ignore
                      </button>
                      <button 
                        onClick={(e) => handleTakeCharge(alert.id, e)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Take Charge
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Drawer Details */}
      <AnimatePresence>
        {selectedAlert && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAlert(null)}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-slate-50 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-xl font-black text-slate-800">Alert #{selectedAlert.id} Details</h2>
                <button onClick={() => setSelectedAlert(null)} className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-600 rounded-full transition-colors">
                  <XIcon size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Meta block */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
                  <div>
                     <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Zone</span>
                     <span className="text-sm font-black text-slate-800">{selectedAlert.zone}</span>
                  </div>
                  <div>
                     <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Date</span>
                     <span className="text-sm font-bold text-slate-600">{new Date(selectedAlert.date).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                     <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">System Message</span>
                     <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl font-mono text-xs mt-1">
                       &gt; {selectedAlert.message}
                     </div>
                  </div>
                </div>

                {/* Sensor Data */}
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1">Sensor Readings</h3>
                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                     <Thermometer className="text-rose-500 mb-2" size={20} />
                     <span className="text-xl font-black text-slate-800">{selectedAlert.temp}°</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Temp</span>
                   </div>
                   <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                     <Wind className="text-cyan-500 mb-2" size={20} />
                     <span className="text-xs font-black text-slate-800 leading-tight">{selectedAlert.wind}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Wind</span>
                   </div>
                   <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                     <svg className="w-5 h-5 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                     <span className="text-xl font-black text-slate-800">{selectedAlert.humidity}%</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Humidity</span>
                   </div>
                </div>

                {/* Map */}
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider ml-1 mt-6">Location Map</h3>
                <div className="h-[200px] w-full rounded-3xl overflow-hidden shadow-inner border border-slate-200">
                  {selectedAlert.lat && selectedAlert.lng ? (
                    <MapContainer center={[selectedAlert.lat, selectedAlert.lng]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                      <CircleMarker center={[selectedAlert.lat, selectedAlert.lng]} radius={15} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.5 }} />
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold">GPS not available</div>
                  )}
                </div>

                {/* Actions */}
                {selectedAlert.status === 'new' && (
                  <div className="grid grid-cols-2 gap-4 pt-6">
                    <button 
                      onClick={() => handleIgnore(selectedAlert.id)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18}/> Ignore
                    </button>
                    <button 
                      onClick={() => handleTakeCharge(selectedAlert.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <Crosshair size={18}/> Take Charge
                    </button>
                  </div>
                )}
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
