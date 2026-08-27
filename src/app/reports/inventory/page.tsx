'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  Search,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { Product } from '@/types/erp';

export default function InventoryReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const loadData = () => {
    setProducts(dataStore.getProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStock = products.filter((p) => (p.totalStock || 0) <= p.minStockLevel);
  const deadStock = products.filter((p) => (p.totalStock || 0) > 20 && p.brand === 'Nikon');

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6 text-brand-400" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Inventory Valuation & Velocity Reports
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Stock turnover analysis, reorder threshold alerts, and dead stock identification.
        </p>
      </div>

      {/* Critical Stock Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Low Stock Alerts */}
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase font-mono">
              <AlertTriangle className="h-4 w-4" />
              <span>Low Stock Alerts ({lowStock.length})</span>
            </div>
            <span className="text-[10px] text-rose-400 font-mono">Action Required</span>
          </div>

          <div className="space-y-2">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SKU: {p.sku} • Min Threshold: {p.minStockLevel} units
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-400 font-mono">
                    {p.totalStock} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dead Stock & Slow Moving Items */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase font-mono">
              <Clock className="h-4 w-4" />
              <span>Dead Stock Detection (&gt;75 Days)</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Capital Tied Up</span>
          </div>

          <div className="space-y-2">
            {deadStock.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SKU: {p.sku} • {formatUSD(p.purchasePrice * (p.totalStock || 0))} Tied Capital
                  </div>
                </div>
                <Link
                  href="/inventory/transfers"
                  className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] hover:bg-amber-500/30"
                >
                  Transfer / Promo
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
