'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  ExternalLink,
  Building2,
  Package,
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Shipment } from '@/types/erp';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setShipments(dataStore.getShipments());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = shipments.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.airwayBillNumber.toLowerCase().includes(q) ||
        s.shipmentNumber.toLowerCase().includes(q) ||
        s.customerCompany.toLowerCase().includes(q) ||
        s.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-sky-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Shipments & Airway Bills (AWB)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global air freight dispatches via DHL Express, FedEx, Aramex & Emirates SkyCargo.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AWB # (DHL-9482103847) or Client..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Shipments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((s) => {
          const badge = getStatusBadgeClasses(s.status);

          return (
            <div
              key={s.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    {s.courier.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{s.customerCompany}</h3>
                  <div className="font-mono text-xs font-bold text-sky-300 mt-0.5">
                    AWB: {s.airwayBillNumber}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                  {s.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Origin Depot:</span>
                  <span className="text-white font-medium font-sans">{s.depotName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Linked Tax Invoice:</span>
                  <Link href={`/invoices/${s.invoiceId}`} className="text-brand-400 hover:underline">
                    {s.invoiceNumber}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Gross Weight:</span>
                  <span className="text-slate-200">{s.weightKg} kg ({s.packageCount} box)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Dispatched Date:</span>
                  <span className="text-slate-200 font-sans">{formatDate(s.shippingDate)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <a
                  href={s.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <span>Carrier Tracking Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                {s.status !== 'DELIVERED' && (
                  <button
                    onClick={() => {
                      dataStore.updateShipmentStatus(s.id, 'DELIVERED');
                      loadData();
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
