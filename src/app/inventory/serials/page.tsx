'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Barcode,
  Search,
  Building2,
  ArrowLeft,
  CheckCircle,
  Package,
  Truck,
  RotateCcw,
  Boxes,
  ExternalLink,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDate, getStatusBadgeClasses } from '@/lib/utils';

export default function SerialsPage() {
  const [serials, setSerials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/serials');
      if (res.ok) {
        const data = await res.json();
        setSerials(Array.isArray(data) ? data : []);
      } else {
        setSerials(dataStore.getSerialNumbers());
      }
    } catch (error) {
      console.error('Error fetching serials:', error);
      setSerials(dataStore.getSerialNumbers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = serials.filter((s) => {
    const status = s.status;
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sNum = (s.serialNumber || '').toLowerCase();
      const pName = (s.productName || s.product?.name || '').toLowerCase();
      const pSku = (s.productSku || s.product?.sku || '').toLowerCase();
      const dName = (s.depotName || s.depot?.name || '').toLowerCase();
      return (
        sNum.includes(q) ||
        pName.includes(q) ||
        pSku.includes(q) ||
        dName.includes(q)
      );
    }
    return true;
  });

  const inStockCount = serials.filter((s) => s.status === 'IN_STOCK' || s.status === 'AVAILABLE').length;
  const allocatedCount = serials.filter((s) => s.status === 'ALLOCATED').length;
  const dispatchedCount = serials.filter((s) => s.status === 'DISPATCHED' || s.status === 'SHIPPED').length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
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
              Unit-level traceability for cinema cameras, primes, and high-value equipment across all 4 hubs.
            </p>
          </div>
        </div>

        <Link
          href="/products"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <Package className="h-4 w-4 text-brand-400" />
          <span>Product Catalog</span>
        </Link>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Tracked Units</span>
            <Barcode className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {serials.length}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Serialized Items</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In Depot Stock</span>
            <Boxes className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {inStockCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">Ready for dispatch</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Allocated to Orders</span>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {allocatedCount}
          </div>
          <div className="text-[11px] text-amber-400/80 font-mono mt-0.5">In packing queue</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dispatched / Delivered</span>
            <Truck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {dispatchedCount}
          </div>
          <div className="text-[11px] text-cyan-400/80 font-mono mt-0.5">Shipped to clients</div>
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
            placeholder="Search Serial (CR5-001, SN-ILCE...), Model or Depot..."
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
                      <span>Loading serial numbers database registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Barcode className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Serial Numbers Found</h4>
                      <p className="text-xs text-slate-400 font-sans">
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'No serial numbers match your search filters. Try clearing your query.'
                          : 'Serial numbers are auto-generated when serialized hardware products (cameras, lenses) are registered or imported.'}
                      </p>
                      {searchQuery || statusFilter !== 'ALL' ? (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-sans"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          href="/products"
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow font-sans"
                        >
                          <span>View Serialized Products Catalog</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((sn) => {
                  const badge = getStatusBadgeClasses(sn.status);
                  const pName = sn.productName || sn.product?.name || 'Hardware Unit';
                  const pSku = sn.productSku || sn.product?.sku || 'SKU';
                  const dName = sn.depotName || sn.depot?.name || 'Regional Depot';
                  const invNum = sn.invoiceNumber || sn.invoice?.invoiceNumber;
                  const invId = sn.invoiceId || sn.invoice?.id;

                  return (
                    <tr key={sn.id}>
                      <td>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
                          {sn.serialNumber}
                        </span>
                      </td>
                      <td className="font-sans text-slate-200">{pName}</td>
                      <td className="text-amber-400 font-bold">{pSku}</td>
                      <td className="font-sans text-slate-300">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>{dName}</span>
                        </div>
                      </td>
                      <td>
                        {invNum ? (
                          <Link
                            href={`/invoices/${invId}`}
                            className="text-brand-400 hover:underline"
                          >
                            {invNum}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
