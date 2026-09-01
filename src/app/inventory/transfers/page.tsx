'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Package,
  Clock,
  Truck,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDate } from '@/lib/utils';
import { StockTransfer, Product, Depot } from '@/types/erp';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New transfer fields
  const [sourceDepotId, setSourceDepotId] = useState('');
  const [destDepotId, setDestDepotId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [transRes, prodsRes, depsRes] = await Promise.all([
        fetch('/api/inventory/transfers'),
        fetch('/api/products'),
        fetch('/api/depots'),
      ]);

      const transData = transRes.ok ? await transRes.json() : [];
      const prodsData = prodsRes.ok ? await prodsRes.json() : [];
      const depsData = depsRes.ok ? await depsRes.json() : [];

      setTransfers(Array.isArray(transData) ? transData : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
      setDepots(Array.isArray(depsData) ? depsData : []);

      if (depsData.length >= 2) {
        setSourceDepotId(depsData[1].id); // e.g. Dubai
        setDestDepotId(depsData[0].id);   // e.g. Bangalore
      } else if (depsData.length > 0) {
        setSourceDepotId(depsData[0].id);
      }

      if (prodsData.length > 0) {
        setProductId(prodsData[0].id);
      }
    } catch (error) {
      console.error('Error loading transfer data:', error);
      setTransfers(dataStore.getTransfers());
      setProducts(dataStore.getProducts());
      setDepots(dataStore.getDepots());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceDepotId === destDepotId) {
      setErrorMessage('Source and destination depots must be different');
      return;
    }

    if (!productId) {
      setErrorMessage('Please select equipment to transfer');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceDepotId,
          destinationDepotId: destDepotId,
          items: [{ productId, quantity: Number(quantity) }],
          notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Transfer failed');
      }

      setIsModalOpen(false);
      setErrorMessage('');
      setNotes('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'IN_TRANSIT' | 'COMPLETED') => {
    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update transfer status:', err);
    }
  };

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
              <ArrowLeftRight className="h-6 w-6 text-brand-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Inter-Depot Stock Transfers
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Rebalance stock between regional fulfillment centers with automated ledger debits and tracking.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">Total Transfers</p>
            <p className="text-xl font-bold text-white mt-1">{transfers.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">Pending Dispatch</p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              {transfers.filter((t) => t.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">In Transit</p>
            <p className="text-xl font-bold text-sky-400 mt-1">
              {transfers.filter((t) => t.status === 'IN_TRANSIT').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">Completed (Done)</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {transfers.filter((t) => t.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Transfers Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {transfers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 text-brand-400 flex items-center justify-center">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">No Stock Transfers Recorded</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Stock transfers allow you to rebalance camera inventory between regional depots with automated ledger debit and credit.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Transfer</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>Source Depot</th>
                  <th>Destination Depot</th>
                  <th>Transferred Items</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Action / Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {transfers.map((tr) => (
                  <tr key={tr.id}>
                    <td className="font-bold text-white font-mono">{tr.transferNumber}</td>
                    <td className="font-sans text-rose-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-rose-400" />
                        <span>{tr.sourceDepotName}</span>
                      </div>
                    </td>
                    <td className="font-sans text-emerald-300">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{tr.destinationDepotName}</span>
                      </div>
                    </td>
                    <td className="font-sans text-slate-200">
                      {tr.items.map((i, idx) => (
                        <div key={idx}>
                          {i.quantity}× {i.productName} ({i.productSku})
                        </div>
                      ))}
                    </td>
                    <td className="font-sans text-slate-400">{tr.createdBy}</td>
                    <td className="text-slate-400">{formatDate(tr.createdAt)}</td>
                    <td>
                      {tr.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock className="h-3 w-3" />
                          <span>PENDING</span>
                        </span>
                      )}
                      {tr.status === 'IN_TRANSIT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                          <Package className="h-3 w-3" />
                          <span>IN TRANSIT</span>
                        </span>
                      )}
                      {tr.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>DONE / COMPLETED</span>
                        </span>
                      )}
                    </td>
                    <td className="text-right font-sans">
                      {tr.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(tr.id, 'IN_TRANSIT')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors shadow-sm"
                          title={`Dispatch from ${tr.sourceDepotName}`}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Dispatch ({tr.sourceDepotName})</span>
                        </button>
                      )}
                      {tr.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleUpdateStatus(tr.id, 'COMPLETED')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors shadow-sm animate-pulse"
                          title={`Confirm receipt at ${tr.destinationDepotName}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Receive at {tr.destinationDepotName}</span>
                        </button>
                      )}
                      {tr.status === 'COMPLETED' && (
                        <span className="text-emerald-400 text-xs font-medium inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Stock Received ({tr.destinationDepotName})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Create Inter-Depot Stock Transfer</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="flex flex-col gap-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Source Depot (Deduct)</label>
                  <select
                    value={sourceDepotId}
                    onChange={(e) => setSourceDepotId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Destination Depot (Add)</label>
                  <select
                    value={destDepotId}
                    onChange={(e) => setDestDepotId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Equipment to Transfer</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  {products.length === 0 ? (
                    <option value="">No products available</option>
                  ) : (
                    products.map((p) => {
                      const avail =
                        p.depotBreakdown && typeof p.depotBreakdown[sourceDepotId] === 'number'
                          ? p.depotBreakdown[sourceDepotId]
                          : p.totalStock;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Available: {avail} units
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Quantity to Transfer</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Transfer Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replenishing Bangalore stock for Q3 client demands"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || products.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow disabled:opacity-50"
                >
                  {isSubmitting ? 'Transferring...' : 'Execute Stock Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
