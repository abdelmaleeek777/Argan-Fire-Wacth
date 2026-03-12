import { useState, useEffect } from "react";
import { TreePine, AlertTriangle, CheckCircle2, TrendingUp, Cpu, Flame, MapPin, Activity, AlertOctagon, Info, ChevronRight, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const MOCK_COOP = {
  id_cooperative: 1,
  nom_cooperative: "Coopérative Tifawt Argan",
  responsable: "Fatima Ouarzazi",
  telephone: "+212 6 61 23 45 67",
  superficie_ha: 1240.5,
  date_creation: "2010-03-15",
  adresse: "Douar Aït Baha, Souss-Massa",
};

const MOCK_STATS = {
  zones_total: 6,
  capteurs_actifs: 18,
  capteurs_en_panne: 2,
  alertes_actives: 3,
  alertes_semaine: 11,
  temperature_max: 74.2,
  derniere_mesure: "2025-06-14T09:42:00",
};

const MOCK_CHART_DATA = [
  { time: '00:00', temp: 22, hum: 45 },
  { time: '04:00', temp: 19, hum: 55 },
  { time: '08:00', temp: 28, hum: 35 },
  { time: '12:00', temp: 42, hum: 20 },
  { time: '14:00', temp: 74, hum: 12 }, // Pic d'incendie (alerte)
  { time: '16:00', temp: 55, hum: 15 },
  { time: '20:00', temp: 35, hum: 25 },
];

const MOCK_BATTERY_DATA = [
  { name: 'Zone Nord-Est', batterie: 85 },
  { name: 'Zone Centrale', batterie: 42 },
  { name: 'Zone Sud', batterie: 92 },
  { name: 'Zone Ouest', batterie: 78 },
];

const MOCK_ALERTES = [
  {
    id_alerte: 101,
    zone: "Zone Nord-Est",
    temperature_detectee: 74.2,
    niveau_urgence: "alerte",
    statut: "active",
    date_heure_declenchement: "2025-06-14T09:42:00",
    probabilite_propagation_pct: 68,
  },
  {
    id_alerte: 98,
    zone: "Zone Centrale",
    temperature_detectee: 91.5,
    niveau_urgence: "urgence_maximale",
    statut: "traitée",
    date_heure_declenchement: "2025-06-13T14:15:00",
    probabilite_propagation_pct: 85,
  },
  {
    id_alerte: 95,
    zone: "Zone Sud",
    temperature_detectee: 52.1,
    niveau_urgence: "vigilance",
    statut: "fausse_alerte",
    date_heure_declenchement: "2025-06-12T07:30:00",
    probabilite_propagation_pct: 22,
  },
];

const MOCK_ZONES = [
  { id_zone: 1, nom_zone: "Zone Nord-Est", niveau_risque_base: "élevé", capteurs: 4, superficie_ha: 210 },
  { id_zone: 2, nom_zone: "Zone Centrale", niveau_risque_base: "critique", capteurs: 5, superficie_ha: 340 },
  { id_zone: 3, nom_zone: "Zone Sud", niveau_risque_base: "moyen", capteurs: 3, superficie_ha: 180 },
  { id_zone: 4, nom_zone: "Zone Ouest", niveau_risque_base: "faible", capteurs: 3, superficie_ha: 260 },
  { id_zone: 5, nom_zone: "Zone Est", niveau_risque_base: "moyen", capteurs: 2, superficie_ha: 150 },
  { id_zone: 6, nom_zone: "Zone Haute", niveau_risque_base: "élevé", capteurs: 3, superficie_ha: 100 },
];

const urgenceConfig = {
  vigilance: { label: "Vigilance", bg: "#FFF3CD", color: "#856404", border: "#FFD700" },
  alerte: { label: "Alerte", bg: "#FFE0C2", color: "#8B3A00", border: "#FF7700" },
  urgence_maximale: { label: "Urgence max.", bg: "#FFD6D6", color: "#7B0000", border: "#E53935" },
};

const risqueConfig = {
  faible: { color: "#2E7D32", bg: "#E8F5E9" },
  moyen: { color: "#F57C00", bg: "#FFF3E0" },
  "élevé": { color: "#C62828", bg: "#FFEBEE" },
  critique: { color: "#6A0080", bg: "#F3E5F5" },
};

const statutConfig = {
  active: { label: "Active", color: "#C62828", bg: "#FFEBEE" },
  "traitée": { label: "Traitée", color: "#2E7D32", bg: "#E8F5E9" },
  fausse_alerte: { label: "Fausse alerte", color: "#555", bg: "#F0F0F0" },
};

function formatDateTime(dt) {
  if (!dt) return "â€”";
  const d = new Date(dt);
  return d.toLocaleDateString("fr-MA", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${accent || "#E0E0E0"}`,
      borderRadius: 12,
      padding: "18px 20px",
      minWidth: 140,
      flex: "1 1 140px",
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || "#1A1A2E", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AlerteRow({ alerte }) {
  const u = urgenceConfig[alerte.niveau_urgence] || {};
  const s = statutConfig[alerte.statut] || {};
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", borderBottom: "1px solid #F0F0F0",
      background: alerte.statut === "active" ? "#FFFDF5" : "#fff",
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: u.border || "#ccc", flexShrink: 0,
        boxShadow: alerte.statut === "active" ? `0 0 0 3px ${u.bg}` : "none",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {alerte.zone}
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{formatDateTime(alerte.date_heure_declenchement)}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          display: "inline-block", fontSize: 11, fontWeight: 600,
          padding: "2px 10px", borderRadius: 20,
          background: u.bg, color: u.color, border: `1px solid ${u.border}`,
          marginBottom: 3,
        }}>{u.label}</div>
        <div style={{ fontSize: 12, color: "#777" }}>{alerte.temperature_detectee}Â°C Â· {alerte.probabilite_propagation_pct}% prop.</div>
      </div>
      <div style={{
        fontSize: 11, padding: "2px 8px", borderRadius: 10,
        background: s.bg, color: s.color, flexShrink: 0,
      }}>{s.label}</div>
    </div>
  );
}

function ZoneRow({ zone }) {
  const r = risqueConfig[zone.niveau_risque_base] || {};
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderBottom: "1px solid #F5F5F5",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "#1A1A2E" }}>{zone.nom_zone}</div>
        <div style={{ fontSize: 12, color: "#999" }}>{zone.superficie_ha} ha Â· {zone.capteurs} capteurs</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
        background: r.bg, color: r.color,
      }}>{zone.niveau_risque_base}</div>
    </div>
  );
}

export default function CoopDashboard() {
  const [activeTab, setActiveTab] = useState("apercu");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "apercu", label: "Aperçu général" },
    { id: "zones", label: "Zones forestières" },
    { id: "capteurs", label: "État capteurs" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-orange-200 shadow-md">
                <TreePine className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Argan-Fire Watch
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  {MOCK_COOP.nom_cooperative}
                </p>
              </div>
            </div>
            
            <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Today</p>
                <p className="text-sm font-medium text-slate-600">
                  {now.toLocaleDateString("fr-MA", { weekday: "short", day: "numeric", month: "long" })}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                {MOCK_STATS.alertes_actives > 0 ? (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-bold">{MOCK_STATS.alertes_actives} alerte(s) active(s)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Aucune alerte</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600 bg-orange-50/50 rounded-t-lg"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Infos coopérative */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-4 gap-6 hover:shadow-md transition-shadow">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Responsable</p>
            <p className="text-slate-800 font-bold">{MOCK_COOP.responsable}</p>
            <p className="text-xs font-semibold text-orange-600 mt-1">{MOCK_COOP.telephone}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Localisation</p>
            <p className="text-slate-800 font-bold">{MOCK_COOP.adresse}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Superficie</p>
            <p className="text-slate-800 font-bold">{MOCK_COOP.superficie_ha.toLocaleString()} ha</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Création</p>
            <p className="text-slate-800 font-bold">{new Date(MOCK_COOP.date_creation).getFullYear()}</p>
          </div>
        </div>

        {/* ONGLET APERCU */}
        {activeTab === "apercu" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard label="Zones surveillées" value={MOCK_STATS.zones_total} sub="réseau actif" accent="#10b981" />
              <StatCard label="Capteurs" value={MOCK_STATS.capteurs_actifs} sub={`${MOCK_STATS.capteurs_en_panne} inactifs`} accent="#3b82f6" />
              <StatCard label="Alertes" value={MOCK_STATS.alertes_actives} sub="actuellement" accent={MOCK_STATS.alertes_actives > 0 ? "#ef4444" : "#10b981"} />
              <StatCard label="Historique (7j)" value={MOCK_STATS.alertes_semaine} sub="alertes passées" accent="#f59e0b" />
              <StatCard label="T° Max" value={`${MOCK_STATS.temperature_max}°C`} sub="point culminant" accent="#f97316" />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Évolution Température */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-800">Évolution de la Température</h3>
                  <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">Dernières 24h</span>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="temp" name="Température (°C)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Autonomie Capteurs */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-slate-800">Niveaux de Batterie (Réseau)</h3>
                  <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">Moyenne / Zone</span>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_BATTERY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="batterie" name="Batterie (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Contenu principal Aperçu */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-500" />
                    Alertes récentes
                  </h3>
                  <button className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
                    Voir tout <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                  {MOCK_ALERTES.map(a => <AlerteRow key={a.id_alerte} alerte={a} />)}
                </div>
              </div>

              {/* Résumé zones */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">État des zones</h3>
                </div>
                <div className="divide-y divide-slate-50 flex-1 overflow-y-auto bg-slate-50/50">
                  {MOCK_ZONES.map(z => <ZoneRow key={z.id_zone} zone={z} />)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET ZONES */}
        {activeTab === "zones" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Zones forestières détaillées
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["ID", "Nom de zone", "Superficie (ha)", "Capteurs", "Niveau de risque"].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_ZONES.map(z => {
                    const r = risqueConfig[z.niveau_risque_base] || {};
                    return (
                      <tr key={z.id_zone} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono text-sm">#{z.id_zone}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{z.nom_zone}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{z.superficie_ha} ha</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 w-8 h-8 rounded-full font-bold text-sm">
                            {z.capteurs}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                            style={{ background: r.bg, color: r.color }}
                          >
                            {z.niveau_risque_base.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET CAPTEURS */}
        {activeTab === "capteurs" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total capteurs" value={MOCK_STATS.capteurs_actifs + MOCK_STATS.capteurs_en_panne} sub="réseau distant" accent="#64748b" />
              <StatCard label="Opérationnels" value={MOCK_STATS.capteurs_actifs} accent="#10b981" />
              <StatCard label="Hors service" value={MOCK_STATS.capteurs_en_panne} accent="#ef4444" />
              <StatCard label="Disponibilité"
                value={`${Math.round((MOCK_STATS.capteurs_actifs / (MOCK_STATS.capteurs_actifs + MOCK_STATS.capteurs_en_panne)) * 100)}%`}
                accent="#3b82f6" />
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Cpu className="w-5 h-5 text-blue-500" />
                Densité par zone
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {MOCK_ZONES.map(z => {
                  const pct = Math.round((z.capteurs / MOCK_STATS.capteurs_actifs) * 100);
                  return (
                    <div key={z.id_zone} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-slate-700">{z.nom_zone}</span>
                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{z.capteurs} capteur(s)</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out group-hover:scale-y-110" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
