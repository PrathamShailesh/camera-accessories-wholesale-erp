'use client';

import React from 'react';
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

export default function Sidebar() {
  const pathname = usePathname();
  const currentUser = dataStore.getCurrentUser();
  const isDepotUser = currentUser.role === 'DEPOT_USER';

  const navSections = [
    {
      title: 'SALES & ORDERS',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, hidden: false },
        { name: 'Proformas', href: '/proformas', icon: FileCheck2, hidden: isDepotUser },
        { name: 'Tax Invoices', href: '/invoices', icon: Receipt, hidden: false },
        { name: 'Order Pipeline', href: '/orders', icon: ShoppingCart, hidden: false },
        { name: 'Customers', href: '/customers', icon: Users, hidden: isDepotUser },
      ],
    },
    {
      title: 'INVENTORY & HARDWARE',
      items: [
        { name: 'Product Catalog', href: '/products', icon: Package, hidden: false },
        { name: 'Depot Stock Matrix', href: '/inventory', icon: Boxes, hidden: false },
        { name: 'Serial Numbers', href: '/inventory/serials', icon: Barcode, hidden: false },
        { name: 'Stock Transfers', href: '/inventory/transfers', icon: ArrowLeftRight, hidden: false },
        { name: 'Stock Adjustments', href: '/inventory/adjustments', icon: SlidersHorizontal, hidden: isDepotUser },
      ],
    },
    {
      title: 'DEPOT & FULFILMENT',
      items: [
        { name: 'Depot Hubs', href: '/depots', icon: Building2, hidden: isDepotUser },
        { name: 'Mobile Depot UI', href: '/depot-mobile', icon: Smartphone, highlight: true, hidden: false },
        { name: 'Shipments & AWBs', href: '/shipments', icon: Truck, hidden: false },
      ],
    },
    {
      title: 'DOCS & CLOUD STORAGE',
      items: [
        { name: 'Documents Hub', href: '/documents', icon: FolderLock, hidden: false },
      ],
    },
    {
      title: 'ANALYTICS & AUDIT',
      items: [
        { name: 'Profitability & BI', href: '/reports/profit', icon: TrendingUp, hidden: isDepotUser },
        { name: 'Sales Reports', href: '/reports/sales', icon: BarChart3, hidden: isDepotUser },
        { name: 'Inventory Reports', href: '/reports/inventory', icon: Boxes, hidden: isDepotUser },
        { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText, hidden: isDepotUser },
        { name: 'User Management', href: '/users', icon: Users, hidden: currentUser.role !== 'SUPER_ADMIN' },
        { name: 'ERP Settings', href: '/settings', icon: Settings, hidden: currentUser.role !== 'SUPER_ADMIN' },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-925 flex flex-col justify-between hidden md:flex sticky top-16 overflow-y-auto">
      {/* Depot sandboxing alert if Depot User */}
      {isDepotUser && (
        <div className="m-3 p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
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
      <div className="py-4 px-3 space-y-6">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((i) => !i.hidden);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                {section.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                          ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-sm font-semibold'
                          : item.highlight
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
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
