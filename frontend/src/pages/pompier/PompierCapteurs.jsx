import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wind, Droplets, Thermometer, Wifi, WifiOff, RefreshCw, Cpu, BrainCircuit } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../../utils/axiosInstance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

export default function PompierCapteurs() {
  const [capteurs, setCapteurs] = useState([]);
  const [selectedCapteur, setSelectedCapteur] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [periode, setPeriode] = useState('24h');
  
  // Dashboard temps réel (dernier relevé)
  const [realtime, setRealtime] = useState({ temperature: 0, humidite: 0, vent_vitesse: 0, vent_direction: 0, indice_secheresse: 0 });

  // IA State
  const [iaLoading, setIaLoading] = useState(false);
  const [iaResult, setIaResult] = useState(null);

  useEffect(() => {
    // Liste des capteurs
    const mockCapteurs = [
      { id: 1, numero_serie: 'C-THW-001', zone: 'Zone Nord', etat: 'actif', der_temp: 45, date_derniere_maintenance: '2023-10-01' },
      { id: 2, numero_serie: 'C-THW-002', zone: 'Forêt Centrale', etat: 'en_panne', der_temp: null, date_derniere_maintenance: '2023-05-15' },
      { id: 3, numero_serie: 'C-THW-003', zone: 'Igherm Sud', etat: 'actif', der_temp: 32, date_derniere_maintenance: '2023-11-20' },
    ];
    setCapteurs(mockCapteurs);
    if(mockCapteurs.length > 0) setSelectedCapteur(mockCapteurs[0]);
  }, []);

  useEffect(() => {
    if (selectedCapteur) {
      // Mock fetch history
      const labels = ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'];
      setChartData({
        labels,
        datasets: [
          { label: 'Température (°C)', data: labels.map(() => Math.random()*20 + 30), borderColor: '#EF4444', backgroundColor: '#EF4444', tension: 0.4 },
          { label: 'Humidité (%)', data: labels.map(() => Math.random()*40 + 20), borderColor: '#3B82F6', backgroundColor: '#3B82F6', tension: 0.4 },
          { label: 'Vent (km/h)', data: labels.map(() => Math.random()*50), borderColor: '#06B6D4', backgroundColor: '#06B6D4', tension: 0.4 },
          { label: 'Sécheresse (0-5)', data: labels.map(() => Math.random()*5), borderColor: '#F97316', backgroundColor: '#F97316', tension: 0.4 }
        ]
      });

      // Mock realtime
      setRealtime({
        temperature: selectedCapteur.der_temp || 0,
        humidite: Math.floor(Math.random() * 50) + 10,
        vent_vitesse: Math.floor(Math.random() * 60),
        vent_direction: Math.floor(Math.random() * 360),
        indice_secheresse: Math.floor(Math.random() * 5) + 1
      });
    }
  }, [selectedCapteur, periode]);

  const loadIAAnalysis = () => {
    setIaLoading(true);
    setTimeout(() => {
      setIaResult({
        recommandation: "Propagation rapide prévue vers le Nord-Est due aux vents forts de Chergui. Fort danger pour les habitations proches.",
        directions_fuite: "Sud-Ouest",
        risque_immediat: "Villages de la vallée",
        pompiers_recommandes: 12
      });
      setIaLoading(false);
    }, 1500);
  };

  const isChergui = (deg) => deg >= 45 && deg <= 135;
  const getTempColor = (t) => t < 50 ? 'text-emerald-500 stroke-emerald-500' : (t <= 70 ? 'text-orange-500 stroke-orange-500' : 'text-rose-500 stroke-rose-500');

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Capteurs & Analyse</h1>
        <p className="text-slate-500 font-medium">Relevés météorologiques et données de terrain en temps réel.</p>
      </div>

      {/* Grid des données temps réel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temp Gauge */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative">
          <Thermometer className="absolute top-4 left-4 text-slate-300" size={18} />
          <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Température</h3>
          <div className="relative w-24 h-24 mb-2">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                strokeDasharray={`${(realtime.temperature / 120) * 251} 251`} 
                className={`${getTempColor(realtime.temperature)} transition-all duration-1000`} strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-black ${getTempColor(realtime.temperature).replace('stroke-', '')}`}>{realtime.temperature}°</span>
            </div>
          </div>
        </div>

        {/* Humidité Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center relative">
          <Droplets className="absolute top-4 right-4 text-blue-300" size={18} />
          <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-4">Humidité</h3>
          <div className="text-3xl font-black text-slate-800 mb-3">{realtime.humidite}%</div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${realtime.humidite}%` }}></div>
          </div>
        </div>

        {/* Vent */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center relative">
          <Wind className="absolute top-4 right-4 text-cyan-500" size={18} />
          <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Vent</h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-black text-slate-800">{realtime.vent_vitesse}</span>
            <span className="text-sm font-bold text-slate-400 mb-1">km/h</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 w-fit px-2 py-1 rounded-full border border-slate-100 text-slate-600">
             Dir: {realtime.vent_direction}°
             {isChergui(realtime.vent_direction) && <span className="text-rose-600 bg-rose-100 px-1 rounded uppercase tracking-wider text-[8px]">Chergui</span>}
          </div>
        </div>

        {/* Indice Sécheresse */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center relative">
          <Activity className="absolute top-4 right-4 text-orange-400" size={18} />
          <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Indice Sècheresse</h3>
          <div className="text-3xl font-black text-orange-500 mb-2">{realtime.indice_secheresse}/5</div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <div key={s} className={`h-2 flex-1 rounded-sm ${s <= realtime.indice_secheresse ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Colonne Liste + IA */}
         <div className="space-y-6">
            <h2 className="font-black text-xl text-slate-800 tracking-tight">Capteurs Déployés</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {capteurs.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedCapteur(c)}
                  className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all ${selectedCapteur?.id === c.id ? 'border-emerald-500 shadow-sm shadow-emerald-500/10 scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-slate-800">{c.numero_serie}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.etat === 'actif' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {c.etat}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex justify-between items-center">
                    <span>{c.zone}</span>
                    {c.etat === 'actif' ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} className="text-rose-400" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Encart IA */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 relative overflow-hidden">
               <BrainCircuit className="absolute -right-4 -bottom-4 text-amber-200" size={120} />
               <div className="relative z-10">
                 <h2 className="font-black text-lg text-amber-900 mb-2 flex items-center gap-2">
                    <Cpu size={20} className="text-amber-600" /> Analyse Propagation
                 </h2>
                 {iaResult ? (
                   <div className="space-y-3 mt-4">
                     <p className="text-sm font-bold text-amber-800 bg-white/60 p-3 rounded-2xl leading-relaxed">
                        {iaResult.recommandation}
                     </p>
                     <div className="grid grid-cols-2 gap-2 text-xs font-bold text-amber-900">
                       <div className="bg-white/60 p-2 rounded-xl">Fuite: {iaResult.directions_fuite}</div>
                       <div className="bg-white/60 p-2 rounded-xl text-rose-700">Risque: {iaResult.risque_immediat}</div>
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm text-amber-700/80 font-medium mb-4">L'IA de l'application peut simuler la propagation du feu en fonction du vent et de l'humidité actuels.</p>
                 )}
                 <button onClick={loadIAAnalysis} disabled={iaLoading} className="mt-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors">
                   <RefreshCw size={14} className={iaLoading ? 'animate-spin' : ''} /> {iaLoading ? 'Analyse...' : 'Actualiser analyse'}
                 </button>
               </div>
            </div>
         </div>

         {/* Colonne Chart */}
         <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                 <h2 className="font-black text-xl text-slate-800 tracking-tight">Historique <span className="text-slate-400 font-medium">— {selectedCapteur?.numero_serie}</span></h2>
                 <div className="bg-slate-50 p-1 rounded-xl flex text-xs font-bold">
                   {['6h', '12h', '24h', '7j'].map(p => (
                     <button key={p} onClick={() => setPeriode(p)} className={`px-4 py-1.5 rounded-lg transition-colors ${periode === p ? 'bg-white shadow-sm text-slate-800 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                       {p}
                     </button>
                   ))}
                 </div>
              </div>
              
              <div className="flex-1 relative w-full h-[400px]">
                {chartData && (
                  <Line 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false } // Custom legend below if needed, here hidden for space
                      },
                      scales: {
                        y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, min: 0 }
                      }
                    }} 
                  />
                )}
              </div>
              
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-black uppercase text-slate-500">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Température</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Humidité</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500"></span> Vent</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Sécheresse</div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
