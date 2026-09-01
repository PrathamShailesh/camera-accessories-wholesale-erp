'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  ExternalLink,
  Search,
  RefreshCw,
  Barcode,
  Package,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';
import { formatUSD, formatDate } from '@/lib/utils';

export default function DepotShipPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'READY_TO_SHIP' | 'DISPATCHED'>('ALL');

  // Input states per invoice
  const [awbInputs, setAwbInputs] = useState<Record<string, string>>({});
  const [courierInputs, setCourierInputs] = useState<Record<string, string>>({});
  const [isShipping, setIsShipping] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setIsLoading(true);
    let user: User | null = null;

    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) {
          user = userData.user;
          setCurrentUser(user);
        }
      }
    } catch {}

    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const allInvoices = await res.json();
        const filtered = allInvoices.filter((inv: any) => {
          const statusMatch = ['PACKED', 'SHIPPED', 'DELIVERED'].includes(inv.fulfilmentStatus);
          const depotMatch = !user?.assignedDepotId || inv.depotId === user.assignedDepotId;
          return statusMatch && depotMatch;
        });
        setInvoices(filtered);
      }
    } catch (e) {
      console.error('Error loading ship invoices:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const isPacked = inv.fulfilmentStatus === 'PACKED';
    const isDispatched = inv.fulfilmentStatus === 'SHIPPED' || inv.fulfilmentStatus === 'DELIVERED';

    if (filterType === 'READY_TO_SHIP' && !isPacked) return false;
    if (filterType === 'DISPATCHED' && !isDispatched) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchInv = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchCompany = inv.customerCompany?.toLowerCase().includes(q);
      const matchAwb = inv.shippingDetails?.airwayBillNumber?.toLowerCase().includes(q);
      const matchCourier = inv.shippingDetails?.courier?.toLowerCase().includes(q);
      const matchItem = inv.items?.some(
        (item: any) =>
          item.productName?.toLowerCase().includes(q) ||
          item.productSku?.toLowerCase().includes(q)
      );
      return matchInv || matchCompany || matchAwb || matchCourier || matchItem;
    }

    return true;
  });

  const handleQuickShip = async (inv: TaxInvoice) => {
    const awbNumber = awbInputs[inv.id] || '';
    if (!awbNumber.trim()) {
      alert('Please enter or generate an Airway Bill (AWB) number before dispatching');
      return;
    }

    const courier = courierInputs[inv.id] || 'DHL_EXPRESS';
    setIsShipping((prev) => ({ ...prev, [inv.id]: true }));

    try {
      const res = await fetch(`/api/invoices/${inv.id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier,
          airwayBillNumber: awbNumber.trim(),
          trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${awbNumber.replace(/[^0-9]/g, '')}`,
          weightKg: inv.packingDetails?.totalWeightKg || 5.0,
          packageCount: inv.packingDetails?.packageCount || 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAwbInputs((prev) => ({ ...prev, [inv.id]: '' }));
        // Update local invoice state
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id
              ? {
                  ...item,
                  fulfilmentStatus: 'SHIPPED',
                  shippingDetails: data.invoice?.shippingDetails || {
                    courier,
                    airwayBillNumber: awbNumber.trim(),
                  },
                }
              : item
          )
        );
      } else {
        const error = await res.json();
        alert(`Failed to create shipment: ${error.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Dispatch error: ${err.message}`);
    } finally {
      setIsShipping((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Quick auto-generate AWB helper for fast high-volume depot testing
  const generateAwb = (invoiceId: string, prefix = 'DHL') => {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    const generated = `${prefix}-${randomDigits}`;
    setAwbInputs((prev) => ({ ...prev, [invoiceId]: generated }));
  };

  const packedOrders = invoices.filter((i) => i.fulfilmentStatus === 'PACKED');
  const shippedOrders = invoices.filter(
    (i) => i.fulfilmentStatus === 'SHIPPED' || i.fulfilmentStatus === 'DELIVERED'
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Shipments & Courier Dispatch
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-cyan-400 border border-slate-700">
              {invoices.length} Shipments
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Depot dispatch bay: Assign Airway Bill (AWB) numbers, choose freight couriers, and generate live tracking links for handover.
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

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice #, Customer, AWB Tracking #, or Courier name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-none transition-colors"
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'ALL'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('READY_TO_SHIP')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'READY_TO_SHIP'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-brand-400 border border-slate-800'
              }`}
            >
              Ready to Ship ({packedOrders.length})
            </button>
            <button
              onClick={() => setFilterType('DISPATCHED')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === 'DISPATCHED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
              }`}
            >
              Dispatched ({shippedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs text-slate-400">Loading dispatch queue...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">No Shipments Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No shipments matched "${searchQuery}". Clear search to view all.`
              : 'There are no packed shipments ready for courier dispatch in this view.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredInvoices.map((invoice) => {
            const isPacked = invoice.fulfilmentStatus === 'PACKED';
            const isShipped =
              invoice.fulfilmentStatus === 'SHIPPED' || invoice.fulfilmentStatus === 'DELIVERED';
            const awbVal = awbInputs[invoice.id] ?? '';
            const courierVal = courierInputs[invoice.id] ?? 'DHL_EXPRESS';
            const inProgress = Boolean(isShipping[invoice.id]);

            return (
              <div
                key={invoice.id}
                className="bg-slate-900/70 rounded-3xl border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl transition-all"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cyan-400">
                        #{invoice.invoiceNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isShipped
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                        }`}
                      >
                        {isShipped ? 'DISPATCHED & IN TRANSIT' : 'PACKED & READY FOR AWB'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {invoice.customerCompany}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Destination: {invoice.shippingAddress || 'International Cargo Hub'} • Total: {formatUSD(invoice.grandTotal)}
                    </p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[11px]">Weight & Boxes</span>
                    <span className="text-white font-mono font-bold">
                      {invoice.packingDetails?.totalWeightKg || 4.5} KG ({invoice.packingDetails?.packageCount || 1} Box)
                    </span>
                  </div>
                </div>

                {/* Shipped Tracking Details if Dispatched */}
                {isShipped ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Courier Carrier:</span>
                      <span className="font-bold text-white font-mono">
                        {invoice.shippingDetails?.courier || 'DHL Express'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Airway Bill (AWB) #:</span>
                      <span className="font-bold text-cyan-400 font-mono text-sm">
                        {invoice.shippingDetails?.airwayBillNumber || 'N/A'}
                      </span>
                    </div>
                    {invoice.shippingDetails?.trackingUrl && (
                      <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                        <a
                          href={invoice.shippingDetails.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline font-mono"
                        >
                          <span>Track with Courier Carrier</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Courier & AWB Assignment Form for Ready to Ship */
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Freight Courier Carrier
                        </label>
                        <select
                          value={courierVal}
                          onChange={(e) =>
                            setCourierInputs((prev) => ({ ...prev, [invoice.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="DHL_EXPRESS">DHL Express Worldwide</option>
                          <option value="FEDEX_PRIORITY">FedEx International Priority</option>
                          <option value="ARAMEX">Aramex Global Express</option>
                          <option value="EMIRATES_SKYCARGO">Emirates SkyCargo (Air Freight)</option>
                          <option value="LOCAL_VAN_DISPATCH">Local Depot Van Delivery</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-medium text-slate-400">
                            Airway Bill (AWB) Number *
                          </label>
                          <button
                            type="button"
                            onClick={() => generateAwb(invoice.id, courierVal.split('_')[0])}
                            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                          >
                            Auto-Generate AWB
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. DHL-9842104820"
                          value={awbVal}
                          onChange={(e) =>
                            setAwbInputs((prev) => ({ ...prev, [invoice.id]: e.target.value }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleQuickShip(invoice)}
                        disabled={inProgress || !awbVal.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-glow transition-all disabled:opacity-50 active:scale-98"
                      >
                        {inProgress ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Processing Dispatch...</span>
                          </>
                        ) : (
                          <>
                            <Truck className="h-5 w-5" />
                            <span>Confirm Courier Handover & Dispatch AWB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
