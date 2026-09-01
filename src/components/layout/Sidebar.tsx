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
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { User } from '@/types/erp';
import { hasPermission, isDepotScoped, NAV_SECTIONS } from '@/lib/rbac';

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

export default function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [isMounted, setIsMounted] = useState(false);

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
  }, []);

  const isDepotUser = isMounted && isDepotScoped({
    userId: currentUser.id,
    email: currentUser.email,
    role: currentUser.role as any,
    assignedDepotId: currentUser.assignedDepotId,
  });

  // Permission-based navigation sections
  const navSections = NAV_SECTIONS.map(section => ({
    title: section.title,
    items: section.items
      .filter(item => hasPermission(currentUser?.role, item.permission))
      .map(item => ({
        name: item.name,
        href: item.href,
        icon: iconMap[item.icon] || LayoutDashboard,
        highlight: item.highlight,
        hidden: false,
      }))
  })).filter(section => section.items.length > 0);

  // Collect all visible item hrefs to compute precise route active states
  const allHrefs = navSections.flatMap((s) => s.items.filter((i) => !i.hidden).map((i) => i.href));

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + '/')) {
      // Ensure no more specific sibling/child menu item matches this pathname
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
    <aside className="w-60 shrink-0 border-r border-[#e8e8e4] bg-[#fbfbfa] flex flex-col justify-between hidden md:flex h-full min-h-0 overflow-hidden select-none">
      {/* Depot sandboxing alert if Depot User */}
      {isDepotUser && (
        <div className="shrink-0 m-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Sandboxed View</span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Scoped strictly to {currentUser.assignedDepotName}. Sensitive margins & financial settings are restricted.
          </p>
        </div>
      )}

      {/* Nav Menu */}
      <div className="flex-1 min-h-0 overflow-y-auto py-4 px-2.5 space-y-5">
        {navSections.map((section, idx) => {
          if (section.items.length === 0) return null;

          return (
            <div key={idx}>
              <div className="px-3 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isItemActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                          ? 'bg-[#eef0ff] text-[#4f61c4] border border-[#dce0fb] shadow-none font-semibold'
                          : item.highlight
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-[#f1f1ee]'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${isActive
                              ? 'text-brand-400'
                              : item.highlight
                                ? 'text-emerald-400'
                                : 'text-slate-400 group-hover:text-white'
                            }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.highlight && (
                        <span className="rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 uppercase">
                          Mobile
                        </span>
                      )}
                      {isActive && !item.highlight && (
                        <ChevronRight className="h-3.5 w-3.5 text-brand-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cloudinary CDN Indicator Footer */}
      <div className="shrink-0 p-3 border-t border-[#e8e8e4] bg-[#f7f7f5]">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloudinary CDN</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400">camera-erp-dev2</span>
        </div>
      </div>
    </aside>
  );
}
