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
import { fetchCurrentUserCached, getCurrentUserCachedSync } from '@/lib/client-cache';
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
  ShieldAlert,
};

const COLLAPSE_KEY = 'erp_sidebar_collapsed';

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(() => getCurrentUserCachedSync()?.user || dataStore.getCurrentUser());
  const [isMounted, setIsMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}

    fetchCurrentUserCached().then((data) => {
      if (data?.authenticated && data.user) {
        setCurrentUser(data.user);
      }
    });
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
        'shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex h-full min-h-0 overflow-hidden select-none transition-[width] duration-150',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      {!collapsed && (
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pdflogo.png"
              alt="ARIB GLOBAL"
              className="h-8 w-auto object-contain shrink-0 max-h-9"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-400 font-medium truncate">Camera & Cine OS</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase shrink-0">
            ERP
          </span>
        </div>
      )}

      {isDepotUser && !collapsed && (
        <div className="shrink-0 m-3 p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Sandboxed View</span>
          </div>
          <p className="text-[11px] mt-1 text-amber-700 leading-normal">
            Scoped strictly to {currentUser.assignedDepotName}.
          </p>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 px-2.5 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={`${item.href}-${item.name}`}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                      collapsed && 'justify-center px-0 py-3',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                        : item.highlight
                          ? 'text-emerald-700 hover:bg-emerald-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4.5 w-4.5 shrink-0',
                        isActive ? 'text-primary' : item.highlight ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.name}</span>
                        {item.highlight && (
                          <span className="ml-auto rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-100 uppercase shrink-0">
                            Depot UI
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

      {/* Footer Collapse Button */}
      <div className="shrink-0 p-2.5 border-t border-slate-100 bg-white">
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
