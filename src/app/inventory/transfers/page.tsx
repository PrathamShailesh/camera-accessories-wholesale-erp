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

  const loadData = () => {
    setTransfers(dataStore.getTransfers());
    const allProducts = dataStore.getProducts();
    setProducts(allProducts);
    const allDepots = dataStore.getDepots();
    setDepots(allDepots);

    if (!sourceDepotId && allDepots.length >= 2) {
      setSourceDepotId(allDepots[1].id); // e.g. Dubai
      setDestDepotId(allDepots[0].id);   // e.g. Bangalore
    }
    if (!productId && allProducts.length > 0) {
      setProductId(allProducts[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceDepotId === destDepotId) {
      setErrorMessage('Source and destination depots must be different');
      return;
    }

    try {
      dataStore.createTransfer(
        sourceDepotId,
        destDepotId,
        [{ productId, quantity: Number(quantity) }],
        notes
      );
      setIsModalOpen(false);
      setErrorMessage('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfer failed');
    }
  };

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
              <ArrowLeftRight className="h-6 w-6 text-brand-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Inter-Depot Stock Transfers
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Rebalance stock between Dubai, Bangalore, Mumbai & Singapore with automated ledger deduction.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>New Inter-Hub Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {tr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4">
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

            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs text-slate-300">
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
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
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
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
