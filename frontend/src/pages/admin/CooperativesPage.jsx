import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Building2, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const CooperativesPage = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredCooperatives = cooperatives.filter(
    (coop) =>
      coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.region.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or region..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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
                          coop.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : coop.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {coop.status.charAt(0) + coop.status.slice(1)}
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
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-semibold">
                No cooperatives found
              </p>
              <p className="text-slate-500">
                We couldn't find any cooperatives matching your search.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CooperativesPage;
