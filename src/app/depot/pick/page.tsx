'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  Printer,
  Search,
  RefreshCw,
  Barcode,
  CheckSquare,
  Square,
  Package,
  Layers,
  ArrowRight,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';
import { fetchCurrentUserCached } from '@/lib/client-cache';
import { formatUSD, formatDate } from '@/lib/utils';

export default function DepotPickPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Batch Multi-Select
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [isBatchPicking, setIsBatchPicking] = useState(false);

  // Item-level check states (invoiceId-itemId -> boolean)
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setIsLoading(true);
    let user: User | null = null;

    try {
      const userData = await fetchCurrentUserCached();
      if (userData?.authenticated && userData.user) {
        user = userData.user;
        setCurrentUser(user);
      }
    } catch {}

    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const allInvoices = await res.json();
        const filtered = allInvoices.filter(
          (inv: any) =>
            inv.fulfilmentStatus === 'READY_FOR_PACKING' &&
            (!user?.assignedDepotId || inv.depotId === user.assignedDepotId)
        );
        setInvoices(filtered);
      }
    } catch {}

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Orders
  const filteredInvoices = invoices.filter((inv) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchCompany = inv.customerCompany?.toLowerCase().includes(q);
      const matchItem = inv.items?.some(
        (item: any) =>
          item.productName?.toLowerCase().includes(q) ||
          item.productSku?.toLowerCase().includes(q) ||
          item.allocatedSerials?.some((s: string) => s.toLowerCase().includes(q))
      );
      return matchInv || matchCompany || matchItem;
    }
    return true;
  });

  // Single Order Pick Confirmation
  const handlePickOrder = async (inv: TaxInvoice) => {
    const itemPicks = inv.items.map((i) => ({ id: i.id, isPicked: true }));
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemPicks }),
      });

      if (res.ok) {
        setInvoices((items) => items.filter((i) => i.id !== inv.id));
        setSelectedInvoiceIds((prev) => {
          const next = new Set(prev);
          next.delete(inv.id);
          return next;
        });
      }
    } catch (err: any) {
      alert(`Picking error: ${err.message}`);
    }
  };

  // Batch Pick All Selected Orders at Once
  const handleBatchPickSelected = async () => {
    if (selectedInvoiceIds.size === 0) return;
    setIsBatchPicking(true);

    try {
      const selectedInvoices = invoices.filter((i) => selectedInvoiceIds.has(i.id));

      for (const inv of selectedInvoices) {
        const itemPicks = inv.items.map((i) => ({ id: i.id, isPicked: true }));
        await fetch(`/api/invoices/${inv.id}/pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemPicks }),
        });
      }

      setInvoices((items) => items.filter((i) => !selectedInvoiceIds.has(i.id)));
      setSelectedInvoiceIds(new Set());
    } catch (err: any) {
      alert(`Batch picking error: ${err.message}`);
    } finally {
      setIsBatchPicking(false);
    }
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === filteredInvoices.length && filteredInvoices.length > 0) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(filteredInvoices.map((i) => i.id)));
    }
  };

  const toggleItemPick = (invId: string, itemId: string) => {
    const key = `${invId}-${itemId}`;
    setPickedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Warehouse Picking Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-amber-400 border border-slate-700">
              {invoices.length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Depot picking station: Locate items on aisles, scan serial numbers, and verify stock before moving to packing workbench.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs hover:bg-slate-800 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search & Batch Select Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice #, Customer Name, SKU code, or Serial Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-amber-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-slate-400 self-end sm:self-auto">
            {filteredInvoices.length} matching orders
          </div>
        </div>

        {/* Select All Toggle */}
        {filteredInvoices.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-slate-400 hover:text-white font-medium"
            >
              {selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === filteredInvoices.length ? (
                <CheckSquare className="h-4 w-4 text-amber-400" />
              ) : (
                <Square className="h-4 w-4 text-slate-500" />
              )}
              <span>Select all visible pick orders ({filteredInvoices.length})</span>
            </button>

            {selectedInvoiceIds.size > 0 && (
              <span className="text-amber-400 font-mono font-bold">
                {selectedInvoiceIds.size} orders selected for batch picking
              </span>
            )}
          </div>
        )}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading picking queue...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">Picking Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No picking orders matched "${searchQuery}". Clear your search.`
              : 'All confirmed orders at this depot have been picked and forwarded to packing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredInvoices.map((invoice) => {
            const isSelected = selectedInvoiceIds.has(invoice.id);

            return (
              <div
                key={invoice.id}
                className={`bg-slate-900/70 rounded-3xl border p-5 sm:p-6 space-y-5 shadow-xl transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-1 ring-amber-500/50 bg-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelectInvoice(invoice.id)}
                      className="mt-1 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Select for batch picking"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-400">
                          #{invoice.invoiceNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300">
                          READY TO PICK
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {invoice.customerCompany}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Customer Contact: {invoice.customerName || 'N/A'} • Created: {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Pick Slip</span>
                    </button>
                  </div>
                </div>

                {/* Line Items to Pick */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Items to Retrieve from Depot Shelves ({invoice.items?.length || 0})
                  </div>

                  <div className="space-y-2">
                    {invoice.items?.map((item, idx) => {
                      const isItemChecked = pickedItems[`${invoice.id}-${item.id}`];

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItemPick(invoice.id, item.id)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isItemChecked
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                                isItemChecked
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-600 bg-slate-900'
                              }`}
                            >
                              {isItemChecked && <CheckCircle2 className="h-4 w-4" />}
                            </div>

                            <div>
                              <div className={`font-semibold ${isItemChecked ? 'text-emerald-200 line-through' : 'text-white'}`}>
                                {item.productName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                SKU: {item.productSku} • {item.brand}
                              </div>
                              {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.allocatedSerials.map((sn: string, sidx: number) => (
                                    <span
                                      key={sidx}
                                      className="px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300 font-mono text-[10px]"
                                    >
                                      SN: {sn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right font-mono font-bold text-white shrink-0 ml-3">
                            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Pick Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handlePickOrder(invoice)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-glow transition-all active:scale-98"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Confirm All Items Picked → Send to Packing</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Picking Action Bar */}
      {selectedInvoiceIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 sm:left-auto max-w-xl z-40 bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ring-1 ring-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold font-mono shadow-glow shrink-0">
              {selectedInvoiceIds.size}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {selectedInvoiceIds.size} Orders Selected for Batch Pick
              </div>
              <p className="text-[11px] text-slate-400">
                Confirm all items retrieved from shelves and forward directly to packing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedInvoiceIds(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Deselect All
            </button>
            <button
              onClick={handleBatchPickSelected}
              disabled={isBatchPicking}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-glow transition-all disabled:opacity-50"
            >
              {isBatchPicking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Batch Picking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pick All ({selectedInvoiceIds.size})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
