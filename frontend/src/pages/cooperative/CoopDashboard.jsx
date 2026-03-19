import { useState, useEffect } from "react";
import axios from "axios";
import {
  TreePine,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  MapPin,
  AlertOctagon,
  ChevronRight,
  BarChart2,
  Loader2,
  WifiOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://localhost:5000/api";
const POLL_INTERVAL = 10000; // 10 seconds

const urgenceConfig = {
  INFO: {
    label: "Info",
    bg: "#FFF3CD",
    color: "#856404",
    border: "#FFD700",
  },
  ATTENTION: {
    label: "Attention",
    bg: "#FFE0C2",
    color: "#8B3A00",
    border: "#FF7700",
  },
  CRITIQUE: {
    label: "Critique",
    bg: "#FFD6D6",
    color: "#7B0000",
    border: "#E53935",
  },
};

const risqueConfig = {
  faible: { color: "#2E7D32", bg: "#E8F5E9" },
  moyen: { color: "#F57C00", bg: "#FFF3E0" },
  élevé: { color: "#C62828", bg: "#FFEBEE" },
  critique: { color: "#6A0080", bg: "#F3E5F5" },
};

const statutConfig = {
  OUVERTE:   { label: "Ouverte",    color: "#C62828", bg: "#FFEBEE" },
  EN_COURS:  { label: "En cours",   color: "#F57C00", bg: "#FFF3E0" },
  RESOLUE:   { label: "Résolue",    color: "#2E7D32", bg: "#E8F5E9" },
  ANNULEE:   { label: "Annulée",    color: "#555",    bg: "#F0F0F0" },
}

function formatDateTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return (
    d.toLocaleDateString("fr-MA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${accent || "#E0E0E0"}`,
        borderRadius: 12,
        padding: "18px 20px",
        minWidth: 140,
        flex: "1 1 140px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#888",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accent || "#1A1A2E",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function AlerteRow({ alerte }) {
  const u = urgenceConfig[alerte.niveau_urgence] || {};
  const s = statutConfig[alerte.statut] || {};
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid #F0F0F0",
        background: alerte.statut === "active" ? "#FFFDF5" : "#fff",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: u.border || "#ccc",
          flexShrink: 0,
          boxShadow: alerte.statut === "active" ? `0 0 0 3px ${u.bg}` : "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "#1A1A2E",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {alerte.zone}
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>
          {formatDateTime(alerte.date_heure_declenchement)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 10px",
            borderRadius: 20,
            background: u.bg,
            color: u.color,
            border: `1px solid ${u.border}`,
            marginBottom: 3,
          }}
        >
          {u.label}
        </div>
        {alerte.temperature_detectee && (
          <div style={{ fontSize: 12, color: "#777" }}>
            {alerte.temperature_detectee}°C
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 10,
          background: s.bg,
          color: s.color,
          flexShrink: 0,
        }}
      >
        {s.label}
      </div>
    </div>
  );
}

function ZoneRow({ zone }) {
  const r = risqueConfig[zone.niveau_risque_base] || {};
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderBottom: "1px solid #F5F5F5",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "#1A1A2E" }}>
          {zone.nom_zone}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>
          {zone.superficie_ha} ha
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 20,
          background: r.bg,
          color: r.color,
        }}
      >
        {zone.niveau_risque_base}
      </div>
    </div>
  );
}

