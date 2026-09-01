'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Smartphone,
  Boxes,
  Package,
  Truck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Warehouse,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { User } from '@/types/erp';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

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
        if (data?.authenticated && data.user) setCurrentUser(data.user);
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
    { name: 'Depot Dashboard', href: '/depot', icon: Smartphone },
    { name: 'Pick Orders', href: '/depot/pick', icon: Boxes },
    { name: 'Pack Orders', href: '/depot/pack', icon: Package },
    { name: 'Shipments', href: '/depot/ship', icon: Truck },
    { name: 'Inventory', href: '/depot/inventory', icon: Warehouse },
  ];

  const isItemActive = (href: string) =>
    href === '/depot' ? pathname === '/depot' : pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/login';
    }
  };

  const brandName = settings?.tradingName || settings?.companyName || 'GROWTH BRIDGE';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col overflow-hidden bg-workspace">
      <header className="bg-surface border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl ? (
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-line bg-surface-muted flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-full w-full object-cover"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-ink truncate">{brandName} Depot</h1>
                <p className="text-xs text-success font-medium truncate">{currentUser.assignedDepotName || 'Warehouse Operations'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:block">
                <Badge tone="warning">{currentUser.assignedDepotName || 'Depot Scope'}</Badge>
              </div>

              {['SUPER_ADMIN', 'MANAGER', 'ERP_USER'].includes(currentUser.role) && (
                <Link
                  href="/dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-line-soft text-ink text-xs font-semibold transition-colors border border-line"
                  title="Switch to Management ERP Dashboard"
                >
                  <span>Main ERP</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2.5 rounded-lg text-muted hover:text-ink hover:bg-surface-muted"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-line-soft text-ink text-xs font-medium border border-line transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-surface">
          <div className="pt-20 px-4 space-y-1.5">
            {depotNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                    isActive ? 'bg-success text-white' : 'text-ink hover:bg-surface-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-ink hover:bg-surface-muted text-sm font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex w-64 flex-col border-r border-line bg-surface">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {depotNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-success text-white shadow-card' : 'text-muted hover:text-ink hover:bg-surface-muted'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-line">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-muted hover:bg-line-soft text-ink text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
