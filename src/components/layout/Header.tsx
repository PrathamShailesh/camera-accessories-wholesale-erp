'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Camera,
  Layers,
  ChevronDown,
  Building2,
  CheckCircle,
  PlusCircle,
  FileText,
  Package,
  Globe,
  ExternalLink,
  X,
  User as UserIcon,
  ShieldCheck,
  Smartphone,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { User, Notification, UserRole } from '@/types/erp';
import { formatDateTime } from '@/lib/utils';
import dataStore from '@/lib/data-store';
import GlobalSearchModal from '@/components/search/GlobalSearchModal';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';

export default function Header() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Change password modal states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const reloadData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          dataStore.setCurrentUser(data.user.id);
        }
      } else {
        setCurrentUser(dataStore.getCurrentUser());
      }
    } catch {
      setCurrentUser(dataStore.getCurrentUser());
    }
    setNotifications(dataStore.getNotifications(currentUser.role, currentUser.assignedDepotId));
  };

  useEffect(() => {
    setIsMounted(true);
    reloadData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('erp_current_user');
    }
    setIsProfileMenuOpen(false);
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    dataStore.markAllNotificationsAsRead();
    reloadData();
  };

  return (
    <>
      <header className="shrink-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#e8e8e4] bg-[#fbfbfa]/95 px-4 sm:px-5 backdrop-blur-md">
        {/* Left: Mobile menu & Brand */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b6ee1] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold tracking-tight text-slate-900 text-sm">LensCore</span>
                <span className="rounded bg-[#eef0ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#596cd1] uppercase tracking-wider">
                  ERP
                </span>
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:inline-block">
                Camera & Cine Wholesale OS
              </span>
            </div>
          </Link>

          {/* Quick Depot status badge */}
          {isMounted && currentUser.assignedDepotName ? (
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Depot Sandbox: {currentUser.assignedDepotName}</span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
              <Globe className="h-3.5 w-3.5 text-brand-400" />
              <span>Multi-Depot: DXB • BLR • BOM • SIN</span>
            </div>
          )}
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-[#e6e6e2] bg-white px-3 py-1.5 text-sm text-slate-500 hover:border-[#cdd3fa] hover:bg-white transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-xs sm:text-sm">Search Invoices, Serials, SKUs, AWBs...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Actions, Notifications & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Quick Create Proforma button (Managers/Admins) */}
          {currentUser.role !== 'DEPOT_USER' && (
            <Link
              href="/proformas/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#5b6ee1] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#6879e8] transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Proforma</span>
            </Link>
          )}

          {/* Cloud Upload Trigger */}
          <button
            onClick={() => setIsUploadOpen(true)}
            title="Upload Document or Photo to Cloudinary"
            className="flex items-center gap-1.5 rounded-lg border border-[#e6e6e2] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-[#d6d6d0] hover:text-slate-900 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Cloud Upload</span>
          </button>

          {/* Depot Mobile View Quick Link */}
          <Link
            href="/depot-mobile"
            title="Open Mobile-First Depot Fulfilment UI"
            className="flex items-center gap-1.5 rounded-lg border border-[#e6e6e2] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-[#d6d6d0] hover:text-slate-900 transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Depot UI</span>
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-glow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-brand-400" />
                    <span className="text-sm font-semibold text-white">System Notifications</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-brand-400 hover:text-brand-300 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => {
                          dataStore.markNotificationAsRead(n.id);
                          setIsNotifOpen(false);
                          reloadData();
                        }}
                        className={`block p-3 rounded-lg border transition-all ${
                          n.read
                            ? 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                            : 'border-brand-500/30 bg-brand-950/20 text-slate-200 hover:border-brand-500/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-white line-clamp-1">{n.title}</span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-brand-400 shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] font-mono text-slate-500 mt-2 block">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Enterprise User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 p-1.5 sm:px-3 sm:py-1.5 hover:border-slate-600 transition-colors shadow-sm"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
                alt={currentUser.name}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-brand-500/50"
              />
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-white line-clamp-1">{currentUser.name}</div>
                <div className="text-[10px] font-mono text-brand-400 leading-tight flex items-center gap-1">
                  <span>{currentUser.role.replace('_', ' ')}</span>
                  {isMounted && currentUser.assignedDepotName && (
                    <span className="text-slate-400 truncate max-w-[100px]">• {currentUser.assignedDepotName.split(' ')[0]}</span>
                  )}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="font-bold text-xs text-white line-clamp-1">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                    {currentUser.assignedDepotName && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 truncate max-w-[120px]">
                        {currentUser.assignedDepotName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-cyan-400" />
                    <span>Change My Password</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of ERP</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Cloudinary Document / Photo Upload Modal */}
      <CloudinaryUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => reloadData()}
      />

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Change Your Security Password</h3>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Password (Min. 6 characters)</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
