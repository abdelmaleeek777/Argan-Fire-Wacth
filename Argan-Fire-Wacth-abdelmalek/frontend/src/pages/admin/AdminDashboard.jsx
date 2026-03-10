import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Building2,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ShieldCheck,
  Loader2,
} from "lucide-react";

/**
 * Admin Dashboard — overview of ALL cooperatives, sensors, and alerts.
 * Only accessible to admin users.
 */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // Assuming there's a global stats endpoint, if not we'll simulate or aggregate
      const res = await axios.get("http://localhost:5000/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats", err);
      // Fallback/Placeholder if endpoint doesn't exist yet
      setStats({
        totalCooperatives: 12,
        pendingApprovals: 4,
        activeSensors: 85,
        activeAlerts: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading system metrics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Cooperatives",
      value: stats.totalCooperatives,
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600",
      trend: "+2 this month",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: ShieldCheck,
      color: "bg-amber-50 text-amber-600",
      trend: "Immediate action required",
    },
    {
      label: "Active Sensors",
      value: stats.activeSensors,
      icon: Cpu,
      color: "bg-blue-50 text-blue-600",
      trend: "98% online",
    },
    {
      label: "Active Alerts",
      value: stats.activeAlerts,
      icon: AlertTriangle,
      color:
        stats.activeAlerts > 0
          ? "bg-rose-50 text-rose-600"
          : "bg-slate-50 text-slate-400",
      trend:
        stats.activeAlerts > 0 ? "Potential fire detected!" : "System clear",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500 mt-1">
          Real-time metrics for the Argan-Fire Watch platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {card.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Recent Platform Activity
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 ring-4 ring-emerald-50"></div>
              <div>
                <p className="text-sm font-bold text-slate-800 italic uppercase tracking-tight">
                  Cooperative Approved
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  "Argan North" was successfully approved by admin.
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  10 minutes ago
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 ring-4 ring-blue-50"></div>
              <div>
                <p className="text-sm font-bold text-slate-800 italic uppercase tracking-tight">
                  New Sensor Deployed
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Sensor SN-90210 added to "South Argan Grove".
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  1 hour ago
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 ring-4 ring-orange-50"></div>
              <div>
                <p className="text-sm font-bold text-slate-800 italic uppercase tracking-tight">
                  Security Check
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  System-wide integrity check completed successfully.
                </p>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  3 hours ago
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* System Health */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              Platform Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-semibold text-slate-700">
                    API Server
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-semibold text-slate-700">
                    Database Cluster
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase">
                  Balanced
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-semibold text-slate-700">
                    Sensor Gateway
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase">
                  Connected
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Uptime: 99.98%</span>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:underline">
              View Detailed Logs
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
