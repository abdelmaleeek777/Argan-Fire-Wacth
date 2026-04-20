import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Calendar,
  MapPin,
  Search,
  Loader2,
  Inbox,
  Eye,
  Phone,
  Layers,
  Trees,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import CooperativeDetailsModal from "../../components/admin/CooperativeDetailsModal";

const PendingApprovalsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({ open: false, coop: null, zones: [], loading: false });
  const [actionPopup, setActionPopup] = useState({ open: false, type: "", coopName: "" });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "/api/admin/cooperatives/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPending(res.data);
    } catch (err) {
      console.error("Error fetching pending approvals", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, coopName) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/cooperatives/${id}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Remove card from list
      setPending((prev) => prev.filter((item) => item._id !== id));
      // Show success popup
      setActionPopup({ open: true, type: action, coopName });
      // Auto close popup after 3 seconds
      setTimeout(() => setActionPopup({ open: false, type: "", coopName: "" }), 3000);
    } catch (err) {
      alert(`Error trying to ${action} cooperative`);
      console.error(err);
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

  return (
    <div className="space-y-[32px] pb-10">
      <div className="bg-[#F8F7F2] p-[32px] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)]">
        <h1 className="text-[24px] font-[700] text-[#1F2A22] tracking-tight">Pending Approvals</h1>
        <p className="text-[#6B7468] text-[14px] mt-1 font-medium">
          Review and approve new argan forest cooperative registrations.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 text-[#4E6B4A] animate-spin" />
          <p className="text-[#6B7468] font-[700]">
            Fetching pending requests...
          </p>
        </div>
      ) : pending.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px]">
          {pending.map((coop) => (
            <div
              key={coop._id}
              className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-sm p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B88A44]/10 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              <div className="relative flex items-start justify-between">
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-[#DCE3D6] rounded-[18px] flex items-center justify-center flex-shrink-0 border border-[#4F5C4A]/[0.08] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 z-10">
                    <Inbox className="w-7 h-7 text-[#4E6B4A]" />
                  </div>
                  <div className="z-10">
                    <h3 className="text-[20px] font-[800] text-[#1F2A22] tracking-tight group-hover:text-[#4E6B4A] transition-colors">
                      {coop.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[#6B7468] mt-1 font-bold">
                      <MapPin className="w-4 h-4 text-[#B88A44]" />
                      <span className="text-[13px]">{coop.region}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-[#B88A44]/15 border border-[#B88A44]/20 text-[#B88A44] text-[10px] font-[800] rounded-full uppercase tracking-widest shadow-sm z-10">
                  Pending
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-[#DCE3D6]/30 border border-[#4F5C4A]/[0.05] rounded-[24px] relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#1F2A22]">
                    <User className="w-4 h-4 text-[#6B7468]" />
                    <span className="text-[14px] font-[700]">{coop.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#1F2A22]">
                    <Mail className="w-4 h-4 text-[#6B7468]" />
                    <span className="text-[13px] font-bold break-all">{coop.ownerEmail}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#6B7468]">
                    <Calendar className="w-4 h-4 text-[#B88A44]" />
                    <span className="text-[13px] font-[700]">
                      Reg: {new Date(coop.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 relative z-10">
                <button
                  onClick={() => fetchCoopDetails(coop._id)}
                  className="flex items-center justify-center gap-2 py-3 px-5 bg-[#DCE3D6] hover:bg-[#CBD8C8] text-[#1F2A22] text-[13px] font-[800] rounded-[14px] transition-all shadow-sm active:scale-95"
                >
                  <Eye className="w-5 h-5" />
                  View
                </button>
                <button
                  onClick={() => handleAction(coop._id, "approve", coop.name)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#4E6B4A] hover:bg-[#2F4A36] text-white text-[13px] font-[800] rounded-[14px] transition-all shadow-md shadow-[#4E6B4A]/20 active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(coop._id, "reject", coop.name)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-[13px] font-[800] rounded-[14px] transition-all active:scale-95"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F8F7F2] rounded-[32px] border-2 border-dashed border-[#4F5C4A]/[0.10] p-24 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-[#DCE3D6] rounded-full flex items-center justify-center border border-[#4F5C4A]/[0.10]">
            <CheckCircle2 className="w-10 h-10 text-[#4E6B4A]" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-[20px] font-[800] text-[#1F2A22]">All caught up!</h3>
            <p className="text-[#6B7468] mt-2 font-medium">
              There are no pending registrations waiting for approval at this
              time.
            </p>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <CooperativeDetailsModal 
        isOpen={detailsModal.open}
        onClose={closeDetailsModal}
        detailsModal={detailsModal}
      />

      {/* Action Success Popup */}
      {actionPopup.open && (
        <div className="fixed inset-0 bg-[#1F2A22]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#F8F7F2] rounded-[32px] shadow-[0_20px_50px_rgba(31,42,33,0.15)] p-10 max-w-sm w-full text-center animate-in zoom-in-95 duration-200 border border-[#4F5C4A]/[0.10]">
            {actionPopup.type === "approve" ? (
              <>
                <div className="w-20 h-20 bg-[#4E6B4A]/12 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#4E6B4A]/20">
                  <CheckCircle2 className="w-10 h-10 text-[#4E6B4A]" />
                </div>
                <h3 className="text-[20px] font-[800] text-[#1F2A22] mb-3">Approved Successfully!</h3>
                <p className="text-[#6B7468] font-medium leading-relaxed">
                  <span className="font-[800] text-[#4E6B4A]">{actionPopup.coopName}</span> has been approved and can now access the platform.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
                  <XCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h3 className="text-[20px] font-[800] text-[#1F2A22] mb-3">Rejected Request</h3>
                <p className="text-[#6B7468] font-medium leading-relaxed">
                  <span className="font-[800] text-rose-600">{actionPopup.coopName}</span> registration has been declined.
                </p>
              </>
            )}
            <button
              onClick={() => setActionPopup({ open: false, type: "", coopName: "" })}
              className="mt-8 px-8 py-3 bg-[#DCE3D6] hover:bg-[#CBD8C8] text-[#1F2A22] text-[13px] font-[800] rounded-[14px] transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;
