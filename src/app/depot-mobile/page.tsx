'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Boxes,
  Package,
  Truck,
  CheckCircle2,
  Camera,
  UploadCloud,
  ExternalLink,
  ChevronRight,
  Barcode,
  Search,
  Building2,
  AlertCircle,
  Clock,
  Printer,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatDate, formatUSD } from '@/lib/utils';
import { TaxInvoice, User, Depot } from '@/types/erp';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';

export default function DepotMobilePage() {
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [activeTab, setActiveTab] = useState<'READY' | 'PACKING' | 'DISPATCH'>('READY');
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [isCameraUploadOpen, setIsCameraUploadOpen] = useState(false);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [awbInput, setAwbInput] = useState('');
  const [courierInput, setCourierInput] = useState('DHL_EXPRESS');

  const loadData = async () => {
    let user = dataStore.getCurrentUser();

    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) {
          user = userData.user;
          setCurrentUser(user);
        }
      } else if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('erp_current_user');
        if (storedUser) {
          user = JSON.parse(storedUser);
          setCurrentUser(user);
        }
      }
    } catch {}

    const allDepots = dataStore.getDepots();
    setDepots(allDepots);

    const activeDepot = selectedDepotId || user.assignedDepotId || allDepots[0]?.id || 'dep-dxb';
    if (!selectedDepotId) {
      setSelectedDepotId(activeDepot);
    }

    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const allInvoices = await res.json();
        const filtered = allInvoices.filter((inv: any) => !activeDepot || inv.depotId === activeDepot);
        setInvoices(filtered);
      } else {
        setInvoices(dataStore.getInvoices(activeDepot));
      }
    } catch {
      setInvoices(dataStore.getInvoices(activeDepot));
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepotId]);

  const activeDepotObj = depots.find((d) => d.id === selectedDepotId);

  // Categorize queues
  const readyToPick = invoices.filter((i) => i.fulfilmentStatus === 'READY_FOR_PACKING');
  const inPacking = invoices.filter((i) => i.fulfilmentStatus === 'PROCESSING' || i.fulfilmentStatus === 'PACKED');
  const dispatched = invoices.filter((i) => i.fulfilmentStatus === 'SHIPPED' || i.fulfilmentStatus === 'DELIVERED');

  const handlePickOrder = (inv: TaxInvoice) => {
    const picks = inv.items.map((i) => ({ itemId: i.id, serials: i.allocatedSerials }));
    dataStore.pickInvoiceItems(inv.id, picks);
    loadData();
  };

  const handlePackOrder = (inv: TaxInvoice) => {
    dataStore.packInvoice(inv.id, {
      packedBy: currentUser.name,
      packageCount: 1,
      totalWeightKg: 6.8,
      dimensionsCm: { length: 45, width: 35, height: 25 },
      packagePhotoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
    });
    loadData();
  };

  const handleQuickShip = (inv: TaxInvoice) => {
    const awb = awbInput || `DHL-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    dataStore.dispatchShipment(inv.id, {
      courier: courierInput as any,
      airwayBillNumber: awb,
      trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${awb.replace(/[^0-9]/g, '')}`,
      shippingCost: 180,
      weightKg: 6.8,
      packageCount: 1,
      airwayBillDocUrl: 'https://res.cloudinary.com/camera-erp-dev2/image/upload/v1724500000/documents/sample_awb_dhl.png',
    });
    setAwbInput('');
    loadData();
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20 max-w-3xl mx-auto">
      {/* Mobile Header */}
      <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 shadow-glow-emerald flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                Depot Fulfilment App
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-base font-bold text-white leading-tight">
              {activeDepotObj?.name || 'Warehouse Operations'}
            </h1>
          </div>
        </div>

        {/* Depot Switcher if Admin/Manager */}
        {currentUser.role !== 'DEPOT_USER' && (
          <select
            value={selectedDepotId}
            onChange={(e) => setSelectedDepotId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            {depots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name.split(' ')[0]} Hub
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Touch-Friendly Workflow Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('READY')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'READY'
              ? 'bg-amber-600 text-white shadow-glow-amber'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Boxes className="h-4 w-4" />
            <span>1. Pick Items</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">{readyToPick.length} pending</span>
        </button>

        <button
          onClick={() => setActiveTab('PACKING')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'PACKING'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span>2. Pack & Photo</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">{inPacking.length} in queue</span>
        </button>

        <button
          onClick={() => setActiveTab('DISPATCH')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
            activeTab === 'DISPATCH'
              ? 'bg-cyan-600 text-white shadow-glow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            <span>3. Dispatched</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">{dispatched.length} shipped</span>
        </button>
      </div>

      {/* Queue 1: Ready to Pick */}
      {activeTab === 'READY' && (
        <div className="space-y-3">
          {readyToPick.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <span>No pending orders waiting to be picked at this depot.</span>
            </div>
          ) : (
            readyToPick.map((inv) => (
              <div
                key={inv.id}
                className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      NEW ORDER • READY TO PICK
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{inv.customerCompany}</h3>
                    <p className="text-xs font-mono text-slate-400">Invoice: {inv.invoiceNumber}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setIsSlipOpen(true);
                    }}
                    title="Print Pick List"
                    className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>

                {/* Items to Pick */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">
                    Items & Serial Allocations:
                  </div>
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0">
                      <div>
                        <span className="font-semibold text-white">{item.productName}</span>
                        {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                          <div className="text-[10px] font-mono text-brand-400 mt-0.5">
                            Allocate Serials: {item.allocatedSerials.join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handlePickOrder(inv)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-glow-amber transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Pick & Move to Packing</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue 2: Packing & Camera Inspection */}
      {activeTab === 'PACKING' && (
        <div className="space-y-3">
          {inPacking.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-xs">
              <span>No orders currently on the packing tables.</span>
            </div>
          ) : (
            inPacking.map((inv) => (
              <div
                key={inv.id}
                className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {inv.fulfilmentStatus === 'PACKED' ? 'PACKED • READY FOR AWB' : 'PACKING IN PROGRESS'}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{inv.customerCompany}</h3>
                    <p className="text-xs font-mono text-slate-400">Invoice: {inv.invoiceNumber}</p>
                  </div>
                </div>

                {/* Direct Action Bar */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Box Photo Inspection:</span>
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsCameraUploadOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-[11px]"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Take Photo / Upload</span>
                    </button>
                  </div>

                  {inv.fulfilmentStatus !== 'PACKED' ? (
                    <button
                      onClick={() => handlePackOrder(inv)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-glow text-xs"
                    >
                      <Package className="h-4 w-4" />
                      <span>Mark Packed & Verified</span>
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="block text-[11px] font-medium text-slate-300">
                        Quick Airway Bill Dispatch:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. DHL-9482103847"
                          value={awbInput}
                          onChange={(e) => setAwbInput(e.target.value)}
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => handleQuickShip(inv)}
                          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-glow whitespace-nowrap"
                        >
                          Ship AWB
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queue 3: Dispatched & In Transit */}
      {activeTab === 'DISPATCH' && (
        <div className="space-y-3">
          {dispatched.map((inv) => (
            <div
              key={inv.id}
              className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white">{inv.customerCompany}</h4>
                  <p className="font-mono text-slate-400 text-[11px]">Invoice: {inv.invoiceNumber}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {inv.fulfilmentStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{inv.shippingAddress}</p>
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                >
                  <span>View Shipment Tracking</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera / Document Modal */}
      {isCameraUploadOpen && selectedInvoice && (
        <CloudinaryUploadModal
          isOpen={true}
          onClose={() => setIsCameraUploadOpen(false)}
          onUploaded={() => loadData()}
          defaultCategory="PACKING_LIST"
          defaultEntityType="INVOICE"
          defaultEntityId={selectedInvoice.id}
          defaultEntityLabel={selectedInvoice.invoiceNumber}
        />
      )}

      {/* Pick List Modal */}
      {isSlipOpen && selectedInvoice && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setIsSlipOpen(false)}
          documentType="PACKING_LIST"
          data={selectedInvoice}
        />
      )}
    </div>
  );
}
