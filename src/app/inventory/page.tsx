'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Building2,
  ArrowLeftRight,
  Search,
  SlidersHorizontal,
  Barcode,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { Product, Depot } from '@/types/erp';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [prodsRes, depsRes] = await Promise.all([
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/depots').then((r) => (r.ok ? r.json() : null)),
      ]);
      setProducts(prodsRes || dataStore.getProducts());
      setDepots(depsRes || dataStore.getDepots());
    } catch {
      setProducts(dataStore.getProducts());
      setDepots(dataStore.getDepots());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStockValuation = products.reduce(
    (sum, p) => sum + (p.totalStock || 0) * p.purchasePrice,
    0
  );
  const totalStockUnits = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);

  const filtered = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
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
            <Boxes className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Multi-Depot Inventory Stock Matrix
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time stock distribution across Bangalore, Dubai, Mumbai & Singapore hubs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/serials"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <Barcode className="h-4 w-4 text-amber-400" />
            <span>Serial Registry</span>
          </Link>

          <Link
            href="/inventory/transfers"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Initiate Stock Transfer</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Inventory Asset Value</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatUSD(totalStockValuation)}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Purchase Cost Basis</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Physical Units in Stock</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {totalStockUnits} Units
          </div>
          <span className="text-[11px] text-slate-400">Across 4 Regional Warehouses</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Critical Stock Rule</div>
          <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Zero-Negative Enforcement</span>
          </div>
          <span className="text-[11px] text-slate-400">Locked against overselling</span>
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
            placeholder="Search SKU or Camera Model..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Multi-Depot Matrix Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Brand</th>
                <th className="text-center">Bangalore (BLR)</th>
                <th className="text-center">Dubai Hub (DXB)</th>
                <th className="text-center">Mumbai (BOM)</th>
                <th className="text-center">Singapore (SIN)</th>
                <th className="text-right">Total Stock</th>
                <th className="text-right">Wholesale Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filtered.map((p) => {
                const blr = p.depotBreakdown?.['dep-blr'] || 0;
                const dxb = p.depotBreakdown?.['dep-dxb'] || 0;
                const bom = p.depotBreakdown?.['dep-bom'] || 0;
                const sin = p.depotBreakdown?.['dep-sin'] || 0;
                const total = p.totalStock || 0;
                const isLow = total <= p.minStockLevel;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-bold text-white font-sans text-xs">{p.name}</div>
                      <div className="text-[10px] text-brand-400 font-mono">
                        {p.sku} {p.trackSerial ? '• (Serial Tracked)' : ''}
                      </div>
                    </td>
                    <td className="font-sans text-slate-300">{p.brand}</td>
                    <td className="text-center font-bold text-slate-200">
                      <span className={blr > 0 ? 'text-white' : 'text-slate-600'}>{blr}</span>
                    </td>
                    <td className="text-center font-bold text-slate-200">
                      <span className={dxb > 0 ? 'text-white' : 'text-slate-600'}>{dxb}</span>
                    </td>
                    <td className="text-center font-bold text-slate-200">
                      <span className={bom > 0 ? 'text-white' : 'text-slate-600'}>{bom}</span>
                    </td>
                    <td className="text-center font-bold text-slate-200">
                      <span className={sin > 0 ? 'text-white' : 'text-slate-600'}>{sin}</span>
                    </td>
                    <td className="text-right font-bold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'text-emerald-400'
                        }`}
                      >
                        {total} units
                      </span>
                    </td>
                    <td className="text-right text-slate-300 font-bold">
                      {formatUSD(total * p.wholesalePrice)}
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
