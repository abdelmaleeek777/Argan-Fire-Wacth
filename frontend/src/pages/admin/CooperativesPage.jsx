import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Building2, ChevronRight, Loader2, ShieldCheck, Inbox } from "lucide-react";
import { Link } from "react-router-dom";

const CooperativesPage = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/admin/cooperatives", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCooperatives(res.data);
    } catch (err) {
      console.error("Error fetching cooperatives", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCooperatives = cooperatives.filter((coop) => {
    const matchesSearch =
      coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || coop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cooperatives.length,
    approved: cooperatives.filter(c => c.status === "approved").length,
    pending: cooperatives.filter(c => c.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            All Cooperatives
          </h1>
          <p className="text-slate-500 mt-1">
            Manage and monitor all registered cooperatives.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "all" ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "approved" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${statusFilter === "pending" ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:text-amber-600 hover:bg-amber-50/50"}`}
            >
              Pending
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-black text-slate-900 mt-1 drop-shadow-sm">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-black text-emerald-900 mt-1 drop-shadow-sm">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-black text-amber-900 mt-1 drop-shadow-sm">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
              <Inbox className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-slate-500 font-medium">
              Loading cooperatives...
            </p>
          </div>
        ) : filteredCooperatives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Cooperatives
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Sensors
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCooperatives.map((coop) => (
                  <tr
                    key={coop._id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
                          {coop.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {coop.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Registered on{" "}
                            {new Date(coop.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{coop.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coop.statut === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : coop.statut === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {coop.statut ? coop.statut.charAt(0).toUpperCase() + coop.statut.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-slate-700">
                        {coop.sensorCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/cooperatives/${coop._id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-all"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 space-y-5 bg-gradient-to-b from-transparent to-slate-50/50">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 border border-slate-100">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-bold text-slate-800">
                No cooperatives found
              </h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                {statusFilter === "all" 
                  ? "We couldn't find any cooperatives matching your search criteria. Please adjust your filters." 
                  : `There are currently no ${statusFilter} cooperatives matching your search.`}
              </p>
              <button 
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                className="mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CooperativesPage;
