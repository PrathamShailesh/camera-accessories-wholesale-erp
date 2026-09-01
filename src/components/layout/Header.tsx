'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Camera,
  Building2,
  PlusCircle,
  FileText,
  Globe,
  Smartphone,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, Notification } from '@/types/erp';
import { formatDateTime } from '@/lib/utils';
import dataStore from '@/lib/data-store';
import GlobalSearchModal from '@/components/search/GlobalSearchModal';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  const reloadData = async () => {
    try {
      const [authRes, settingsRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/settings')]);

      if (authRes.ok) {
        const data = await authRes.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          dataStore.setCurrentUser(data.user.id);
        }
      } else {
        setCurrentUser(dataStore.getCurrentUser());
      }

      if (settingsRes.ok) {
        const setJson = await settingsRes.json();
        setSettings(setJson);
      }
    } catch {
      setCurrentUser(dataStore.getCurrentUser());
    }
    setNotifications(dataStore.getNotifications(currentUser.role, currentUser.assignedDepotId));
  };

  useEffect(() => {
    setIsMounted(true);
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('erp_current_user');
    }
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      toast({ title: 'Password updated', description: 'Your password has been changed successfully.', variant: 'success' });
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    dataStore.markAllNotificationsAsRead();
    reloadData();
  };

  const brandName = settings?.tradingName || settings?.companyName || 'GROWTH BRIDGE';
  const logoUrl = settings?.logoUrl;

  return (
    <>
      <header className="shrink-0 z-30 flex h-14 w-full items-center justify-between border-b border-line bg-surface px-4 sm:px-5">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-3 group shrink-0">
            {logoUrl ? (
              <div className="h-9 w-9 rounded-lg overflow-hidden shrink-0 border border-line bg-surface-muted flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={brandName} className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLElement).style.display = 'none')} />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0">
                <Camera className="h-5 w-5" />
              </div>
            )}
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-ink text-sm">{brandName}</span>
                <Badge tone="primary" className="uppercase">ERP</Badge>
              </div>
              <span className="text-[10px] text-muted">Camera & Cine Wholesale OS</span>
            </div>
          </Link>

          {isMounted && currentUser.assignedDepotName ? (
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
              <Building2 className="h-3.5 w-3.5" />
              <span>Depot Sandbox: {currentUser.assignedDepotName}</span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>Multi-Depot Operations</span>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:border-[#c3c9f7] hover:bg-surface-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted" />
              <span className="text-xs sm:text-sm">Search invoices, serials, SKUs, AWBs…</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-muted border border-line">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <IconButton label="Search" onClick={() => setIsSearchOpen(true)} className="md:hidden">
            <Search className="h-[18px] w-[18px]" />
          </IconButton>

          {currentUser.role !== 'DEPOT_USER' && (
            <Button size="sm" iconLeft={<PlusCircle className="h-3.5 w-3.5" />} className="hidden sm:inline-flex" onClick={() => router.push('/proformas/new')}>
              New Proforma
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            iconLeft={<FileText className="h-3.5 w-3.5 text-info" />}
            className="hidden lg:inline-flex"
            onClick={() => setIsUploadOpen(true)}
            title="Upload document or photo to Cloudinary"
          >
            Cloud Upload
          </Button>

          <Button
            size="sm"
            variant="outline"
            iconLeft={<Smartphone className="h-3.5 w-3.5 text-success" />}
            className="hidden lg:inline-flex"
            onClick={() => router.push('/depot')}
            title="Open mobile-first depot fulfilment UI"
          >
            Depot UI
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 text-muted hover:text-ink rounded-lg hover:bg-surface-muted transition-colors" aria-label="Notifications">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-96 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-ink">Notifications</span>
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-muted">{notifications.length}</span>
                </div>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {notifications.length === 0 ? (
                  <EmptyState icon={Bell} title="No notifications" compact />
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => {
                        dataStore.markNotificationAsRead(n.id);
                        reloadData();
                      }}
                      className={`block p-2.5 rounded-lg border transition-colors ${
                        n.read ? 'border-transparent hover:bg-surface-muted' : 'border-[#d7dbf9] bg-primary-soft'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-ink line-clamp-1">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] font-mono text-muted mt-1.5 block">{formatDateTime(n.createdAt)}</span>
                    </Link>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-line bg-surface p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 hover:bg-surface-muted transition-colors">
                <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-ink line-clamp-1">{currentUser.name}</div>
                  <div className="text-[10px] text-muted leading-tight">{currentUser.role.replace('_', ' ')}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <div className="px-3 py-2.5 rounded-lg bg-surface-muted mb-1">
                <div className="font-semibold text-xs text-ink line-clamp-1">{currentUser.name}</div>
                <div className="text-[11px] text-muted truncate">{currentUser.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <Badge tone="primary">{currentUser.role.replace('_', ' ')}</Badge>
                  {currentUser.assignedDepotName && <Badge tone="info">{currentUser.assignedDepotName}</Badge>}
                </div>
              </div>
              <DropdownMenuItem onSelect={() => setIsChangePasswordOpen(true)}>
                <KeyRound className="h-3.5 w-3.5 text-info" />
                Change My Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CloudinaryUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploaded={() => reloadData()} />

      <Modal
        open={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setPasswordError('');
        }}
        title="Change Your Password"
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {passwordError && (
            <div className="p-2.5 rounded-lg bg-danger-soft border border-danger-border text-danger text-xs">{passwordError}</div>
          )}
          <div className="relative">
            <Input
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[30px] text-muted hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <Input
            label="New Password"
            hint="Minimum 6 characters"
            type={showPassword ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type new password"
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmittingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
