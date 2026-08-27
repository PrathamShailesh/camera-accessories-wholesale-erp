'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  Search,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Boxes,
  Clock,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDateTime } from '@/lib/utils';
import { StockAdjustment, Product, Depot } from '@/types/erp';

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [selectedDepot, setSelectedDepot] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Form states
  const [productId, setProductId] = useState('');
  const [depotId, setDepotId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE'>('REMOVE');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<'DAMAGED' | 'CYCLE_COUNT' | 'FOUND' | 'DEFECTIVE' | 'OTHER'>('CYCLE_COUNT');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setAdjustments(dataStore.getAdjustments());
    const allProds = dataStore.getProducts();
    const allDeps = dataStore.getDepots();
    setProducts(allProds);
    setDepots(allDeps);

    if (!depotId && allDeps.length > 0) {
      setDepotId(allDeps[0].id);
    }
    if (!productId && allProds.length > 0) {
      setProductId(allProds[0].id);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  // Compute selected product current depot stock
  const selectedProduct = products.find((p) => p.id === productId);
  const selectedDepotObj = depots.find((d) => d.id === depotId);
  const currentDepotStock = selectedProduct?.depotBreakdown?.[depotId] ?? 0;

  const deltaQty = adjustmentType === 'ADD' ? Math.abs(quantity) : -Math.abs(quantity);
  const projectedNewQty = Math.max(0, currentDepotStock + deltaQty);

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!productId || !depotId || !quantity || quantity <= 0) {
      setErrorMessage('Please select product, depot and enter a valid quantity.');
      return;
    }

    if (adjustmentType === 'REMOVE' && currentDepotStock - quantity < 0) {
      setErrorMessage(`Cannot deduct ${quantity} units. Current stock at ${selectedDepotObj?.name || 'depot'} is only ${currentDepotStock}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      dataStore.adjustStock(productId, depotId, deltaQty, reason, notes);
      setSuccessMessage(`Stock adjusted successfully for ${selectedProduct?.sku || 'product'}.`);
      loadData();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
        setQuantity(1);
        setNotes('');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Stock adjustment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter adjustments
  const filtered = adjustments.filter((adj) => {
    if (selectedReason !== 'ALL' && adj.reason !== selectedReason) return false;
    if (selectedDepot !== 'ALL' && adj.depotId !== selectedDepot) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        adj.productSku.toLowerCase().includes(q) ||
        adj.productName.toLowerCase().includes(q) ||
        adj.depotName.toLowerCase().includes(q) ||
        adj.user.toLowerCase().includes(q) ||
        (adj.notes && adj.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // KPI calculations
  const totalAdjustmentsCount = adjustments.length;
  const positiveAdjustments = adjustments.filter((a) => a.deltaQty > 0).reduce((sum, a) => sum + a.deltaQty, 0);
  const negativeAdjustments = adjustments.filter((a) => a.deltaQty < 0).reduce((sum, a) => sum + Math.abs(a.deltaQty), 0);
  const damagedCount = adjustments.filter((a) => a.reason === 'DAMAGED' || a.reason === 'DEFECTIVE').reduce((sum, a) => sum + Math.abs(a.deltaQty), 0);

  const getReasonBadge = (r: string) => {
    switch (r) {
      case 'DAMAGED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'DEFECTIVE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'FOUND':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CYCLE_COUNT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-6 w-6 text-brand-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Depot Stock Adjustments & Cycle Counts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Audit log and manual reconciliation for physical counts, write-offs, found units, and damaged goods.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/transfers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Boxes className="h-4 w-4 text-cyan-400" />
            <span>Stock Transfers</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Adjustment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Adjustments</span>
            <SlidersHorizontal className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {totalAdjustmentsCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Recorded in ERP ledger</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Surplus / Found Units</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">
            +{positiveAdjustments}
          </div>
          <span className="text-[10px] text-emerald-500/80 font-mono">Credited to inventory</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Write-Offs / Discrepancies</span>
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1.5">
            -{negativeAdjustments}
          </div>
          <span className="text-[10px] text-rose-500/80 font-mono">Deducted from ledger</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Damaged & Defective</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5">
            {damagedCount} units
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono">Quarantine & scrap</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, Product, Depot, User..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Reason Filter */}
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
          >
            <option value="ALL">All Reasons</option>
            <option value="CYCLE_COUNT">Cycle Count</option>
            <option value="DAMAGED">Damaged Goods</option>
            <option value="FOUND">Found Surplus</option>
            <option value="DEFECTIVE">Defective</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Depot Filter */}
          <select
            value={selectedDepot}
            onChange={(e) => setSelectedDepot(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
          >
            <option value="ALL">All Depots</option>
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Product / Hardware</th>
                <th className="p-3.5">Depot Location</th>
                <th className="p-3.5">Adjustment Type & Reason</th>
                <th className="p-3.5 text-center">Variance (Delta)</th>
                <th className="p-3.5 text-center">Previous ➔ New Qty</th>
                <th className="p-3.5">Adjusted By</th>
                <th className="p-3.5">Notes & Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No stock adjustments found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {isMounted ? formatDateTime(adj.createdAt) : adj.createdAt?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white line-clamp-1">{adj.productName}</div>
                      <div className="text-[10px] font-mono text-brand-400 mt-0.5">{adj.productSku}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        <span>{adj.depotName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border font-semibold ${getReasonBadge(adj.reason)}`}>
                        {adj.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span
                        className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
                          adj.deltaQty > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {adj.deltaQty > 0 ? `+${adj.deltaQty}` : adj.deltaQty} units
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono whitespace-nowrap">
                      <span className="text-slate-400">{adj.previousQty}</span>
                      <span className="text-slate-600 mx-1.5">➔</span>
                      <span className="text-white font-bold">{adj.newQty}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{adj.user}</div>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                      {adj.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Record Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs">
              {/* Depot Selection */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Select Depot Warehouse</label>
                <select
                  value={depotId}
                  onChange={(e) => setDepotId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city}, {d.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Select Product Hardware</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} &bull; {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Depot Stock Status Indicator */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Current Stock at {selectedDepotObj?.name?.split(' ')[0] || 'Depot'}:</span>
                <span className="text-white font-bold">{currentDepotStock} units</span>
              </div>

              {/* Adjustment Direction and Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Direction</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('REMOVE')}
                      className={`py-1.5 rounded-lg font-semibold text-center transition-all ${
                        adjustmentType === 'REMOVE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Deduct (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('ADD')}
                      className={`py-1.5 rounded-lg font-semibold text-center transition-all ${
                        adjustmentType === 'ADD'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Add (+)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Quantity (Units)</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reason Selection */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Adjustment Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-brand-500 focus:outline-none"
                >
                  <option value="CYCLE_COUNT">Cycle Count (Physical audit difference)</option>
                  <option value="DAMAGED">Damaged (Broken optics/body scrap)</option>
                  <option value="FOUND">Found Surplus (Unrecorded item discovered)</option>
                  <option value="DEFECTIVE">Defective (Factory defect quarantined)</option>
                  <option value="OTHER">Other Discrepancy</option>
                </select>
              </div>

              {/* Projected Result Preview */}
              <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Projected Result:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{currentDepotStock}</span>
                  <span className={deltaQty > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {deltaQty > 0 ? `+${deltaQty}` : deltaQty}
                  </span>
                  <span className="text-slate-500">=</span>
                  <span className="text-white font-bold text-sm">{projectedNewQty} units</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Audit Notes & Justification</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discovered during weekly cycle count on shelf B4..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
