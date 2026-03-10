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
} from "lucide-react";

const PendingApprovalsPage = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/admin/cooperatives/pending",
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

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/admin/cooperatives/${id}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Remove card from list
      setPending((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(`Error trying to ${action} cooperative`);
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 mt-1">
          Review and approve new cooperative registrations.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">
            Fetching pending requests...
          </p>
        </div>
      ) : pending.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pending.map((coop) => (
            <div
              key={coop._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                    <Inbox className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {coop.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">{coop.region}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  Pending
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">{coop.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm break-all">{coop.ownerEmail}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">
                      Reg: {new Date(coop.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => handleAction(coop._id, "approve")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(coop._id, "reject")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2">
              There are no pending registrations waiting for approval at this
              time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;
