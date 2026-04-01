import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Search, Filter, ChevronDown, ChevronRight, Wind, AlertTriangle, CheckCircle2, Navigation } from "lucide-react";



const urgenceStyles = {
  vigilance: { label: "Vigilance", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  alerte: { label: "Alert", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  urgence_maximale: { label: "Critical", dot: "bg-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200 shadow-sm" },
};

const statutStyles = {
  active: { label: "Active", row: "bg-orange-50/30 border-rose-200", badge: "bg-rose-100 text-rose-700 border-rose-200 font-bold" },
  "traitée": { label: "Processed", row: "bg-white border-slate-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fausse_alerte: { label: "False Alert", row: "bg-slate-50/50 border-slate-200 opacity-75", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" }) +
    " à " + d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

function directionLabel(deg) {
  if (deg >= 45 && deg <= 135) return `${deg}° (East)`;
  if (deg > 135 && deg <= 225) return `${deg}° (South)`;
  if (deg > 225 && deg <= 315) return `${deg}° (West)`;
  return `${deg}° (North)`;
}

function AlerteCard({ alerte, expanded, onToggle }) {
  const u = urgenceStyles[alerte.niveau_urgence] || {};
  const s = statutStyles[alerte.statut] || {};
  const isChergui = alerte.direction_propagation_deg >= 45 && alerte.direction_propagation_deg <= 135;

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden mb-4 ${s.row} ${alerte.statut === "active" ? "shadow-md hover:shadow-lg" : "hover:border-slate-300"}`}>
      {/* Header row */}
      <div
        onClick={onToggle}
        className="flex items-center gap-4 p-4 cursor-pointer select-none group"
      >
        {/* Urgence dot */}
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${u.dot} ${alerte.statut === "active" ? "animate-pulse" : ""}`} />

        {/* Zone + capteur */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-[15px] group-hover:text-orange-600 transition-colors">{alerte.zone}</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-2">
            <span>{alerte.capteur}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span>{formatDateTime(alerte.date_heure_declenchement)}</span>
          </div>
        </div>

        {/* Temp */}
        <div className="text-right flex-shrink-0">
          <div className={`font-black text-xl tracking-tight ${alerte.temperature_detectee > 80 ? "text-rose-600" : alerte.temperature_detectee > 65 ? "text-orange-500" : "text-amber-500"}`}>
            {alerte.temperature_detectee}°C
          </div>
          <div className="text-[11px] font-bold text-slate-400 capitalize">{alerte.probabilite_propagation_pct}% prop.</div>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 w-28 items-end">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${u.badge}`}>{u.label}</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badge}`}>{s.label}</span>
        </div>

        {/* Expand arrow */}
        <div className="text-slate-400 flex-shrink-0 ml-2">
          <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${expanded ? "rotate-90 text-orange-500" : "group-hover:translate-x-1"}`} />
        </div>
      </div>

      {/* Expanded details */}
      <div className={`transition-all duration-300 ease-in-out ${expanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="border-t border-slate-100 p-5 bg-white/50 backdrop-blur-sm grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Navigation className="w-3 h-3 text-blue-500" /> Propagation</div>
            <div className="text-sm font-bold text-slate-700">{directionLabel(alerte.direction_propagation_deg)}</div>
            <div className={`text-xs mt-1 font-medium flex items-center gap-2 ${isChergui ? "text-rose-600" : "text-slate-500"}`}>
              {alerte.vitesse_propagation_ha_h} ha/h
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Bell className="w-3 h-3 text-orange-500" /> SMS Status</div>
            <div className={`text-sm font-bold flex items-center gap-1.5 ${alerte.sms_envoye ? "text-emerald-600" : "text-slate-400"}`}>
              {alerte.sms_envoye ? <><CheckCircle2 className="w-4 h-4" /> Successfully sent</> : "Not sent"}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Team</div>
            <div className={`text-sm font-bold ${alerte.equipe ? "text-blue-600" : "text-slate-400"}`}>
              {alerte.equipe || "No team"}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Alerte</div>
            <div className="text-sm font-mono text-slate-500">#{alerte.id_alerte}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoopAlerts() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreUrgence, setFiltreUrgence] = useState("tous");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    if (coopId) {
      fetchAlertes();
    }
  }, [coopId]);

  const fetchAlertes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/cooperative/${coopId}/alerts`
      );
      setAlertes(response.data);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const alertesFiltrees = alertes.filter(a => {
    if (filtreStatut !== "tous" && a.statut !== filtreStatut) return false;
    if (filtreUrgence !== "tous" && a.niveau_urgence !== filtreUrgence) return false;
    if (
      search &&
      !a.zone?.toLowerCase().includes(search.toLowerCase()) &&
      !a.capteur?.toLowerCase().includes(search.toLowerCase())
    ) return false;
    return true;
  });

  const countActives = alertes.filter(a => a.statut === "active").length;

  return (
    <div className="min-h-screen text-slate-900 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-200">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Alert Feed</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
              Critical monitoring
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span className="text-rose-600 font-bold">{countActives} active</span>
            </p>
          </div>
        </div>
        <button onClick={fetchAlertes} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center transition-all hover:shadow-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search zone or sensor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-44 bg-slate-50 rounded-xl border border-slate-200 group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <select
              value={filtreStatut}
              onChange={e => setFiltreStatut(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-transparent rounded-xl text-sm appearance-none focus:outline-none font-bold text-slate-600 cursor-pointer"
            >
              <option value="tous">All statuses</option>
              <option value="active">Active</option>
              <option value="traitée">Processed</option>
              <option value="fausse_alerte">False Alert</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="relative flex-1 md:w-44 bg-slate-50 rounded-xl border border-slate-200 group">
            <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
            <select
              value={filtreUrgence}
              onChange={e => setFiltreUrgence(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-transparent rounded-xl text-sm appearance-none focus:outline-none font-bold text-slate-600 cursor-pointer"
            >
              <option value="tous">All levels</option>
              <option value="vigilance">Vigilance</option>
              <option value="alerte">Alert</option>
              <option value="urgence_maximale">Critical</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xs font-black text-slate-400 capitalize tracking-widest">Detected Alerts ({alertesFiltrees.length})</h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse"></div>
          ))}
        </div>
      ) : alertesFiltrees.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No alerts found</h3>
          <p className="text-slate-500 font-medium">The system has not detected any critical incidents at the moment.</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {alertesFiltrees.map(a => (
            <AlerteCard
              key={a.id_alerte}
              alerte={a}
              expanded={expandedId === a.id_alerte}
              onToggle={() => setExpandedId(expandedId === a.id_alerte ? null : a.id_alerte)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { RefreshCcw } from "lucide-react";
