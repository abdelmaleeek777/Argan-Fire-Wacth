import axios from "axios";
import React, { useState, useEffect } from "react";
import { Plus, Users, Search, Mail, Loader2, Trash2, Lock, Unlock, Eye, X, AlertTriangle } from "lucide-react";

function AdminUsers() {
  // Custom styles for select dropdown options
  const customSelectStyles = `
    select.custom-rounded-select {
      border-radius: 12px;
      overflow: hidden;
    }
    select.custom-rounded-select:focus {
      outline: none;
      box-shadow: 0 0 0 2px #4E6B4A33;
    }
    select.custom-rounded-select option {
      border-radius: 8px;
      margin: 4px;
      padding: 8px 12px;
      background: #DCE3D6;
      color: #1F2A22;
      transition: background 0.15s, color 0.15s;
    }
    select.custom-rounded-select option:hover, select.custom-rounded-select option:checked {
      background: #CBD8C8;
      color: #4E6B4A;
    }
  `;
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
        const res = await axios.get("/api/admin/users");
        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        setUsers([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
      case "ACTIF":
        return "bg-[#4E6B4A]/12 text-[#4E6B4A] border border-[#4E6B4A]/20";
      case "blocked":
      case "SUSPENDU":
      case "INACTIF":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      default:
        return "bg-[#DCE3D6] text-[#6B7468] border border-[#4F5C4A]/[0.10]";
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-[#B88A44]/12 text-[#B88A44] border border-[#B88A44]/20";
      case "firefighter":
        return "bg-[#6E7A4E]/12 text-[#6E7A4E] border border-[#6E7A4E]/20";
      default:
        return "bg-[#2F4A36]/10 text-[#2F4A36] border border-[#2F4A36]/20";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin": return "Admin";
      case "firefighter": return "Firefighter";
      default: return "Cooperative Owner";
    }
  };

  const handleConfirmAction = async () => {
    if (!modal.user) return;

    if (modal.type === "block" || modal.type === "unblock") {
      try {
        await axios.patch(
          `/api/admin/users/${modal.user.id}/block`,
          { action: modal.type }
        );
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
        await axios.delete(`/api/admin/users/${modal.user.id}`);
        setUsers(users.filter((u) => u.id !== modal.user.id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    } else if (modal.type === "add") {
      try {
        const response = await axios.post("/api/admin/add", {
          nom: modal.user.nom,
          prenom: modal.user.prenom,
          email: modal.user.email,
          password: modal.user.password,
          telephone: modal.user.telephone,
          statut: modal.user.statut,
          role: modal.user.role, 
        });
        const newUser = {
          ...response.data,
          name: `${modal.user.prenom} ${modal.user.nom}`,
          status: modal.user.statut === "ACTIF" ? "active" : "blocked",
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
    const nameMatch = String(u.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = String(u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;
    
    // API might return 'ACTIF' or 'active' depending on mapping, just normalizing for safety
    const normalizedStatus = u.status === "ACTIF" ? "active" : u.status === "SUSPENDU" || u.status === "INACTIF" ? "blocked" : u.status;
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-[32px] w-full max-w-full pb-10">
      
      {/* Calm & Premium Header Card */}
      <div className="bg-[#F8F7F2] rounded-[32px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] p-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-[56px] h-[56px] rounded-[16px] bg-[#DCE3D6] flex items-center justify-center border border-[#4F5C4A]/[0.10]">
              <Users className="w-7 h-7 text-[#4E6B4A]" />
            </div>
            <div>
              <h1 className="text-[24px] font-[700] text-[#1F2A22] tracking-tight">User Management</h1>
              <p className="text-[14px] text-[#6B7468] mt-1 font-medium">Directory of cooperative owners and system staff</p>
            </div>
          </div>
          <button
            onClick={() => openModal("add", {
              nom: "", prenom: "", email: "", password: "",
              telephone: "", statut: "", role: "",
            })}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4E6B4A] text-white rounded-[14px] hover:bg-[#2F4A36] shadow-sm transition-all text-[13px] font-[800] border border-[#4E6B4A]/20"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#F8F7F2] p-4 rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_4px_12px_rgba(31,42,33,0.02)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7468] w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-[#DCE3D6] border-0 rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#4E6B4A] transition-all text-[13px] font-bold text-[#1F2A22] placeholder:text-[#6B7468] h-[40px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-px h-6 bg-[#4F5C4A]/10 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#6B7468] uppercase font-[800] tracking-widest mb-1">Status Filter</span>
          <div className="flex gap-1 bg-[#DCE3D6] p-1 rounded-[14px] border border-[#4F5C4A]/10 shadow-sm">
            {[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-4 py-2 text-[13px] font-[800] rounded-[10px] transition-all duration-150 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#4E6B4A] ${
                  statusFilter === opt.value
                    ? "bg-white text-[#1F2A22] shadow-md"
                    : "text-[#6B7468] hover:text-[#1F2A22] hover:bg-[#CBD8C8]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Table */}
      <div className="bg-[#F8F7F2] rounded-[24px] border border-[#4F5C4A]/[0.10] shadow-[0_8px_24px_rgba(31,42,33,0.06)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-[64px]">
            <Loader2 className="w-8 h-8 text-[#4E6B4A] animate-spin mb-4" />
            <p className="text-[#6B7468] font-[700]">Loading directory data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#DCE3D6]/40 border-b border-[#4F5C4A]/[0.10] text-[#6B7468] text-[11px] uppercase tracking-widest font-[800]">
                  <th className="px-6 py-[18px]">User Information</th>
                  <th className="px-6 py-[18px]">Role</th>
                  <th className="px-6 py-[18px]">Status</th>
                  <th className="px-6 py-[18px]">Joined At</th>
                  <th className="px-6 py-[18px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4F5C4A]/[0.05]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-[64px] text-center text-[#6B7468] font-bold text-[14px]">
                      No users found matching your specifications.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#DCE3D6]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-[40px] h-[40px] rounded-[12px] bg-[#CBD8C8] flex items-center justify-center text-[#2F4A36] font-[800] text-[16px] shrink-0 border border-[#4F5C4A]/[0.10]">
                            {String(user.name || "U").charAt(0)}
                          </div>
                          <div>
                            <div className="font-[700] text-[14px] text-[#1F2A22] group-hover:text-[#4E6B4A] transition-colors">
                              {user.name}
                            </div>
                            <div className="text-[12px] text-[#6B7468] flex items-center gap-1.5 mt-0.5 font-bold">
                              <Mail className="w-3.5 h-3.5 text-[#B88A44]" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1.5 rounded-[8px] text-[10px] font-[800] uppercase tracking-widest ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1.5 rounded-[8px] text-[10px] font-[800] uppercase tracking-widest ${getStatusBadge(user.status)}`}>
                          {user.status === "ACTIF" ? "active" : user.status === "SUSPENDU" ? "blocked" : user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] font-bold text-[#6B7468]">
                        {user.joinedAt || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-[#6B7468] hover:bg-[#DCE3D6] hover:text-[#1F2A22] rounded-[10px] transition-colors" title="View" onClick={() => openModal("view", user)}>
                            <Eye className="w-[18px] h-[18px]" />
                          </button>
                          {user.status === "blocked" || user.status === "SUSPENDU" ? (
                            <button className="p-2 text-[#6B7468] hover:bg-[#4E6B4A]/10 hover:text-[#4E6B4A] rounded-[10px] transition-colors" title="Unblock" onClick={() => openModal("unblock", user)}>
                              <Unlock className="w-[18px] h-[18px]" />
                            </button>
                          ) : (
                            <button className="p-2 text-[#6B7468] hover:bg-[#B88A44]/10 hover:text-[#B88A44] rounded-[10px] transition-colors" title="Block" onClick={() => openModal("block", user)}>
                              <Lock className="w-[18px] h-[18px]" />
                            </button>
                          )}
                          <button className="p-2 text-[#6B7468] hover:bg-rose-50 hover:text-rose-600 rounded-[10px] transition-colors" title="Delete" onClick={() => openModal("delete", user)}>
                            <Trash2 className="w-[18px] h-[18px]" />
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

      {/* Modal - Extremely Clean Redesign */}
      {modal.isOpen && modal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A22]/30 backdrop-blur-md p-4">
          <div className="bg-[#F8F7F2] rounded-[24px] shadow-[0_20px_50px_rgba(31,42,33,0.1)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[#4F5C4A]/[0.10]">
            {/* Modal Header */}
            <div className="p-[24px] border-b border-[#4F5C4A]/[0.05] bg-[#F8F7F2]">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-[700] text-[#1F2A22] flex items-center gap-2">
                  {modal.type === "view"    && "Account Details"}
                  {modal.type === "block"   && "Suspend Account"}
                  {modal.type === "unblock" && "Reactivate Account"}
                  {modal.type === "delete"  && "Confirm Deletion"}
                  {modal.type === "add"     && "Register New User"}
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-[#DCE3D6] rounded-[10px] transition-colors text-[#6B7468]">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-[24px] max-h-[65vh] overflow-y-auto">
              {/* ── VIEW ── */}
              {modal.type === "view" && (
                <div className="space-y-[16px]">
                  <div className="flex items-center gap-4 p-4 bg-[#DCE3D6] rounded-[16px] border border-[#4F5C4A]/[0.05]">
                    <div className="w-[56px] h-[56px] rounded-[14px] bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] flex items-center justify-center text-[#1F2A22] font-[800] text-[20px] shadow-sm shrink-0">
                      {String(modal.user.name || "U").charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[16px] font-[800] text-[#1F2A22] leading-tight">{modal.user.name}</h4>
                      <p className="text-[#6B7468] text-[13px] flex items-center gap-1.5 mt-1 font-bold">
                        <Mail className="w-3.5 h-3.5 text-[#B88A44]" /> {modal.user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                    <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-4 rounded-[16px]">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-1 text-bold">Status</p>
                      <p className="font-[700] text-[14px] text-[#1F2A22]">{modal.user.status}</p>
                    </div>
                    <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-4 rounded-[16px]">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-1 text-bold">Role</p>
                      <p className="font-[700] text-[14px] text-[#4E6B4A]">{getRoleLabel(modal.user.role)}</p>
                    </div>
                    <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-4 rounded-[16px] col-span-1 sm:col-span-2">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-1 text-bold">Phone Number</p>
                      <p className="font-[700] text-[14px] text-[#1F2A22]">{modal.user.telephone || "—"}</p>
                    </div>
                    <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-4 rounded-[16px] col-span-1 sm:col-span-2">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-1 text-bold">Cooperative</p>
                      <p className="font-[700] text-[14px] text-[#1F2A22] mt-1">{modal.user.cooperative || "—"}</p>
                    </div>
                    <div className="bg-[#F8F7F2] border border-[#4F5C4A]/[0.10] p-4 rounded-[16px] col-span-1 sm:col-span-2">
                      <p className="text-[10px] uppercase font-[800] tracking-widest text-[#6B7468] mb-1 text-bold">Date Joined</p>
                      <p className="font-[700] text-[14px] text-[#1F2A22] mt-1">{modal.user.joinedAt || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ADD ── */}
              {modal.type === "add" && (
                <div className="space-y-[16px]">
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div>
                      <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Last Name</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#DCE3D6] border-0 rounded-[12px] focus:ring-1 focus:ring-[#4E6B4A] focus:outline-none text-[13px] text-[#1F2A22] font-bold"
                        placeholder="e.g. Doe"
                        value={modal.user.nom || ""}
                        onChange={(e) => setModal({ ...modal, user: { ...modal.user, nom: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">First Name</label>
                      <input type="text" className="w-full px-4 py-3 bg-[#DCE3D6] border-0 rounded-[12px] focus:ring-1 focus:ring-[#4E6B4A] focus:outline-none text-[13px] text-[#1F2A22] font-bold"
                        placeholder="e.g. John"
                        value={modal.user.prenom || ""}
                        onChange={(e) => setModal({ ...modal, user: { ...modal.user, prenom: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" className="w-full px-4 py-3 bg-[#DCE3D6] border-0 rounded-[12px] focus:ring-1 focus:ring-[#4E6B4A] focus:outline-none text-[13px] text-[#1F2A22] font-bold"
                      placeholder="john@example.com"
                      value={modal.user.email || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, email: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Password</label>
                    <input type="password" className="w-full px-4 py-3 bg-[#DCE3D6] border-0 rounded-[12px] focus:ring-1 focus:ring-[#4E6B4A] focus:outline-none text-[13px] text-[#1F2A22] font-bold"
                      placeholder="••••••••"
                      value={modal.user.password || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, password: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="tel" className="w-full px-4 py-3 bg-[#DCE3D6] border-0 rounded-[12px] focus:ring-1 focus:ring-[#4E6B4A] focus:outline-none text-[13px] text-[#1F2A22] font-bold"
                      placeholder="e.g. +212..."
                      value={modal.user.telephone || ""}
                      onChange={(e) => setModal({ ...modal, user: { ...modal.user, telephone: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-[16px]">
                    <div>
                      <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Status</label>
                      <div className="relative">
                        <select
                          className="custom-rounded-select appearance-none w-full px-4 py-3 bg-[#DCE3D6] border border-[#4F5C4A]/10 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#4E6B4A] text-[13px] text-[#1F2A22] font-bold transition-all duration-150 hover:bg-[#CBD8C8] cursor-pointer pr-10"
                          value={modal.user.statut || ""}
                          onChange={(e) => setModal({ ...modal, user: { ...modal.user, statut: e.target.value } })}
                        >
                          <option value="">-- Select --</option>
                          <option value="ACTIF">Active</option>
                          <option value="INACTIF">Inactive</option>
                          <option value="SUSPENDU">Suspended</option>
                        </select>
                        <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7468]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-[800] text-[#6B7468] uppercase tracking-widest mb-2">Role</label>
                      <div className="relative">
                        <select
                          className="custom-rounded-select appearance-none w-full px-4 py-3 bg-[#DCE3D6] border border-[#4F5C4A]/10 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#4E6B4A] text-[13px] text-[#1F2A22] font-bold transition-all duration-150 hover:bg-[#CBD8C8] cursor-pointer pr-10"
                          value={modal.user.role || ""}
                          onChange={(e) => setModal({ ...modal, user: { ...modal.user, role: e.target.value } })}
                        >
                          <option value="">-- Select --</option>
                          <option value="admin">Admin</option>
                          <option value="firefighter">Firefighter</option>
                          <option value="owner">Cooperative Owner</option>
                        </select>
                        <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7468]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BLOCK / UNBLOCK / DELETE ── */}
              {(modal.type === "block" || modal.type === "unblock" || modal.type === "delete") && (
                <div className="text-center py-2">
                  <div className={`w-[64px] h-[64px] rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 border ${
                    modal.type === "delete" ? "bg-rose-50 text-rose-500 border-rose-100" :
                    modal.type === "block" ? "bg-[#B88A44]/12 text-[#B88A44] border-[#B88A44]/20" :
                    "bg-[#4E6B4A]/12 text-[#4E6B4A] border-[#4E6B4A]/20"
                  }`}>
                    {modal.type === "delete" ? <Trash2 className="w-8 h-8" /> :
                     modal.type === "block" ? <Lock className="w-8 h-8" /> :
                     <Unlock className="w-8 h-8" />}
                  </div>
                  <p className="text-[#6B7468] text-[14px] mb-2 font-bold">
                    {modal.type === "delete"
                      ? "Are you sure you want to permanently delete the account of"
                      : `Are you sure you want to ${modal.type === "block" ? "block" : "unblock"} the account of`}
                  </p>
                  <p className="text-[20px] font-[800] text-[#1F2A22] mb-6 inline-block">
                    {modal.user.name} <span className="font-mono text-[14px] font-[500] text-[#6B7468]">({modal.user.email})</span>
                  </p>
                  
                  {modal.type === "delete" && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-[12px] text-[13px] font-[800] flex gap-3 text-left border border-rose-100">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      Warning: This action is irreversible. All data associated with this user will be removed.
                    </div>
                  )}
                  {modal.type === "block" && (
                    <div className="bg-[#B88A44]/12 text-[#B88A44] p-4 rounded-[12px] text-[13px] font-[800] flex gap-3 text-left border border-[#B88A44]/15">
                      <Lock className="w-5 h-5 shrink-0" />
                      The user will no longer be able to log in or receive alerts until reactivated.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-[24px] bg-[#F8F7F2] border-t border-[#4F5C4A]/[0.05] flex justify-end gap-3 rounded-b-[24px]">
              {modal.type === "view" ? (
                <button onClick={closeModal} className="px-6 py-2.5 bg-[#1F2A22] hover:bg-[#2F4A36] text-white text-[13px] font-[800] rounded-[12px] transition-colors shadow-sm">
                  Close
                </button>
              ) : (
                <>
                  <button onClick={closeModal} className="px-5 py-2.5 font-[800] text-[13px] text-[#6B7468] hover:bg-[#DCE3D6] rounded-[12px] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`px-5 py-2.5 font-[800] text-[13px] text-white rounded-[12px] shadow-sm transition-all flex items-center gap-2 border ${
                      modal.type === "delete"  ? "bg-rose-600 hover:bg-rose-700 border-rose-700 shadow-rose-200" :
                      modal.type === "block"   ? "bg-[#B88A44] hover:bg-[#a1793b] border-[#B88A44]/20 shadow-orange-100" :
                                                 "bg-[#4E6B4A] hover:bg-[#2F4A36] border-[#4E6B4A]/20 shadow-green-100"
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