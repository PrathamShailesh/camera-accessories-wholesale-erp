'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  ArrowLeft,
  Printer,
  Building2,
  Boxes,
  Truck,
  CheckCircle2,
  Package,
  Barcode,
  Sparkles,
  Camera,
  FolderLock,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { TaxInvoice, Shipment, CloudDocument, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [isPacking, setIsPacking] = useState(false);
  const [isShipping, setIsShipping] = useState(false);

  // Packing modal fields
  const [packedBy, setPackedBy] = useState('');
  const [boxCount, setBoxCount] = useState(1);
  const [totalWeight, setTotalWeight] = useState(6.5);
  const [lengthCm, setLengthCm] = useState(45);
  const [widthCm, setWidthCm] = useState(35);
  const [heightCm, setHeightCm] = useState(25);
  const [packagePhotoUrl, setPackagePhotoUrl] = useState('');

  // Shipping modal fields
  const [courier, setCourier] = useState<Shipment['courier']>('DHL_EXPRESS');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shippingCost, setShippingCost] = useState(180);
  const [awbDocUrl, setAwbDocUrl] = useState('');

  const loadData = async () => {
    try {
      const user = dataStore.getCurrentUser();
      setCurrentUser(user);

      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const inv = await res.json();
        setInvoice(inv);
        if (inv.shipment || inv.shipmentId) {
          setShipment(inv.shipment || dataStore.getShipmentById(inv.shipmentId));
        }
        const docs = dataStore.getDocuments({ entityId: inv.id });
        setDocuments(docs);
        if (!packedBy) setPackedBy(user.name);
        if (!awbNumber) setAwbNumber(`DHL-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      } else {
        const fallbackInv = dataStore.getInvoiceById(id);
        if (fallbackInv) {
          setInvoice(fallbackInv);
          if (fallbackInv.shipmentId) {
            const shp = dataStore.getShipmentById(fallbackInv.shipmentId);
            if (shp) setShipment(shp);
          }
          setDocuments(dataStore.getDocuments({ entityId: fallbackInv.id }));
        } else {
          setInvoice(null);
        }
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      const fallbackInv = dataStore.getInvoiceById(id);
      setInvoice(fallbackInv || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Loading invoice details...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Invoice not found</div>
        <Link href="/invoices" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const isDepotUser = currentUser.role === 'DEPOT_USER';
  const badge = getStatusBadgeClasses(invoice.fulfilmentStatus);

  const handlePickAll = async () => {
    setIsPicking(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfilmentStatus: 'PROCESSING' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    } catch (e) {
      console.warn('Pick status update error:', e);
    }
    try {
      const itemIds = invoice.items?.map((i) => i.id) || [];
      dataStore.pickInvoiceItems(invoice.id, itemIds);
    } catch {}
    setIsPicking(false);
    loadData();
  };

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPacking(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfilmentStatus: 'PACKED',
          packedBy,
          packageCount: Number(boxCount),
          totalWeightKg: Number(totalWeight),
          lengthCm: Number(lengthCm),
          widthCm: Number(widthCm),
          heightCm: Number(heightCm),
          packagePhotoUrl,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    } catch (e) {
      console.warn('Pack status update error:', e);
    }
    try {
      dataStore.packInvoice(invoice.id);
    } catch {}
    setIsPacking(false);
    setIsPackingModalOpen(false);
    loadData();
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsShipping(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfilmentStatus: 'SHIPPED',
          courier,
          airwayBillNumber: awbNumber,
          trackingUrl,
          shippingCost: Number(shippingCost),
          weightKg: Number(totalWeight),
          packageCount: Number(boxCount),
          awbDocumentUrl: awbDocUrl,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice((prev) => (prev ? { ...prev, ...updated } : updated));
      }
    } catch (e) {
      console.warn('Ship status update error:', e);
    }
    try {
      dataStore.dispatchShipment(invoice.id);
    } catch {}
    setIsShipping(false);
    setIsShippingModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {(invoice.fulfilmentStatus || 'READY_FOR_PACKING').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: <strong className="text-slate-200">{invoice.customerCompany || invoice.customerName}</strong> • Assigned to: <strong className="text-brand-400">{invoice.depotName || 'Depot'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print PDF */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </button>

          {/* Cloud Upload to this invoice */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <UploadCloud className="h-4 w-4 text-cyan-400" />
            <span>Attach Doc</span>
          </button>

          {/* Fulfilment Workflow Trigger: Pick -> Pack -> Ship */}
          {invoice.fulfilmentStatus === 'READY_FOR_PACKING' && (
            <button
              onClick={handlePickAll}
              disabled={isPicking}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-glow-amber transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Boxes className="h-4 w-4" />
              <span>{isPicking ? 'Picking...' : 'Confirm Items Picked'}</span>
            </button>
          )}

          {invoice.fulfilmentStatus === 'PROCESSING' && (
            <button
              onClick={() => setIsPackingModalOpen(true)}
              disabled={isPacking}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-glow-amber transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="h-4 w-4" />
              <span>{isPacking ? 'Packing...' : 'Pack Order & Take Inspection Photo'}</span>
            </button>
          )}

          {invoice.fulfilmentStatus === 'PACKED' && (
            <button
              onClick={() => setIsShippingModalOpen(true)}
              disabled={isShipping}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow transition-all animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Truck className="h-4 w-4" />
              <span>{isShipping ? 'Dispatching...' : 'Dispatch & Enter Airway Bill (AWB)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Fulfilment Progression Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <div className="font-bold">1. Invoice Generated</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(invoice.issueDate)}</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(invoice.fulfilmentStatus)
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
            }`}
          >
            <div className="font-bold">2. Depot Picked</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Serials Verified</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['PACKED', 'SHIPPED', 'DELIVERED'].includes(invoice.fulfilmentStatus)
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">3. Packed & Weighed</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Box Inspection</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['SHIPPED', 'DELIVERED'].includes(invoice.fulfilmentStatus)
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">4. Dispatched (AWB)</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {shipment?.airwayBillNumber || 'Pending Courier'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Invoiced Items & Serials */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="h-4 w-4 text-brand-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Line Items & Allocated Serial Numbers
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{(invoice.items || []).length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Item & SKU</th>
                    <th>Serials / Tracking</th>
                    <th className="text-right">Qty</th>
                    {!isDepotUser && <th className="text-right">Unit Price</th>}
                    {!isDepotUser && <th className="text-right">Total (USD)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-semibold text-white text-xs">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          SKU: {item.productSku} • Brand: {item.brand}
                        </div>
                      </td>
                      <td>
                        {item.allocatedSerials && item.allocatedSerials.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.allocatedSerials.map((sn) => (
                              <span
                                key={sn}
                                className="px-1.5 py-0.5 rounded bg-brand-500/10 border border-brand-500/30 text-brand-300 font-mono text-[10px] font-bold"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono italic">
                            Non-serialized accessory
                          </span>
                        )}
                      </td>
                      <td className="text-right font-mono font-bold text-xs text-white">
                        {item.quantity}
                      </td>
                      {!isDepotUser && (
                        <td className="text-right font-mono text-xs text-slate-300">
                          {formatUSD(item.unitPrice)}
                        </td>
                      )}
                      {!isDepotUser && (
                        <td className="text-right font-mono font-bold text-xs text-white">
                          {formatUSD(item.totalPrice)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            {!isDepotUser && (
              <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex flex-col items-end space-y-2 text-xs font-mono">
                <div className="flex justify-between w-64 text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-white font-bold">{formatUSD(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between w-64 text-emerald-400">
                    <span>Discount:</span>
                    <span>-{formatUSD(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-slate-400">
                  <span>VAT / Tax (5%):</span>
                  <span className="text-white">{formatUSD(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-400">
                  <span>Shipping Charges:</span>
                  <span className="text-white">{formatUSD(invoice.shippingCost)}</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t border-slate-800 text-sm font-black text-emerald-400">
                  <span>Grand Total:</span>
                  <span>{formatUSD(invoice.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Attached Documents in Cloudinary */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Cloudinary Attached Documents ({documents.length})
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Add Attachment
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic col-span-2">
                  No documents attached yet. Click &apos;Attach Doc&apos; to upload AWB or package photo.
                </p>
              ) : (
                documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 line-clamp-1">
                        {doc.title}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{doc.category}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer & Depot Logistics Info */}
        <div className="space-y-6">
          {/* Customer profile */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Consignee / Customer
            </h3>
            <div>
              <h4 className="text-sm font-bold text-white">{invoice.customerCompany}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{invoice.customerName}</p>
              <p className="text-xs text-slate-400">{invoice.customerEmail}</p>
              {invoice.customerPhone && <p className="text-xs text-slate-400">{invoice.customerPhone}</p>}
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Shipping Address:</span>
                <span className="text-[11px] leading-relaxed">{invoice.shippingAddress}</span>
              </div>
            </div>
          </div>

          {/* Assigned Depot */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              <Building2 className="h-4 w-4 text-brand-400" />
              <span>Fulfilment Depot Location</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{invoice.depotName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Responsible for picking, package inspection, and courier handover.
              </p>
            </div>
          </div>

          {/* Active Shipment Details if Dispatched */}
          {shipment && (
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase font-mono">
                  <Truck className="h-4 w-4" />
                  <span>Shipment Dispatched</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                  {shipment.courier.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>AWB Number:</span>
                  <span className="text-white font-bold">{shipment.airwayBillNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Weight:</span>
                  <span className="text-white">{shipment.weightKg} kg ({shipment.packageCount} boxes)</span>
                </div>
              </div>

              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow"
              >
                <span>Track on Carrier Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Printable Modal */}
      {isPrintModalOpen && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          documentType="TAX_INVOICE"
          data={invoice}
        />
      )}

      {/* Cloudinary Upload Modal */}
      {isUploadModalOpen && (
        <CloudinaryUploadModal
          isOpen={true}
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={() => loadData()}
          defaultEntityType="INVOICE"
          defaultEntityId={invoice.id}
          defaultEntityLabel={invoice.invoiceNumber}
        />
      )}

      {/* Packing Modal */}
      {isPackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Record Package & Box Specs</h3>
              </div>
              <button
                onClick={() => setIsPackingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePackSubmit} className="flex flex-col gap-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Packed By Operator</label>
                <input
                  type="text"
                  required
                  value={packedBy}
                  onChange={(e) => setPackedBy(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Box Count</label>
                  <input
                    type="number"
                    min={1}
                    value={boxCount}
                    onChange={(e) => setBoxCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Total Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dimensions (L × W × H cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="L"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white font-mono text-center"
                  />
                  <input
                    type="number"
                    placeholder="W"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white font-mono text-center"
                  />
                  <input
                    type="number"
                    placeholder="H"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Package Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://res.cloudinary.com/camera-erp-dev2/..."
                  value={packagePhotoUrl}
                  onChange={(e) => setPackagePhotoUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPackingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-glow-amber"
                >
                  Confirm Packing Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping / AWB Modal */}
      {isShippingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Dispatch Order & Attach Airway Bill</h3>
              </div>
              <button
                onClick={() => setIsShippingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleShipSubmit} className="flex flex-col gap-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-400 mb-1">Carrier / Courier Service</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value as Shipment['courier'])}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                >
                  <option value="DHL_EXPRESS">DHL Express Worldwide</option>
                  <option value="FEDEX_INTERNATIONAL">FedEx International Priority</option>
                  <option value="ARAMEX">Aramex Global Priority</option>
                  <option value="EMIRATES_SKYCARGO">Emirates SkyCargo Freight</option>
                  <option value="UPS">UPS Worldwide Express</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Airway Bill (AWB) Number</label>
                <input
                  type="text"
                  required
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="e.g. DHL-9482103847"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tracking URL (Optional)</label>
                <input
                  type="text"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.dhl.com/tracking..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Airway Bill Document / PDF URL</label>
                <input
                  type="text"
                  value={awbDocUrl}
                  onChange={(e) => setAwbDocUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/camera-erp-dev2/..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsShippingModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-glow"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
