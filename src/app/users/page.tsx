'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { User, UserRole, Depot } from '@/types/erp';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('User@Growth2026!');
  const [role, setRole] = useState<UserRole>('DEPOT_USER');
  const [assignedDepotId, setAssignedDepotId] = useState('dep-dxb');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('User@Growth2026!');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Edit modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('DEPOT_USER');
  const [editDepotId, setEditDepotId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const loadData = async () => {
    try {
      const [usersRes, depotsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/depots'),
      ]);
      const usersData = await usersRes.json();
      const depotsData = await depotsRes.json();
      setUsers(usersData);
      setDepots(depotsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !email) {
      setErrorMessage('Name and Email are required.');
      return;
    }

    try {
      const depot = depots.find((d) => d.id === assignedDepotId);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: password || 'User@Growth2026!',
          role,
          assignedDepotId: role === 'DEPOT_USER' ? assignedDepotId : undefined,
          assignedDepotName: role === 'DEPOT_USER' && depot ? depot.name : undefined,
          phone,
          avatar:
            avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'ACTIVE',
          lastLogin: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      setIsCreateOpen(false);
      setName('');
      setEmail('');
      setPassword('User@Growth2026!');
      setPhone('');
      setAvatar('');
      setRole('DEPOT_USER');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError('');
    setResetSuccess('');
    setIsResetting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: resetTargetUser.id,
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess(data.message || 'Password reset successfully!');
      setTimeout(() => {
        setResetTargetUser(null);
        setResetSuccess('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditDepotId(u.assignedDepotId || (depots[0]?.id || 'dep-dxb'));
    setEditPhone(u.phone || '');
    setEditStatus(u.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const depot = depots.find((d) => d.id === editDepotId);
    await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        email: editEmail,
        role: editRole,
        assignedDepotId: editRole === 'DEPOT_USER' ? editDepotId : undefined,
        assignedDepotName: editRole === 'DEPOT_USER' && depot ? depot.name : undefined,
        phone: editPhone,
        status: editStatus,
      }),
    });

    setEditingUser(null);
    loadData();
  };

  const handleDeleteUser = async (u: User) => {
    if (confirm(`Are you sure you want to delete user account "${u.name}"?`)) {
      await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
      });
      loadData();
    }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await fetch(`/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.assignedDepotName && u.assignedDepotName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const managerCount = users.filter((u) => u.role === 'MANAGER').length;
  const depotUserCount = users.filter((u) => u.role === 'DEPOT_USER').length;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              User Management & Role-Based Access
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage system operators, assign regional depot sandboxes, and configure RBAC roles.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Role Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Registered Users</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{users.length}</div>
          <span className="text-[11px] text-brand-400 font-mono">System Accounts</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Super Admins</div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">{superAdminCount}</div>
          <span className="text-[11px] text-slate-400">Full System & Financial Access</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Sales & Operations Managers</div>
          <div className="text-2xl font-bold font-mono text-brand-400 mt-1">{managerCount}</div>
          <span className="text-[11px] text-slate-400">Quotes & Invoicing</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Depot Operators (Sandboxed)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{depotUserCount}</div>
          <span className="text-[11px] text-amber-400 font-mono">Warehouse Fulfilment</span>
        </div>
      </div>

      {/* Search & Role Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or depot..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'SUPER_ADMIN', 'MANAGER', 'DEPOT_USER'].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRoleFilter === r
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading users...</div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="erp-table">
            <thead>
              <tr>
                <th>User / Operator</th>
                <th>System Role</th>
                <th>Assigned Depot Sandbox</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last Active</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-8 w-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Mail className="h-3 w-3" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : u.role === 'MANAGER'
                          ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td>
                    {u.role === 'DEPOT_USER' ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        <span>{u.assignedDepotName || 'Assigned Depot'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">
                        Global (All Hubs)
                      </span>
                    )}
                  </td>

                  <td className="text-slate-400 font-mono">{u.phone || '—'}</td>

                  <td>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-rose-400" />
                          <span>INACTIVE</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="text-slate-400 font-mono text-[11px]">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}
                  </td>

                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setResetTargetUser(u);
                          setResetNewPassword('User@Growth2026!');
                          setResetError('');
                          setResetSuccess('');
                        }}
                        title="Reset User Password"
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-cyan-400 hover:text-white hover:border-cyan-500/40 transition-colors"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User"
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="Delete User"
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-rose-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Create New System User</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@lenscore.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 555 204 9911"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="SUPER_ADMIN">Super Admin (Full Access)</option>
                    <option value="MANAGER">Sales & Operations Manager</option>
                    <option value="DEPOT_USER">Depot Warehouse Operator</option>
                  </select>
                </div>

                {role === 'DEPOT_USER' ? (
                  <div>
                    <label className="block text-slate-400 mb-1">Assigned Depot Hub *</label>
                    <select
                      value={assignedDepotId}
                      onChange={(e) => setAssignedDepotId(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                    >
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1">Depot Scope</label>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                      Global (Unrestricted)
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. User@Growth2026!"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Edit User Account</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="MANAGER">Sales Manager</option>
                    <option value="DEPOT_USER">Depot Operator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {editRole === 'DEPOT_USER' && (
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Depot Sandbox</label>
                  <select
                    value={editDepotId}
                    onChange={(e) => setEditDepotId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reset Password Modal (Admin) */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Reset User Password</h3>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Setting new credentials for <strong className="text-white">{resetTargetUser.name}</strong> ({resetTargetUser.email}).
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="e.g. User@Growth2026!"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Assign New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
