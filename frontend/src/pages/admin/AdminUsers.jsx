import axios from "axios";
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  Users, Search, Mail, Loader2, Trash2,
  Lock, Unlock, Eye, X, AlertTriangle,
} from "lucide-react";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    user: null,
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/admin/users");
        setUsers(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "blocked": return "bg-rose-100 text-rose-700 border border-rose-200";
      default:        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const handleConfirmAction = async () => {
    if (!modal.user) return;

if (modal.type === "block" || modal.type === "unblock") {
  try {
    await axios.patch(
      `http://localhost:5000/admin/users/${modal.user.id}/block`,
      { action: modal.type }  // "block" ou "unblock"
    );

    // Mettre à jour le state local
    setUsers(users.map((u) =>
      u.id === modal.user.id
        ? { ...u, status: modal.type === "block" ? "blocked" : "active" }
        : u
    ));
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
  }
} else if (modal.type === "delete") {
  try {
    await axios.delete(`http://localhost:5000/admin/users/${modal.user.id}`);
    setUsers(users.filter((u) => u.id !== modal.user.id));
  } catch (error) {
    console.error("Error deleting user:", error);
  }
} else if (modal.type === "add") {
      try {
        const response = await axios.post("http://localhost:5000/admin/add", {
          nom:         modal.user.nom,
          prenom:      modal.user.prenom,
          email:       modal.user.email,
          password:    modal.user.password,
          telephone:   modal.user.telephone,
          statut:      modal.user.statut,
          role:        modal.user.role, 
        });
        const newUser = {
          ...response.data,
          name:     `${modal.user.prenom} ${modal.user.nom}`,
          status:   modal.user.statut === "ACTIF" ? "active" : "blocked",
          joinedAt: new Date().toLocaleDateString("en-US", {
            month: "short", day: "2-digit", year: "numeric",
          }),
        };
        setUsers([...users, newUser]);
      } catch (error) {
        console.error("Error adding user:", error);
      }
    }
    closeModal();
  };

  const openModal = (type, user) => setModal({ isOpen: true, type, user });
  const closeModal = () => setModal({ isOpen: false, type: null, user: null });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 relative">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-none pb-0 mb-0 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            All Users
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage user accounts for cooperative owners: view info, block, or delete.
          </p>
        </div>
        <button
          onClick={() => openModal("add", {
            nom: "", prenom: "", email: "", password: "",
            telephone: "", statut: "", role: "",
          })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* ── Filters ── */}
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
        <select
          className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 text-sm font-medium"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* ── Table ── */}
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
                  <th className="px-6 py-4 font-bold">User Information</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Joined At</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No owners found matching your search and filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-2 border-white shadow-sm shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {user.name}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
    user.role === "admin"
      ? "bg-purple-100 text-purple-700 border border-purple-200"
      : user.role === "firefighter"
      ? "bg-orange-100 text-orange-700 border border-orange-200"
      : "bg-blue-100 text-blue-700 border border-blue-200"
  }`}>
    {user.role === "admin"
      ? "Admin"
      : user.role === "firefighter"
      ? "Firefighter"
      : "Cooperative Owner"}
  </span>
</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.joinedAt}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View details" onClick={() => openModal("view", user)}>
                            <Eye className="w-5 h-5" />
                          </button>
                          {user.status === "blocked" ? (
                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Unblock" onClick={() => openModal("unblock", user)}>
                              <Unlock className="w-5 h-5" />
                            </button>
                          ) : (
                            <button className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Block" onClick={() => openModal("block", user)}>
                              <Lock className="w-5 h-5" />
                            </button>
                          )}
                          <button className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete" onClick={() => openModal("delete", user)}>
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

      {/* ── Modal ── */}
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {modal.type === "view"    && <><Eye className="w-5 h-5 text-blue-500" /> Account Details</>}
                {modal.type === "block"   && <><Lock className="w-5 h-5 text-amber-500" /> Suspend Account</>}
                {modal.type === "unblock" && <><Unlock className="w-5 h-5 text-emerald-500" /> Reactivate Account</>}
                {modal.type === "delete"  && <><AlertTriangle className="w-5 h-5 text-rose-600" /> Confirm Deletion</>}
                {modal.type === "add"     && <><Users className="w-5 h-5 text-emerald-500" /> Register New Owner</>}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">

              {/* ── VIEW ── */}
              {modal.type === "view" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl border-4 border-white shadow-md">
                      {modal.user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{modal.user.name}</h4>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {modal.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cooperative</span>
                      <span className="font-bold text-slate-800">{modal.user.cooperative}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-bold text-slate-800">{modal.user.telephone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Joined At</span>
                      <span className="font-bold text-slate-800">{modal.user.joinedAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Status</span>
                      <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${getStatusBadge(modal.user.status)}`}>
                        {modal.user.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADD ── */}
              {modal.type === "add" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
                      <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. Doe"
                        value={modal.user.nom || ""}
                        onChange={(e) => setModal({ ...modal, user: { ...modal.user, nom: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
                      <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                        placeholder="e.g. John"
                        value={modal.user.prenom || ""}
                        onChange={(e) => setModal({ ...modal, user: { ...modal.user, prenom: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                    <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      placeholder="john@example.com"
                      value={modal.user.email || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, email: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                    <input type="password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                      value={modal.user.password || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, password: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. +212 6XX XXX XXX"
                      value={modal.user.telephone || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, telephone: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                    <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      value={modal.user.statut || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, statut: e.target.value } })}
                    >
                      <option value="">-- Select a status --</option>
                      <option value="ACTIF">Active</option>
                      <option value="INACTIF">Inactive</option>
                      <option value="SUSPENDU">Suspended</option>
                    </select>
                  </div>
                  {/* Role */}
<div>
  <label className="block text-sm font-bold text-slate-700 mb-1">
    Role
  </label>
  <select
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
    value={modal.user.role || ""}
    onChange={(e) =>
      setModal({ ...modal, user: { ...modal.user, role: e.target.value } })
    }
  >
    <option value="">-- Select a role --</option>
    <option value="admin">Admin</option>
    <option value="firefighter">Firefighter</option>
  </select>
</div>

                </div>
              )}

              {/* ── BLOCK / UNBLOCK / DELETE ── */}
              {(modal.type === "block" || modal.type === "unblock" || modal.type === "delete") && (
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
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 text-left flex gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      Warning: This action is irreversible. All data associated with this user will be removed.
                    </div>
                  )}
                  {modal.type === "block" && (
                    <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-medium border border-amber-100 text-left flex gap-3">
                      <Lock className="w-5 h-5 flex-shrink-0" />
                      The user will no longer be able to log in or receive alerts until reactivated.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              {modal.type === "view" ? (
                <button onClick={closeModal} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-lg">
                  Close
                </button>
              ) : (
                <>
                  <button onClick={closeModal} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`px-6 py-2.5 font-bold text-white rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                      modal.type === "delete"  ? "bg-rose-600 hover:bg-rose-700" :
                      modal.type === "block"   ? "bg-amber-600 hover:bg-amber-700" :
                                                 "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {modal.type === "delete"  && <Trash2 className="w-4 h-4" />}
                    {modal.type === "block"   && <Lock className="w-4 h-4" />}
                    {modal.type === "unblock" && <Unlock className="w-4 h-4" />}
                    {modal.type === "add"     && <Users className="w-4 h-4" />}
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