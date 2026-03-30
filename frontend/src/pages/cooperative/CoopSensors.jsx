import React, { useState, useEffect } from "react";
import {
  Cpu,
  Search,
  Activity,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Thermometer,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import axios from "axios";

export default function CoopSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    sensor: null,
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const coopId = user.cooperative_id;

  useEffect(() => {
    const loadSensors = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/cooperative/${coopId}/sensors`
        );
        setSensors(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error loading sensors:", error);
      }
      setLoading(false);
    };

    if (coopId) {
      loadSensors();
    }
  }, [coopId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "offline":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const getBatteryIcon = (level) => {
    if (level > 80) return <Battery className="w-4 h-4 text-emerald-500" />;
    if (level > 20)
      return <BatteryCharging className="w-4 h-4 text-amber-500" />;
    return <Battery className="w-4 h-4 text-rose-500" />;
  };

  const getConnectivityIcon = (conn) => {
    switch (conn) {
      case "excellent":
      case "good":
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      case "weak":
        return <Wifi className="w-4 h-4 text-amber-500" />;
      case "offline":
        return <WifiOff className="w-4 h-4 text-rose-500" />;
      default:
        return <Wifi className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredSensors = sensors.filter((sensor) => {
    const matchesSearch =
      sensor.reference_serie?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sensor.type_capteur?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sensor.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Capteurs</h1>
          <p className="text-slate-600 mt-1">
            Gérez et surveillez vos capteurs IoT
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="INACTIF">Inactif</option>
          <option value="HORS_LIGNE">Hors ligne</option>
        </select>
      </div>

      {/* Sensors Grid */}
      {filteredSensors.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Aucun capteur trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredSensors.map((sensor) => (
            <div
              key={sensor.id_capteur}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Sensor Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {sensor.reference_serie}
                    </h3>
                    <p className="text-xs text-slate-500">{sensor.type_capteur}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                    sensor.statut?.toLowerCase()
                  )}`}
                >
                  {sensor.statut}
                </span>
              </div>

              {/* Sensor Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-emerald-500" />
                    <span>Température</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {sensor.latest_reading?.temperature_c
                      ? sensor.latest_reading.temperature_c.toFixed(1)
                      : "N/A"}
                    °C
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" />
                    <span>Humidité</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {sensor.latest_reading?.humidite_pct
                      ? sensor.latest_reading.humidite_pct.toFixed(1)
                      : "N/A"}
                    %
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>Dernière lecture</span>
                  <span className="font-semibold text-slate-900">
                    {sensor.latest_reading?.horodatage
                      ? new Date(sensor.latest_reading.horodatage).toLocaleString()
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 text-xs">
                  <span>Coordonnées</span>
                  <span className="font-semibold text-slate-900">
                    {sensor.latitude}, {sensor.longitude}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() =>
                    setModal({ isOpen: true, type: "view", sensor })
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {modal.isOpen && modal.sensor && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {modal.sensor.nom}
              </h2>
              <button
                onClick={() => setModal({ isOpen: false, type: null, sensor: null })}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Référence
                </p>
                <p className="text-sm text-slate-900">
                  {modal.sensor.reference_serie}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Type
                </p>
                <p className="text-sm text-slate-900">{modal.sensor.type_capteur}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Modèle
                </p>
                <p className="text-sm text-slate-900">{modal.sensor.modele}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Statut
                </p>
                <p className="text-sm text-slate-900">{modal.sensor.statut}</p>
              </div>
              {modal.sensor.latest_reading && (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      Température
                    </p>
                    <p className="text-sm text-slate-900">
                      {modal.sensor.latest_reading.temperature_c?.toFixed(1)}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      Humidité
                    </p>
                    <p className="text-sm text-slate-900">
                      {modal.sensor.latest_reading.humidite_pct?.toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Coordonnées
                </p>
                <p className="text-sm text-slate-900">
                  {modal.sensor.latitude}, {modal.sensor.longitude}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
