'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  Boxes,
  Package,
  Truck,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Warehouse,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { User } from '@/types/erp';

export default function DepotAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [settings, setSettings] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(dataStore.getCurrentUser());

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {});
  }, []);

  const depotNavItems = [
    { name: 'Depot Dashboard', href: '/depot', icon: 'Smartphone' },
    { name: 'Pick Orders', href: '/depot/pick', icon: 'Boxes' },
    { name: 'Pack Orders', href: '/depot/pack', icon: 'Package' },
    { name: 'Shipments', href: '/depot/ship', icon: 'Truck' },
    { name: 'Inventory', href: '/depot/inventory', icon: 'Warehouse' },
  ];

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Smartphone,
      Boxes,
      Package,
      Truck,
      Warehouse,
    };
    return iconMap[iconName] || Smartphone;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const brandName = settings?.tradingName || settings?.companyName || 'GROWTH BRIDGE';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col overflow-hidden bg-slate-950">
      {/* Depot Header */}
      <header className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-emerald-500/40 bg-slate-900 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Smartphone className="h-5 w-5" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">{brandName} Depot</h1>
                <p className="text-xs text-emerald-400 font-mono">
                  {currentUser.assignedDepotName || 'Warehouse Operations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-amber-300 font-medium font-mono">
                  {currentUser.assignedDepotName || 'Depot Scope'}
                </span>
              </div>

              {/* Link back to Main ERP for Super Admin and Manager users */}
              {['SUPER_ADMIN', 'MANAGER', 'ERP_USER'].includes(currentUser.role) && (
                <Link
                  href="/dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
                  title="Switch to Management ERP Dashboard"
                >
                  <span>Main ERP</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm">
          <div className="pt-20 px-4 space-y-2">
            {depotNavItems.map((item) => {
              const Icon = getIcon(item.icon);
              const isActive =
                item.href === '/depot'
                  ? pathname === '/depot'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/80">
          <div className="p-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-amber-300 font-medium">
                Depot Scope Active
              </span>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {depotNavItems.map((item) => {
              const Icon = getIcon(item.icon);
              const isActive =
                item.href === '/depot'
                  ? pathname === '/depot'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
