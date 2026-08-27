'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Boxes,
  Truck,
  Users,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { Depot } from '@/types/erp';

export default function DepotsPage() {
  const [depots, setDepots] = useState<Depot[]>([]);

  const loadData = () => {
    setDepots(dataStore.getDepots());
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Multi-Depot Logistics Hubs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global warehouse network managing localized stock, packing, and courier dispatches.
          </p>
        </div>
      </div>

      {/* Depots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {depots.map((d) => (
          <div
            key={d.id}
            className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-brand-500/10 text-brand-400 border border-brand-500/30">
                    {d.code} {d.isCentralHub ? '• CENTRAL HQ' : ''}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{d.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{d.city}, {d.country}</span>
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs text-slate-500">Active Stock Value</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {formatUSD(d.totalStockValue)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Physical Units</span>
                  <span className="text-white font-bold text-sm">{d.totalStockUnits} Units</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Orders in Fulfilment</span>
                  <span className="text-amber-400 font-bold text-sm">{d.activeOrdersCount || 0} Orders</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>Depot Manager: <strong>{d.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{d.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{d.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Address: {d.address}
              </span>
              <Link
                href="/depot-mobile"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Launch Depot Hub App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
