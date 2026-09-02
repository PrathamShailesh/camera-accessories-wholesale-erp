'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  AlertTriangle,
} from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';
import { fetchCurrentUserCached, getCurrentUserCachedSync, fetchWithCache } from '@/lib/client-cache';
import { formatUSD, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

function DepotPickContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUserCachedSync()?.user || null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('invoiceId') || searchParams?.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);

  // Batch Multi-Select
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [isBatchPicking, setIsBatchPicking] = useState(false);
  const [pickingInFlight, setPickingInFlight] = useState<Record<string, boolean>>({});

  // Item-level check states (invoiceId-itemId -> boolean)
  const [pickedItems, setPickedItems] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    let user: User | null = currentUser;

    try {
      const userData = await fetchCurrentUserCached();
      if (userData?.authenticated && userData.user) {
        user = userData.user;
        setCurrentUser(user);
      }
    } catch {}

    try {
      const allInvoices = await fetchWithCache<TaxInvoice[]>('/api/invoices', undefined, 10000);
      if (Array.isArray(allInvoices)) {
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
      const matchId = inv.id.toLowerCase() === q;
      const matchInv = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchCompany = inv.customerCompany?.toLowerCase().includes(q);
      const matchItem = inv.items?.some(
        (item: any) =>
          item.productName?.toLowerCase().includes(q) ||
          item.productSku?.toLowerCase().includes(q) ||
          item.allocatedSerials?.some((s: string) => s.toLowerCase().includes(q))
      );
      return matchId || matchInv || matchCompany || matchItem;
    }
    return true;
  });

  // Single Order Pick Confirmation
  const handlePickOrder = async (inv: TaxInvoice) => {
    if (pickingInFlight[inv.id]) return;
    setPickingInFlight((prev) => ({ ...prev, [inv.id]: true }));

    const itemPicks = (inv.items || []).map((i) => ({ id: i.id, isPicked: true }));
    try {
      const res = await fetch(`/api/invoices/${inv.id}/pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemPicks }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvoices((items) => items.filter((i) => i.id !== inv.id));
        setSelectedInvoiceIds((prev) => {
          const next = new Set(prev);
          next.delete(inv.id);
          return next;
        });

        toast({
          title: 'Order Picked Successfully',
          description: `Invoice #${inv.invoiceNumber} has been moved to the Packing Workbench.`,
          variant: 'success',
        });
      } else {
        const err = await res.json();
        toast({
          title: 'Picking Error',
          description: err.error || 'Failed to complete picking',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message || 'Picking request failed',
        variant: 'error',
      });
    } finally {
      setPickingInFlight((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Batch Pick All Selected Orders at Once
  const handleBatchPickSelected = async () => {
    if (selectedInvoiceIds.size === 0) return;
    setIsBatchPicking(true);

    try {
      const selectedInvoices = invoices.filter((i) => selectedInvoiceIds.has(i.id));

      for (const inv of selectedInvoices) {
        const itemPicks = (inv.items || []).map((i) => ({ id: i.id, isPicked: true }));
        await fetch(`/api/invoices/${inv.id}/pick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemPicks }),
        });
      }

      setInvoices((items) => items.filter((i) => !selectedInvoiceIds.has(i.id)));
      setSelectedInvoiceIds(new Set());

      toast({
        title: 'Batch Pick Completed',
        description: `${selectedInvoices.length} orders picked and forwarded to packing bench.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Batch Pick Error',
        description: err.message || 'Some orders could not be picked',
        variant: 'error',
      });
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
            <Boxes className="h-6 w-6 text-[#B45309]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
              Warehouse Picking Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20 font-bold">
              {invoices.length} Pending
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
            Depot picking station: Locate items on shelves, scan serial numbers, and verify stock before moving to packing workbench.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827] text-xs hover:bg-[#F8FAFC] self-start sm:self-auto transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Search & Batch Select Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by Invoice #, Customer Name, SKU code, or Serial Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-[#111827] placeholder-[#9CA3AF] text-xs focus:border-[#005E82] focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs font-mono text-[#6B7280] self-end sm:self-auto">
            {filteredInvoices.length} matching orders
          </div>
        </div>

        {/* Select All Toggle */}
        {filteredInvoices.length > 0 && (
          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[#4B5563] hover:text-[#111827] font-medium"
            >
              {selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === filteredInvoices.length ? (
                <CheckSquare className="h-4 w-4 text-[#B45309]" />
              ) : (
                <Square className="h-4 w-4 text-[#9CA3AF]" />
              )}
              <span>Select all visible pick orders ({filteredInvoices.length})</span>
            </button>

            {selectedInvoiceIds.size > 0 && (
              <span className="text-[#B45309] font-mono font-bold">
                {selectedInvoiceIds.size} orders selected for batch picking
              </span>
            )}
          </div>
        )}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E7EB] space-y-3 shadow-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-[#005E82] mx-auto" />
          <p className="text-xs text-[#6B7280]">Loading picking queue...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5E7EB] space-y-3 shadow-xs">
          <CheckCircle2 className="h-12 w-12 text-[#15803D] mx-auto opacity-80" />
          <h3 className="text-base font-bold text-[#111827]">Picking Queue Clear</h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
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
                className={`bg-white rounded-3xl border p-5 sm:p-6 space-y-5 shadow-xs transition-all ${
                  isSelected
                    ? 'border-[#B45309] ring-1 ring-[#B45309]/40 bg-[#B45309]/5'
                    : 'border-[#E5E7EB] hover:border-[#005E82]/30 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSelectInvoice(invoice.id)}
                      className="mt-1 p-1 rounded-lg hover:bg-[#F8FAFC] text-[#9CA3AF] hover:text-[#111827] transition-colors"
                      title="Select for batch picking"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-[#B45309]" />
                      ) : (
                        <Square className="h-5 w-5 text-[#9CA3AF]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#005E82]">
                          #{invoice.invoiceNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/20">
                          READY TO PICK
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#111827] mt-1">
                        {invoice.customerCompany}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        Customer Contact: {invoice.customerName || 'N/A'} • Created: {formatDate(invoice.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563] hover:text-[#111827] text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Pick Slip</span>
                    </button>
                  </div>
                </div>

                {/* Line Items to Pick */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-mono">
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
                              ? 'bg-[#15803D]/10 border-[#15803D]/30 text-[#15803D]'
                              : 'bg-[#F8FAFC] border-[#E5E7EB] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                                isItemChecked
                                  ? 'bg-[#15803D] border-[#15803D] text-white'
                                  : 'border-[#D1D5DB] bg-white'
                              }`}
                            >
                              {isItemChecked && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>

                            <div>
                              <div className={`font-semibold ${isItemChecked ? 'text-[#15803D] line-through' : 'text-[#111827]'}`}>
                                {item.productName}
                              </div>
                              <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                                SKU: {item.productSku} • {item.brand}
                              </div>
                              {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.allocatedSerials.map((sn: string, sidx: number) => (
                                    <span
                                      key={sidx}
                                      className="px-1.5 py-0.5 rounded bg-[#005E82]/10 border border-[#005E82]/20 text-[#005E82] font-mono text-[10px]"
                                    >
                                      SN: {sn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right font-mono font-bold shrink-0 ml-3">
                            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] shadow-xs">
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
                    disabled={Boolean(pickingInFlight[invoice.id])}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#005E82] hover:bg-[#004B68] text-white text-sm font-bold shadow-xs transition-all disabled:opacity-50 active:scale-98"
                  >
                    {pickingInFlight[invoice.id] ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin text-white" />
                        <span>Confirming Picking...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Confirm All Items Picked → Send to Packing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Batch Picking Action Bar */}
      {selectedInvoiceIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 sm:left-auto max-w-xl z-40 bg-white/95 backdrop-blur-xl border border-[#E5E7EB] p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ring-1 ring-[#005E82]/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#005E82] text-white flex items-center justify-center font-bold font-mono shadow-xs shrink-0">
              {selectedInvoiceIds.size}
            </div>
            <div>
              <div className="text-xs font-bold text-[#111827]">
                {selectedInvoiceIds.size} Orders Selected for Batch Pick
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Confirm all items retrieved from shelves and forward directly to packing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setSelectedInvoiceIds(new Set())}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
            >
              Deselect All
            </button>
            <button
              onClick={handleBatchPickSelected}
              disabled={isBatchPicking}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#005E82] hover:bg-[#004B68] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
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

export default function DepotPickPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB]">
          <RefreshCw className="h-6 w-6 animate-spin text-[#005E82] mx-auto" />
          <p className="text-xs text-[#6B7280] mt-2">Loading picking queue...</p>
        </div>
      }
    >
      <DepotPickContent />
    </Suspense>
  );
}
