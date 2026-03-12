import { useState } from "react";
import { Bell, Search, Filter, ChevronDown, ChevronRight, Wind, AlertTriangle, CheckCircle2, Navigation } from "lucide-react";

const MOCK_ALERTES = [
  { id_alerte: 101, zone: "Zone Nord-Est", id_zone: 1, capteur: "CAP-NE-03", temperature_detectee: 74.2, niveau_urgence: "alerte", statut: "active", date_heure_declenchement: "2025-06-14T09:42:00", probabilite_propagation_pct: 68, direction_propagation_deg: 112, vitesse_propagation_ha_h: 2.4, sms_envoye: true, equipe: "Equipe Alpha" },
  { id_alerte: 100, zone: "Zone Centrale", id_zone: 2, capteur: "CAP-CT-01", temperature_detectee: 58.7, niveau_urgence: "vigilance", statut: "active", date_heure_declenchement: "2025-06-14T08:10:00", probabilite_propagation_pct: 33, direction_propagation_deg: 90, vitesse_propagation_ha_h: 1.1, sms_envoye: false, equipe: null },
  { id_alerte: 99, zone: "Zone Haute", id_zone: 6, capteur: "CAP-HT-02", temperature_detectee: 55.0, niveau_urgence: "vigilance", statut: "active", date_heure_declenchement: "2025-06-14T06:55:00", probabilite_propagation_pct: 28, direction_propagation_deg: 105, vitesse_propagation_ha_h: 0.9, sms_envoye: false, equipe: null },
  { id_alerte: 98, zone: "Zone Centrale", id_zone: 2, capteur: "CAP-CT-02", temperature_detectee: 91.5, niveau_urgence: "urgence_maximale", statut: "traitée", date_heure_declenchement: "2025-06-13T14:15:00", probabilite_propagation_pct: 85, direction_propagation_deg: 120, vitesse_propagation_ha_h: 5.8, sms_envoye: true, equipe: "Equipe Alpha" },
  { id_alerte: 97, zone: "Zone Est", id_zone: 5, capteur: "CAP-EST-01", temperature_detectee: 63.4, niveau_urgence: "alerte", statut: "traitée", date_heure_declenchement: "2025-06-13T11:30:00", probabilite_propagation_pct: 54, direction_propagation_deg: 95, vitesse_propagation_ha_h: 2.0, sms_envoye: true, equipe: "Equipe Beta" },
  { id_alerte: 96, zone: "Zone Nord-Est", id_zone: 1, capteur: "CAP-NE-01", temperature_detectee: 51.3, niveau_urgence: "vigilance", statut: "traitée", date_heure_declenchement: "2025-06-12T16:00:00", probabilite_propagation_pct: 20, direction_propagation_deg: 80, vitesse_propagation_ha_h: 0.5, sms_envoye: false, equipe: null },
  { id_alerte: 95, zone: "Zone Sud", id_zone: 3, capteur: "CAP-SUD-02", temperature_detectee: 52.1, niveau_urgence: "vigilance", statut: "fausse_alerte", date_heure_declenchement: "2025-06-12T07:30:00", probabilite_propagation_pct: 22, direction_propagation_deg: 70, vitesse_propagation_ha_h: 0.6, sms_envoye: false, equipe: null },
  { id_alerte: 94, zone: "Zone Ouest", id_zone: 4, capteur: "CAP-OUE-03", temperature_detectee: 88.9, niveau_urgence: "urgence_maximale", statut: "traitée", date_heure_declenchement: "2025-06-11T12:45:00", probabilite_propagation_pct: 79, direction_propagation_deg: 130, vitesse_propagation_ha_h: 4.7, sms_envoye: true, equipe: "Equipe Gamma" },
];

const urgenceStyles = {
  vigilance: { label: "Vigilance", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  alerte: { label: "Alerte", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  urgence_maximale: { label: "Urgence max.", dot: "bg-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200 shadow-sm" },
};

const statutStyles = {
  active: { label: "Active", row: "bg-orange-50/30 border-rose-200", badge: "bg-rose-100 text-rose-700 border-rose-200 font-bold" },
  "traitée": { label: "Traitée", row: "bg-white border-slate-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fausse_alerte: { label: "Fausse alerte", row: "bg-slate-50/50 border-slate-200 opacity-75", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short" }) +
    " à " + d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

function directionLabel(deg) {
  if (deg >= 45 && deg <= 135) return `${deg}° (Est — Chergui)`;
  if (deg > 135 && deg <= 225) return `${deg}° (Sud)`;
  if (deg > 225 && deg <= 315) return `${deg}° (Ouest)`;
  return `${deg}° (Nord)`;
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
              {isChergui && <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Wind className="w-3 h-3" /> Chergui</span>}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Bell className="w-3 h-3 text-orange-500" /> Statut SMS</div>
            <div className={`text-sm font-bold flex items-center gap-1.5 ${alerte.sms_envoye ? "text-emerald-600" : "text-slate-400"}`}>
              {alerte.sms_envoye ? <><CheckCircle2 className="w-4 h-4" /> Envoyé avec succès</> : "Non envoyé"}
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Équipe affectée</div>
            <div className={`text-sm font-bold ${alerte.equipe ? "text-blue-600" : "text-slate-400"}`}>
              {alerte.equipe || "Aucune équipe"}
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
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreUrgence, setFiltreUrgence] = useState("tous");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  const alertesFiltrees = MOCK_ALERTES.filter(a => {
    if (filtreStatut !== "tous" && a.statut !== filtreStatut) return false;
    if (filtreUrgence !== "tous" && a.niveau_urgence !== filtreUrgence) return false;
    if (search && !a.zone.toLowerCase().includes(search.toLowerCase()) && !a.capteur.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countActives = MOCK_ALERTES.filter(a => a.statut === "active").length;
  const countUrgMax = MOCK_ALERTES.filter(a => a.niveau_urgence === "urgence_maximale").length;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center flex-shrink-0 shadow-rose-200 shadow-md">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alertes Incendies</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5 flex items-center gap-2">
                Coopérative Tifawt Argan
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-rose-600 font-bold">{countActives} active(s)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center transition-all hover:shadow-md">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher zone ou capteur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-40 bg-slate-50 rounded-xl">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filtreStatut}
                onChange={e => setFiltreStatut(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-transparent border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium cursor-pointer"
              >
                <option value="tous">Tous statuts</option>
                <option value="active">Active</option>
                <option value="traitée">Traitée</option>
                <option value="fausse_alerte">Fausse alerte</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 md:w-40 bg-slate-50 rounded-xl">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filtreUrgence}
                onChange={e => setFiltreUrgence(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-transparent border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium cursor-pointer"
              >
                <option value="tous">Tous niveaux</option>
                <option value="vigilance">Vigilance</option>
                <option value="alerte">Alerte</option>
                <option value="urgence_maximale">Urgence maximale</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Résultats ({alertesFiltrees.length})</h2>
        </div>

        {/* Liste alertes */}
        {alertesFiltrees.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Aucune alerte trouvée</h3>
            <p className="text-slate-500 text-sm">Il n'y a pas d'alertes correspondant à vos critères de recherche.</p>
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
    </div>
  );
}
