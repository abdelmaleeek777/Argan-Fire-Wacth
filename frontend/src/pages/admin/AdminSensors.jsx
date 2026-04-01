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
  Plus,
} from "lucide-react";

/**
 * Admin Sensors Management Page (IoT)
 */
function AdminSensors() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Custom Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: null, // "view", "restart", "add"
    sensor: null,
  });

useEffect(() => {
  const loadSensors = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/sensors");
      const data = await response.json();

      setSensors(data);
    } catch (error) {
      console.error("Error loading sensors:", error);
    }

    setLoading(false);
  };

  loadSensors();
}, []);

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

  const handleConfirmAction = async () => {
    if (modal.type === "restart" && modal.sensor) {
      // Simulate restarting the sensor (changing status temporarily to indicate action)
      setSensors(
        sensors.map((s) =>
          s.id === modal.sensor.id
            ? {
                ...s,
                status: "active",
                connectivity: "excellent",
                battery: 100,
                lastPing: "Just now",
              }
            : s,
        ),
      );
    } else if (modal.type === "add" && modal.sensor) {
  try {
    const response = await fetch("/api/sensors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modal.sensor),
    });

    const data = await response.json();

    setSensors([...sensors, data]); // ajouter depuis backend
  } catch (error) {
    console.error("Error adding sensor:", error);
  }
}
    closeModal();
  };

  const openModal = (type, sensor = null) => {
    setModal({ isOpen: true, type, sensor });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, sensor: null });
  };

const filteredSensors = sensors.filter((s) => {
  const matchesSearch =
    String(s.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesStatus = statusFilter === "all" || s.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-none pb-0 mb-0 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600" />
            IoT Sensors
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Monitor status, battery, and connectivity of deployed sensors.
          </p>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par ID ou localisation..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 text-sm font-medium flex-1 md:flex-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">
              Chargement des données capteurs...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Sensor</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Battery & Network</th>
                  <th className="px-6 py-4 font-bold">Current Readings</th>
                  <th className="px-6 py-4 font-bold">Last Ping</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSensors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Aucun capteur ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredSensors.map((sensor) => (
                    <tr
                      key={sensor.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 ${sensor.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              sensor.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                            }`}>
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 font-mono text-sm">
                              {sensor.id}
                            </div>
                            <div className="text-sm text-slate-500">
                              {sensor.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(sensor.status)}`}
                        >
                          {sensor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            {getBatteryIcon(sensor.battery)}
                            {sensor.battery}%
                            {sensor.battery < 20 && (
                              <AlertTriangle className="w-3 h-3 text-rose-500 ml-1" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 capitalize">
                            {getConnectivityIcon(sensor.connectivity)}
                            {sensor.connectivity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sensor.status === "offline" ? (
                          <span className="text-slate-400 text-sm italic">
                            Data unavailable
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                              <Thermometer className="w-4 h-4 text-orange-500" />
                              {sensor.temperature}°C
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Activity className="w-4 h-4 text-blue-500" />
                              {sensor.humidity}% Humidity
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {sensor.lastPing}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

                          {/* Viewer Info Action */}
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                            title="Détails du capteur"
                            onClick={() => openModal("view", sensor)}
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {/* Restart/Reset Action */}
                          <button
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors tooltip"
                            title="Redémarrer le capteur"
                            onClick={() => openModal("restart", sensor)}
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Custom Modal UI --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {modal.type === "view" && <span className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-500" /> Sensor details</span>}
                {modal.type === "restart" && <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-amber-500" /> Restart Sensor</span>}
                {modal.type === "add" && <span className="flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-500" />New sensor</span>}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 bg-slate-100 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modal.type === "view" && modal.sensor && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border-4 border-white shadow-md">
                      <Cpu className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 font-mono">
                        {modal.sensor.id}
                      </h4>
                      <p className="text-slate-500 text-sm">
                        {modal.sensor.location}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">GPS Coordinates</span>
                      <span className="font-mono text-sm text-slate-800">
                        {modal.sensor.coordinates}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Battery Level</span>
                      <span className="font-bold flex items-center gap-1">
                        {getBatteryIcon(modal.sensor.battery)}{" "}
                        {modal.sensor.battery}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Last Ping</span>
                      <span className="font-bold text-slate-800">
                        {modal.sensor.lastPing}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {modal.type === "restart" && modal.sensor && (
                <div className="text-center">
                  <p className="text-slate-600 mb-2">
                    Are you sure you want to send a remote restart signal to
                    sensor:
                  </p>
                  <p className="text-lg font-bold text-slate-900 font-mono mb-4">{modal.sensor.id}</p>

                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 mt-6 text-left flex gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    The sensor will be temporarily offline (30-60 seconds)
                    during the hardware reboot.
                  </div>
                </div>
              )}

              {modal.type === "add" && (
  <div className="space-y-4">
    {/* Serial Number */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Serial Number
      </label>
      <input
        type="text"
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
        placeholder="e.g. SN-ARG-999"
        value={modal.sensor.id || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, id: e.target.value } })
        }
      />
    </div>

    {/* Sensor Type — SELECT */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Sensor Type
      </label>
      <select
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
        value={modal.sensor.type || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, type: e.target.value } })
        }
      >
        <option value="">-- Select a type --</option>
        <option value="temperature">Temperature</option>
        <option value="multi">Multi-parameter</option>
        <option value="wind">Wind</option>
        <option value="humidity">Humidity</option>
      </select>
    </div>

    {/* Model */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Model
      </label>
      <input
        type="text"
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
        placeholder="e.g. SensorPro X200"
        value={modal.sensor.model || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, model: e.target.value } })
        }
      />
    </div>

    {/* Latitude & Longitude side by side */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Latitude
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
          placeholder="e.g. 30.123"
          value={modal.sensor.latitude || ""}
          onChange={(e) =>
            setModal({ ...modal, sensor: { ...modal.sensor, latitude: e.target.value } })
          }
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">
          Longitude
        </label>
        <input
          type="text"
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
          placeholder="e.g. -9.456"
          value={modal.sensor.longitude || ""}
          onChange={(e) =>
            setModal({ ...modal, sensor: { ...modal.sensor, longitude: e.target.value } })
          }
        />
      </div>
    </div>

    {/* Altitude */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Altitude (m)
      </label>
      <input
        type="text"
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
        placeholder="e.g. 150"
        value={modal.sensor.altitude || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, altitude: e.target.value } })
        }
      />
    </div>

    {/* Status — SELECT */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Status
      </label>
      <select
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
        value={modal.sensor.status || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, status: e.target.value } })
        }
      >
        <option value="">-- Select a status --</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="maintenance">Under Maintenance</option>
      </select>
    </div>

    {/* Cooperative */}
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-1">
        Cooperative
      </label>
      <input
        type="text"
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
        placeholder="e.g. Cooperative Name"
        value={modal.sensor.cooperative || ""}
        onChange={(e) =>
          setModal({ ...modal, sensor: { ...modal.sensor, cooperative: e.target.value } })
        }
      />
    </div>
  </div>
)}
</div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
{modal.type === "add" && (
  <>
    <button
      onClick={closeModal}
      className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
    >
      Cancel
    </button>

    <button
      onClick={handleConfirmAction}
      className="px-6 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
    >
      Add Sensor
    </button>
  </>
)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSensors;
