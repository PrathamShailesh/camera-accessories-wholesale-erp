'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileCheck2,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  Barcode,
  ArrowLeftRight,
  SlidersHorizontal,
  Building2,
  Truck,
  FolderLock,
  TrendingUp,
  BarChart3,
  ScrollText,
  Settings,
  Smartphone,
  ShieldAlert,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { User } from '@/types/erp';
import { hasPermission, isDepotScoped, NAV_SECTIONS } from '@/lib/rbac';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  FileCheck2,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  Boxes,
  Barcode,
  ArrowLeftRight,
  SlidersHorizontal,
  Building2,
  Truck,
  FolderLock,
  TrendingUp,
  BarChart3,
  ScrollText,
  Settings,
  Smartphone,
};

const COLLAPSE_KEY = 'erp_sidebar_collapsed';

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentUser(dataStore.getCurrentUser());
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}

    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const isDepotUser = isMounted && isDepotScoped({
    userId: currentUser.id,
    email: currentUser.email,
    role: currentUser.role as any,
    assignedDepotId: currentUser.assignedDepotId,
  });

  const navSections = NAV_SECTIONS.map((section) => ({
    title: section.title,
    items: section.items
      .filter((item) => hasPermission(currentUser?.role, item.permission))
      .map((item) => ({
        name: item.name,
        href: item.href,
        icon: iconMap[item.icon] || LayoutDashboard,
        highlight: item.highlight,
      })),
  })).filter((section) => section.items.length > 0);

  const allHrefs = navSections.flatMap((s) => s.items.map((i) => i.href));

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + '/')) {
      const hasMoreSpecificMatch = allHrefs.some(
        (otherHref) =>
          otherHref !== href &&
          otherHref.length > href.length &&
          (pathname === otherHref || pathname.startsWith(otherHref + '/'))
      );
      return !hasMoreSpecificMatch;
    }
    return false;
  };

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-line bg-surface flex-col justify-between hidden md:flex h-full min-h-0 overflow-hidden select-none transition-[width] duration-150',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {isDepotUser && !collapsed && (
        <div className="shrink-0 m-3 p-2.5 rounded-lg border border-warning-border bg-warning-soft text-warning text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Sandboxed View</span>
          </div>
          <p className="text-[11px] mt-1 opacity-80">
            Scoped strictly to {currentUser.assignedDepotName}. Sensitive margins & financial settings are restricted.
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto py-4 px-2.5 space-y-5">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary-soft text-primary font-semibold'
                        : item.highlight
                          ? 'text-success hover:bg-success-soft'
                          : 'text-muted hover:text-ink hover:bg-surface-muted'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : item.highlight ? 'text-success' : 'text-muted group-hover:text-ink')} />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.name}</span>
                        {item.highlight && (
                          <span className="ml-auto rounded bg-success-soft px-1.5 py-0.5 text-[9px] font-semibold text-success uppercase shrink-0">
                            Mobile
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 p-2 border-t border-line">
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-muted hover:text-ink hover:bg-surface-muted transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
