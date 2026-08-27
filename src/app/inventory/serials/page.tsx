'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Barcode,
  Search,
  Filter,
  Building2,
  ArrowLeft,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { SerialNumber } from '@/types/erp';

export default function SerialsPage() {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = () => {
    setSerials(dataStore.getSerialNumbers());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = serials.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.serialNumber.toLowerCase().includes(q) ||
        s.productName.toLowerCase().includes(q) ||
        s.productSku.toLowerCase().includes(q) ||
        s.depotName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Barcode className="h-6 w-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Serial Numbers Registry
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Unit-level traceability for cinema cameras and high-value lenses (e.g. <code>CR5-001</code>, <code>SFX3-101</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Serial # (CR5-001), Model or Depot..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'IN_STOCK', 'ALLOCATED', 'DISPATCHED', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Serials Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Equipment Model</th>
                <th>SKU</th>
                <th>Current Depot Location</th>
                <th>Linked Invoice</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filtered.map((sn) => {
                const badge = getStatusBadgeClasses(sn.status);

                return (
                  <tr key={sn.id}>
                    <td>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {sn.serialNumber}
                      </span>
                    </td>
                    <td className="font-sans text-slate-200">{sn.productName}</td>
                    <td className="text-amber-400 font-bold">{sn.productSku}</td>
                    <td className="font-sans text-slate-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{sn.depotName}</span>
                      </div>
                    </td>
                    <td>
                      {sn.invoiceNumber ? (
                        <Link
                          href={`/invoices/${sn.invoiceId}`}
                          className="text-brand-400 hover:underline"
                        >
                          {sn.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-600 italic font-sans">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {sn.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