export default function CoopDashboard() {
  const [activeTab, setActiveTab] = useState("apercu");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live data state
  const [cooperative, setCooperative] = useState(null);
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [temperatureHistory, setTemperatureHistory] = useState([]);

  // Get cooperative_id from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const cooperativeId = user.cooperative_id;
  console.log("USER:", user);
console.log("COOP ID:", cooperativeId);

  const fetchDashboard = async () => {
    if (!cooperativeId) {
      setError("No cooperative ID found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/cooperative/${cooperativeId}/dashboard`
      );
      const data = response.data;

      setCooperative(data.cooperative);
      setStats(data.stats);
      setZones(data.zones);
      setSensors(data.sensors);
      setAlerts(data.alerts);
      setTemperatureHistory(data.temperature_history);
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Poll every 10 seconds
    const pollInterval = setInterval(fetchDashboard, POLL_INTERVAL);

    // Clock update every minute
    const clockInterval = setInterval(() => setNow(new Date()), 60000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const tabs = [
    { id: "apercu", label: "Aperçu général" },
    { id: "zones", label: "Zones forestières" },
    { id: "capteurs", label: "État capteurs" },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !cooperative) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <WifiOff className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Connection Error
          </h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboard();
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const capteurs_actifs = stats?.capteurs_actifs || 0;
  const capteurs_en_panne = stats?.capteurs_en_panne || 0;
  const totalCapteurs = capteurs_actifs + capteurs_en_panne;

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
                  {cooperative?.nom_cooperative || "—"}
                </p>
              </div>
            </div>

            <div className="text-left md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                  Today
                </p>
                <p className="text-sm font-medium text-slate-600">
                  {now.toLocaleDateString("fr-MA", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                {(stats?.alertes_actives || 0) > 0 ? (
                  <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-bold">
                      {stats.alertes_actives} alerte(s) active(s)
                    </span>
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
        {/* Cooperative Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-8 grid grid-cols-2 md:grid-cols-4 gap-6 hover:shadow-md transition-shadow">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Responsable
            </p>
            <p className="text-slate-800 font-bold">
              {cooperative?.responsable || "—"}
            </p>
            <p className="text-xs font-semibold text-orange-600 mt-1">
              {cooperative?.telephone || "—"}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Localisation
            </p>
            <p className="text-slate-800 font-bold">
              {cooperative?.siege_social || cooperative?.region || "—"}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Région
            </p>
            <p className="text-slate-800 font-bold">
              {cooperative?.region || "—"}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Création
            </p>
            <p className="text-slate-800 font-bold">
              {cooperative?.date_creation
                ? new Date(cooperative.date_creation).getFullYear()
                : "—"}
            </p>
          </div>
        </div>

        {/* ONGLET APERCU */}
        {activeTab === "apercu" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                label="Zones surveillées"
                value={stats?.zones_total || 0}
                sub="réseau actif"
                accent="#10b981"
              />
              <StatCard
                label="Capteurs"
                value={capteurs_actifs}
                sub={`${capteurs_en_panne} inactifs`}
                accent="#3b82f6"
              />
              <StatCard
                label="Alertes"
                value={stats?.alertes_actives || 0}
                sub="actuellement"
                accent={(stats?.alertes_actives || 0) > 0 ? "#ef4444" : "#10b981"}
              />
              <StatCard
                label="Historique (7j)"
                value={stats?.alertes_semaine || 0}
                sub="alertes passées"
                accent="#f59e0b"
              />
              <StatCard
                label="T° Max"
                value={`${stats?.temperature_max || 0}°C`}
                sub="point culminant"
                accent="#f97316"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Temperature Evolution */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-800">
                    Évolution de la Température
                  </h3>
                  <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                    Dernières 24h
                  </span>
                </div>
                <div className="h-[250px] w-full">
                  {temperatureHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={temperatureHistory}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorTemp"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#f97316"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#f97316"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#94a3b8" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#94a3b8" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          itemStyle={{ color: "#0f172a", fontWeight: "bold" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="temp"
                          name="Température (°C)"
                          stroke="#f97316"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorTemp)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                      No temperature data available for the last 24h
                    </div>
                  )}
                </div>
              </div>

              {/* Sensor Status Summary */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart2 className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-slate-800">
                    Sensor Status Overview
                  </h3>
                  <span className="ml-auto text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full">
                    Real-time
                  </span>
                </div>
                <div className="space-y-4">
                  {sensors.length > 0 ? (
                    sensors.map((s) => (
                      <div
                        key={s.id_capteur}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-800">
                            {s.reference_serie}
                          </p>
                          <p className="text-xs text-slate-500">
                            {s.type_capteur} · {s.modele || "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${
                              s.statut === "ACTIF"
                                ? "bg-emerald-100 text-emerald-700"
                                : s.statut === "EN_MAINTENANCE"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {s.statut}
                          </span>
                          {s.latest_reading && (
                            <p className="text-xs text-slate-500 mt-1">
                              {s.latest_reading.temperature_c}°C
                              {s.latest_reading.humidite_pct !== null &&
                                ` · ${s.latest_reading.humidite_pct}%`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
                      No sensors deployed yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts + Zones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-rose-500" />
                    Alertes récentes
                  </h3>
                  <button className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
                    Voir tout{" "}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((a) => (
                      <AlerteRow key={a.id_alerte} alerte={a} />
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No alerts recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Zones */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">État des zones</h3>
                </div>
                <div className="divide-y divide-slate-50 flex-1 overflow-y-auto bg-slate-50/50">
                  {zones.length > 0 ? (
                    zones.map((z) => (
                      <ZoneRow key={z.id_zone} zone={z} />
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      No zones configured
                    </div>
                  )}
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
                    {[
                      "ID",
                      "Nom de zone",
                      "Superficie (ha)",
                      "Indice risque",
                      "Niveau de risque",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.length > 0 ? (
                    zones.map((z) => {
                      const r = risqueConfig[z.niveau_risque_base] || {};
                      return (
                        <tr
                          key={z.id_zone}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                            #{z.id_zone}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {z.nom_zone}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {z.superficie_ha} ha
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {z.indice_risque}/10
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm"
                              style={{ background: r.bg, color: r.color }}
                            >
                              {z.niveau_risque_base?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        No zones configured
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET CAPTEURS */}
        {activeTab === "capteurs" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total capteurs"
                value={totalCapteurs}
                sub="réseau distant"
                accent="#64748b"
              />
              <StatCard
                label="Opérationnels"
                value={capteurs_actifs}
                accent="#10b981"
              />
              <StatCard
                label="Hors service"
                value={capteurs_en_panne}
                accent="#ef4444"
              />
              <StatCard
                label="Disponibilité"
                value={`${totalCapteurs > 0 ? Math.round((capteurs_actifs / totalCapteurs) * 100) : 0}%`}
                accent="#3b82f6"
              />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Cpu className="w-5 h-5 text-blue-500" />
                Sensors Detail
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {[
                        "Reference",
                        "Type",
                        "Status",
                        "Last Temp",
                        "Last Humidity",
                        "Last Reading",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sensors.length > 0 ? (
                      sensors.map((s) => (
                        <tr
                          key={s.id_capteur}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-sm text-slate-800">
                            {s.reference_serie}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {s.type_capteur}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-xs font-bold px-2 py-1 rounded-full ${
                                s.statut === "ACTIF"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : s.statut === "EN_MAINTENANCE"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {s.statut}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {s.latest_reading
                              ? `${s.latest_reading.temperature_c}°C`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {s.latest_reading?.humidite_pct !== null
                              ? `${s.latest_reading.humidite_pct}%`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {s.latest_reading
                              ? formatDateTime(s.latest_reading.horodatage)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-slate-400"
                        >
                          No sensors deployed yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
