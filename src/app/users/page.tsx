'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, KeyRound, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { User, UserRole, Depot } from '@/types/erp';
import ImageUploadField from '@/components/ui/ImageUploadField';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchInput, Input, Select } from '@/components/ui/Input';
import { Drawer, Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_PASSWORD = 'ChangeMe@Arib2026!';

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Manager', value: 'MANAGER' },
  { label: 'ERP User', value: 'ERP_USER' },
  { label: 'Depot User', value: 'DEPOT_USER' },
];

const ROLE_TONE: Record<string, 'primary' | 'info' | 'warning' | 'neutral'> = {
  SUPER_ADMIN: 'primary',
  MANAGER: 'info',
  ERP_USER: 'neutral',
  DEPOT_USER: 'warning',
};

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  assignedDepotId: string;
  phone: string;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function UsersManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>({
    name: '',
    email: '',
    password: DEFAULT_PASSWORD,
    role: 'DEPOT_USER',
    assignedDepotId: '',
    phone: '',
    avatar: '',
    status: 'ACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState(DEFAULT_PASSWORD);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [usersRes, depotsRes] = await Promise.all([fetch('/api/users'), fetch('/api/depots')]);
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const depotsData = depotsRes.ok ? await depotsRes.json() : [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setDepots(Array.isArray(depotsData) ? depotsData : []);
    } catch {
      toast({ title: 'Unable to load users', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm({
      name: '',
      email: '',
      password: DEFAULT_PASSWORD,
      role: 'DEPOT_USER',
      assignedDepotId: depots[0]?.id || '',
      phone: '',
      avatar: '',
      status: 'ACTIVE',
    });
    setFormError('');
    setDrawerMode('create');
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      assignedDepotId: u.assignedDepotId || depots[0]?.id || '',
      phone: u.phone || '',
      avatar: u.avatar || '',
      status: u.status,
    });
    setFormError('');
    setDrawerMode('edit');
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = drawerMode === 'edit' && editingUser;
      const depot = depots.find((d) => d.id === form.assignedDepotId);
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        assignedDepotId: form.role === 'DEPOT_USER' ? form.assignedDepotId : undefined,
        assignedDepotName: form.role === 'DEPOT_USER' && depot ? depot.name : undefined,
        phone: form.phone.trim(),
        avatar: form.avatar.trim(),
        status: form.status,
      };
      if (!isEdit) payload.password = form.password || DEFAULT_PASSWORD;

      const res = await fetch(isEdit ? `/api/users/${editingUser.id}` : '/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
      }

      toast({ title: isEdit ? 'User updated' : 'User created', variant: 'success' });
      await loadData();
      closeDrawer();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError('');
    setIsResetting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: resetTarget.id, newPassword: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      toast({ title: `Password reset for ${resetTarget.name}`, variant: 'success' });
      setResetTarget(null);
      setResetPassword(DEFAULT_PASSWORD);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      toast({ title: `${deleteTarget.name} removed`, variant: 'success' });
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.assignedDepotName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="07 / ADMINISTRATION"
        title="Users"
        description="System operators, role-based access, and depot assignments."
        actions={
          <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New User
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput
          placeholder="Search name, email, or depot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="w-full sm:w-80"
        />
        <Select
          options={[{ label: 'All roles', value: 'ALL' }, ...ROLE_OPTIONS]}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          wrapperClassName="w-44"
        />
        <span className="text-xs text-muted sm:ml-auto">{filteredUsers.length} users</span>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={users.length === 0 ? 'No users yet' : 'No matching users'}
          description={
            users.length === 0
              ? 'Add team members and assign their roles to control access.'
              : 'No users match your search or role filter.'
          }
          action={
            users.length === 0 && (
              <Button iconLeft={<Plus className="h-4 w-4" />} onClick={openCreate}>
                Add User
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Depot</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{u.name}</div>
                        <div className="text-xs text-muted truncate mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={ROLE_TONE[u.role] || 'neutral'}>{u.role.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-muted">
                    {u.role === 'DEPOT_USER' ? u.assignedDepotName || '—' : 'All depots'}
                  </TableCell>
                  <TableCell className="text-muted text-xs">
                    {u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => setResetTarget(u)}>
                        Reset
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Drawer
        open={drawerMode !== null}
        onClose={closeDrawer}
        width="md"
        title={drawerMode === 'edit' ? `Edit ${editingUser?.name || 'User'}` : 'New User'}
        description={
          drawerMode === 'edit'
            ? 'Update role, depot assignment, and account status.'
            : 'Create a system account and assign its access level.'
        }
        footer={
          <>
            {drawerMode === 'edit' && editingUser && (
              <Button
                variant="destructive"
                onClick={() => setDeleteTarget(editingUser)}
                disabled={isSubmitting}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={closeDrawer} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={isSubmitting} iconLeft={!isSubmitting ? <CheckCircle2 className="h-4 w-4" /> : undefined}>
              {drawerMode === 'edit' ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-lg border border-danger-border bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
              {formError}
            </div>
          )}

          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Alex Morgan"
          />
          <Input
            label="Work Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="alex@aribglobal.com"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+971 4 800 0100"
          />

          {drawerMode === 'create' && (
            <Input
              label="Initial Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              hint="The user should change this after first sign-in."
            />
          )}

          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          />

          {form.role === 'DEPOT_USER' && (
            <Select
              label="Assigned Depot"
              options={depots.map((d) => ({ label: d.name, value: d.id }))}
              value={form.assignedDepotId}
              onChange={(e) => setForm({ ...form, assignedDepotId: e.target.value })}
              hint="Depot users can only access data for their assigned depot."
            />
          )}

          {drawerMode === 'edit' && (
            <Select
              label="Account Status"
              options={[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' },
              ]}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            />
          )}

          <ImageUploadField
            label="Profile Photo"
            value={form.avatar}
            onChange={(url) => setForm({ ...form, avatar: url })}
          />
        </form>
      </Drawer>

      <Modal
        open={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        title="Reset Password"
        description={resetTarget ? `Set a new password for ${resetTarget.name}.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={isResetting}>
              Cancel
            </Button>
            <Button type="submit" form="reset-form" loading={isResetting} iconLeft={!isResetting ? <KeyRound className="h-4 w-4" /> : undefined}>
              Reset Password
            </Button>
          </>
        }
      >
        <form id="reset-form" onSubmit={handleResetPassword} className="flex flex-col gap-3">
          {resetError && (
            <div className="rounded-lg border border-danger-border bg-danger-soft px-3.5 py-2.5 text-xs text-danger">
              {resetError}
            </div>
          )}
          <Input
            label="New Password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            required
            hint="Share this securely — the user should change it after signing in."
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Remove ${deleteTarget?.name || 'user'}?`}
        description="This permanently removes the account and revokes all access. This cannot be undone."
        confirmLabel="Remove User"
        destructive
        loading={isDeleting}
      />
    </div>
  );
}
