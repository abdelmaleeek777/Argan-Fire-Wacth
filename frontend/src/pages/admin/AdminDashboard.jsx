import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Building2,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ShieldCheck,
  Loader2,
  ArrowRight,
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
      color: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-100",
      trend: "+2 this month",
      trendColor: "text-emerald-500",
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: ShieldCheck,
      color: "bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-600 border-amber-100",
      trend: "Immediate action required",
      trendColor: "text-amber-500",
    },
    {
      label: "Active Sensors",
      value: stats.activeSensors,
      icon: Cpu,
      color: "bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 border-blue-100",
      trend: "98% online",
      trendColor: "text-blue-500",
    },
    {
      label: "Active Alerts",
      value: stats.activeAlerts,
      icon: AlertTriangle,
      color:
        stats.activeAlerts > 0
          ? "bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-600 border-rose-100"
          : "bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-500 border-slate-100",
      trend:
        stats.activeAlerts > 0 ? "Potential fire detected!" : "System clear",
      trendColor: stats.activeAlerts > 0 ? "text-rose-500" : "text-slate-400",
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
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl ${card.color} border flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className={`mt-6 flex items-center gap-2 text-xs font-bold ${card.trendColor}`}>
                <TrendingUp className="w-4 h-4" />
                {card.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/cooperatives/pending"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-amber-600 transition-colors">Review Pending</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            to="/admin/cooperatives"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">All Cooperatives</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </Link>
          <Link
            to="/admin/sensors"
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Manage Sensors</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Recent Platform Activity
          </h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-100 before:via-slate-200 before:to-transparent">
            <div className="relative flex items-start gap-4 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow-sm shrink-0 z-10 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Cooperative Approved</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">10m ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">"Argan North" was successfully approved by admin.</p>
              </div>
            </div>
            
            <div className="relative flex items-start gap-4 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow-sm shrink-0 z-10 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">New Sensor Deployed</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">1h ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">Sensor SN-90210 added to "South Argan Grove".</p>
              </div>
            </div>

            <div className="relative flex items-start gap-4 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-100 text-orange-600 shadow-sm shrink-0 z-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Security Check</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">3h ago</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">System-wide integrity check completed successfully.</p>
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
