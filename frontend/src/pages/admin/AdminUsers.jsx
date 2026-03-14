import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Mail,
  Loader2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  X,
  AlertTriangle,
  Plus,
} from "lucide-react";

const API_BASE = "http://localhost:5000/admin";

/**
 * Admin Users Management Page
 */
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State for our custom Modal
  const [modal, setModal] = useState({
    isOpen: false,
    type: null, // "view", "block", "unblock", "delete"
    user: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "blocked":
        return "bg-rose-100 text-rose-700 border border-rose-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const handleConfirmAction = async () => {
    if (!modal.user) return;
    setActionLoading(true);

    try {
      if (modal.type === "block" || modal.type === "unblock") {
        await axios.patch(`${API_BASE}/users/${modal.user.id}/toggle-block`);
      } else if (modal.type === "delete") {
        await axios.delete(`${API_BASE}/users/${modal.user.id}`);
      }
      // Refresh users list after action
      await fetchUsers();
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const openModal = (type, user) => {
    setModal({ isOpen: true, type, user });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, user: null });
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-none pb-0 mb-0 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Cooperative Owners
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage user accounts for cooperative owners: view info, block, or
            delete.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
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
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading owners data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Owner Information</th>
                  <th className="px-6 py-4 font-bold">Cooperative</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Joined At</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No owners found matching your search and filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm shrink-0">
                            {(user.name || "?").charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {user.name}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {user.cooperative || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(
                            user.status,
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(user.joinedAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* View Info */}
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                            onClick={() => openModal("view", user)}
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {/* Block/Unblock */}
                          {user.status === "blocked" ? (
                            <button
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Unblock account"
                              onClick={() => openModal("unblock", user)}
                            >
                              <Unlock className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Block account"
                              onClick={() => openModal("block", user)}
                            >
                              <Lock className="w-5 h-5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete account"
                            onClick={() => openModal("delete", user)}
                          >
                            <Trash2 className="w-5 h-5" />
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
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {modal.type === "view" && (
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" /> Account Details
                  </span>
                )}
                {modal.type === "block" && (
                  <span className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" /> Block Account
                  </span>
                )}
                {modal.type === "unblock" && (
                  <span className="flex items-center gap-2">
                    <Unlock className="w-5 h-5 text-emerald-500" /> Unblock
                    Account
                  </span>
                )}
                {modal.type === "delete" && (
                  <span className="flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="w-5 h-5" /> Confirm Deletion
                  </span>
                )}
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
              {modal.type === "view" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl border-4 border-white shadow-md">
                      {(modal.user.name || "?").charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        {modal.user.name}
                      </h4>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {modal.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooperative</span>
                      <span className="font-bold text-slate-800">
                        {modal.user.cooperative || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Joined At</span>
                      <span className="font-bold text-slate-800">
                        {formatDate(modal.user.joinedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Current Status</span>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${getStatusBadge(modal.user.status)}`}
                      >
                        {modal.user.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-600 mb-2">
                    {modal.type === "delete"
                      ? "Are you sure you want to permanently delete the account of"
                      : `Are you sure you want to ${modal.type === "block" ? "block" : "unblock"} the account of`}
                  </p>
                  <p className="text-lg font-bold text-slate-900 mb-4">
                    {modal.user.name} ({modal.user.email})
                  </p>

                  {modal.type === "delete" && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 mt-6 text-left flex gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      Warning: This action is irreversible. All data associated
                      with this user will be removed.
                    </div>
                  )}
                  {modal.type === "block" && (
                    <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 mt-6 text-left flex gap-3">
                      <Lock className="w-5 h-5 flex-shrink-0" />
                      The user will no longer be able to log in or receive
                      alerts until unblocked.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              {modal.type === "view" ? (
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-lg"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={actionLoading}
                    className={`px-6 py-2.5 font-bold text-white rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                      modal.type === "delete"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                        : modal.type === "block"
                          ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                          : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    }`}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {modal.type === "delete" && <Trash2 className="w-4 h-4" />}
                        {modal.type === "block" && <Lock className="w-4 h-4" />}
                        {modal.type === "unblock" && <Unlock className="w-4 h-4" />}
                      </>
                    )}
                    Confirm
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

export default AdminUsers;
