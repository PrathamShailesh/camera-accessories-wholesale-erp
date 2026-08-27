'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Receipt,
  FileCheck2,
  Truck,
  Boxes,
  ArrowRight,
  Printer,
  Search,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { TaxInvoice, Proforma } from '@/types/erp';

export default function OrdersPipelinePage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);

  const loadData = async () => {
    try {
      const [invRes, pfRes] = await Promise.all([
        fetch('/api/invoices').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/proformas').then((r) => (r.ok ? r.json() : null)),
      ]);
      setInvoices(invRes || dataStore.getInvoices());
      setProformas(pfRes || dataStore.getProformas());
    } catch {
      setInvoices(dataStore.getInvoices());
      setProformas(dataStore.getProformas());
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              End-to-End Wholesale Order Pipeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Proforma → Confirmed Deal → Tax Invoice → Depot Pick & Pack → Airway Bill → Delivery
          </p>
        </div>
      </div>

      {/* Kanban-Style Stages Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Stage 1: Active Quotes */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono">1. Proforma Quotes</span>
            <span className="rounded bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-400">
              {proformas.filter((p) => p.status !== 'CONVERTED').length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {proformas
              .filter((p) => p.status !== 'CONVERTED')
              .map((pf) => (
                <Link
                  key={pf.id}
                  href={`/proformas/${pf.id}`}
                  className="block p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-xs space-y-1 transition-all"
                >
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-brand-400">{pf.proformaNumber}</span>
                    <span className="text-white font-bold">{formatUSD(pf.grandTotal)}</span>
                  </div>
                  <div className="text-slate-300 font-semibold">{pf.customerCompany}</div>
                  <div className="text-[10px] text-slate-500">{pf.status}</div>
                </Link>
              ))}
          </div>
        </div>

        {/* Stage 2: Ready for Packing */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase font-mono">2. Depot Packing</span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {invoices.filter((i) => ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'].includes(i.fulfilmentStatus)).length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invoices
              .filter((i) => ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'].includes(i.fulfilmentStatus))
              .map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50 text-xs space-y-1 transition-all"
                >
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-white">{inv.invoiceNumber}</span>
                    <span className="text-amber-400 font-bold">{inv.depotName.split(' ')[0]}</span>
                  </div>
                  <div className="text-slate-200 font-semibold">{inv.customerCompany}</div>
                  <div className="text-[10px] text-amber-300 font-mono">{inv.fulfilmentStatus}</div>
                </Link>
              ))}
          </div>
        </div>

        {/* Stage 3: Dispatched & AWB */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-cyan-400 uppercase font-mono">3. In Transit (AWB)</span>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
              {invoices.filter((i) => i.fulfilmentStatus === 'SHIPPED').length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invoices
              .filter((i) => i.fulfilmentStatus === 'SHIPPED')
              .map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-500/50 text-xs space-y-1 transition-all"
                >
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-white">{inv.invoiceNumber}</span>
                    <span className="text-cyan-400 font-bold">{formatUSD(inv.grandTotal)}</span>
                  </div>
                  <div className="text-slate-200 font-semibold">{inv.customerCompany}</div>
                  <div className="text-[10px] text-cyan-300 font-mono">Air Freight Active</div>
                </Link>
              ))}
          </div>
        </div>

        {/* Stage 4: Delivered & Closed */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase font-mono">4. Delivered</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {invoices.filter((i) => i.fulfilmentStatus === 'DELIVERED').length}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invoices
              .filter((i) => i.fulfilmentStatus === 'DELIVERED')
              .map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="block p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs space-y-1 transition-all"
                >
                  <div className="flex justify-between font-mono">
                    <span className="font-bold text-white">{inv.invoiceNumber}</span>
                    <span className="text-emerald-400 font-bold">{formatUSD(inv.grandTotal)}</span>
                  </div>
                  <div className="text-slate-200 font-semibold">{inv.customerCompany}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Delivered & Verified</div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
