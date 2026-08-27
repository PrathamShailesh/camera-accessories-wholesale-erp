'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Barcode,
  Building2,
  DollarSign,
  TrendingUp,
  Boxes,
  ArrowLeftRight,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { Product, SerialNumber } from '@/types/erp';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [serials, setSerials] = useState<SerialNumber[]>([]);

  const loadData = () => {
    const p = dataStore.getProductById(id);
    if (p) {
      setProduct(p);
      setSerials(dataStore.getSerialNumbers(p.id));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!product) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Product model not found</div>
        <Link href="/products" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          Back to Products
        </Link>
      </div>
    );
  }

  const marginVal = product.sellingPrice - product.purchasePrice;
  const marginPct = ((marginVal / product.sellingPrice) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">{product.name}</h1>
              <span className="font-mono text-xs text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30">
                {product.sku}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Brand: {product.brand} • Category: {product.categoryName} • Barcode: {product.barcode}
            </p>
          </div>
        </div>

        <Link
          href="/inventory/transfers"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Transfer Units</span>
        </Link>
      </div>

      {/* Main Specs & Image */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-64">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Equipment Description & Specs
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{product.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Purchase Cost</span>
              <span className="text-white font-bold">{formatUSD(product.purchasePrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Wholesale Target</span>
              <span className="text-white font-bold">{formatUSD(product.wholesalePrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Wholesale Margin</span>
              <span className="text-emerald-400 font-bold">+{marginPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Depot Breakdown Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Inventory Breakdown across Hubs
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Bangalore (BLR)</span>
            <div className="text-xl font-bold text-white mt-1">
              {product.depotBreakdown?.['dep-blr'] || 0} Units
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Dubai Hub (DXB)</span>
            <div className="text-xl font-bold text-white mt-1">
              {product.depotBreakdown?.['dep-dxb'] || 0} Units
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Mumbai (BOM)</span>
            <div className="text-xl font-bold text-white mt-1">
              {product.depotBreakdown?.['dep-bom'] || 0} Units
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs text-slate-400">Singapore (SIN)</span>
            <div className="text-xl font-bold text-white mt-1">
              {product.depotBreakdown?.['dep-sin'] || 0} Units
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
