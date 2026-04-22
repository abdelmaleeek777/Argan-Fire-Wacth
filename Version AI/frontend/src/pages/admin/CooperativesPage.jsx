import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Building2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Inbox,
  Eye,
  User,
  Mail,
  Phone,
  Calendar,
  Layers,
  Trees,
  X,
} from "lucide-react";
import CooperativeDetailsModal from "../../components/admin/CooperativeDetailsModal";

const CooperativesPage = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    coop: null,
    zones: [],
    loading: false,
  });

  useEffect(() => {
    fetchCooperatives();
  }, []);

  const fetchCooperatives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/cooperatives", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCooperatives(res.data);
    } catch (err) {
      console.error("Error fetching cooperatives", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoopDetails = async (coopId) => {
    setDetailsModal({ open: true, coop: null, zones: [], loading: true });
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/admin/cooperatives/${coopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailsModal({
        open: true,
        coop: res.data.cooperative,
        zones: res.data.zones || [],
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching coop details", err);
      setDetailsModal({ open: false, coop: null, zones: [], loading: false });
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({ open: false, coop: null, zones: [], loading: false });
  };

  const filteredCooperatives = cooperatives.filter((coop) => {
    const matchesSearch =
      coop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coop.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || coop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cooperatives.length,
    approved: cooperatives.filter((c) => c.status === "approved").length,
    pending: cooperatives.filter((c) => c.status === "pending").length,
  };

  return (
    <div className="space-y-[32px] pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#F8F7F2] p-[32px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)]">
        <div>
          <h1 className="text-[24px] font-[700] text-[#1F2A22] tracking-tight">
            All Cooperatives
          </h1>
          <p className="text-[#6B7468] text-[14px] mt-1 font-medium">
            Manage and monitor all registered argan cooperatives.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#DCE3D6]/50 border border-[#4F5C4A]/[0.10] rounded-[14px] p-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-1.5 text-[12px] font-[800] uppercase tracking-widest rounded-[10px] transition-all duration-200 whitespace-nowrap ${statusFilter === "all" ? "bg-[#F8F7F2] text-[#1F2A22] shadow-sm" : "text-[#6B7468] hover:text-[#1F2A22]"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-1.5 text-[12px] font-[800] uppercase tracking-widest rounded-[10px] transition-all duration-200 whitespace-nowrap ${statusFilter === "approved" ? "bg-[#4E6B4A] text-white shadow-sm" : "text-[#6B7468] hover:text-[#4E6B4A]"}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-1.5 text-[12px] font-[800] uppercase tracking-widest rounded-[10px] transition-all duration-200 whitespace-nowrap ${statusFilter === "pending" ? "bg-[#B88A44] text-white shadow-sm" : "text-[#6B7468] hover:text-[#B88A44]"}`}
            >
              Pending
            </button>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7468] w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#DCE3D6]/50 border border-[#4F5C4A]/[0.10] rounded-[14px] focus:outline-none focus:ring-1 focus:ring-[#4E6B4A] transition-all text-[13px] font-[700] text-[#1F2A22] placeholder:text-[#6B7468]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          <div className="bg-[#F8F7F2] p-6 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-[800] text-[#6B7468] uppercase tracking-widest mb-1">
                Total
              </p>
              <p className="text-[28px] font-[800] text-[#1F2A22] leading-tight">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#DCE3D6] rounded-[14px] flex items-center justify-center text-[#4E6B4A]">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-[#F8F7F2] p-6 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-[800] text-[#4E6B4A] uppercase tracking-widest mb-1">
                Approved
              </p>
              <p className="text-[28px] font-[800] text-[#4E6B4A] leading-tight">
                {stats.approved}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#4E6B4A]/12 rounded-[14px] flex items-center justify-center text-[#4E6B4A] shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-[#F8F7F2] p-6 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-[800] text-[#B88A44] uppercase tracking-widest mb-1">
                Pending
              </p>
              <p className="text-[28px] font-[800] text-[#B88A44] leading-tight">
                {stats.pending}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#B88A44]/12 rounded-[14px] flex items-center justify-center text-[#B88A44] shadow-sm">
              <Inbox className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#F8F7F2] rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 text-[#4E6B4A] animate-spin" />
            <p className="text-[#6B7468] font-[700]">Loading cooperatives...</p>
          </div>
        ) : filteredCooperatives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#DCE3D6]/40 border-b border-[#4F5C4A]/[0.10] text-[#6B7468] text-[11px] uppercase tracking-widest font-[800]">
                  <th className="px-6 py-[18px]">Cooperatives</th>
                  <th className="px-6 py-[18px]">Region</th>
                  <th className="px-6 py-[18px]">Status</th>
                  <th className="px-6 py-[18px] text-center">Sensors</th>
                  <th className="px-6 py-[18px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4F5C4A]/[0.05]">
                {filteredCooperatives.map((coop) => (
                  <tr
                    key={coop._id}
                    className="hover:bg-[#DCE3D6]/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-[40px] h-[40px] rounded-[12px] bg-[#CBD8C8] flex items-center justify-center text-[#2F4A36] font-[800] text-[16px] shrink-0 border border-[#4F5C4A]/[0.10]">
                          {coop.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-[700] text-[14px] text-[#1F2A22]">
                            {coop.name}
                          </p>
                          <p className="text-[11px] text-[#6B7468] font-bold">
                            Registered ·{" "}
                            {new Date(coop.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#6B7468]">
                        <MapPin className="w-3.5 h-3.5 text-[#B88A44]" />
                        <span className="text-[13px] font-bold">
                          {coop.region}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[10px] font-[800] uppercase tracking-widest border ${
                          coop.status === "approved"
                            ? "bg-[#4E6B4A]/12 text-[#4E6B4A] border-[#4E6B4A]/20"
                            : coop.status === "pending"
                              ? "bg-[#B88A44]/12 text-[#B88A44] border-[#B88A44]/20"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {coop.status ? coop.status : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-[700] text-[#1F2A22] text-[13px]">
                        {coop.sensorCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => fetchCoopDetails(coop._id)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-[800] uppercase tracking-wider text-[#4E6B4A] hover:text-[#2F4A36] transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 space-y-5">
            <div className="w-20 h-20 bg-[#DCE3D6] rounded-full flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Building2 className="w-8 h-8 text-[#6B7468]" />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-lg font-[800] text-[#1F2A22]">
                No cooperatives found
              </h3>
              <p className="text-[#6B7468] mt-2 text-[14px] leading-relaxed font-medium">
                {statusFilter === "all"
                  ? "We couldn't find any cooperatives matching your search criteria. Please adjust your filters."
                  : `There are currently no ${statusFilter} cooperatives matching your search.`}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-6 px-5 py-2.5 bg-[#F8F7F2] border border-[#4F5C4A]/[0.20] text-[#1F2A22] text-[13px] font-[800] rounded-[12px] hover:bg-[#DCE3D6] transition-all shadow-sm active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <CooperativeDetailsModal 
        isOpen={detailsModal.open}
        onClose={closeDetailsModal}
        detailsModal={detailsModal}
      />
    </div>
  );
};

export default CooperativesPage;
