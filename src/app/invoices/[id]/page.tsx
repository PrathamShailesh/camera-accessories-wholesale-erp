'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Receipt,
  Printer,
  Building2,
  Boxes,
  Truck,
  CheckCircle2,
  Package,
  Barcode,
  FolderLock,
  UploadCloud,
  ExternalLink,
  CreditCard,
  X,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate } from '@/lib/utils';
import { TaxInvoice, Shipment, CloudDocument, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import CloudinaryUploadModal from '@/components/documents/CloudinaryUploadModal';
import { Button, LinkButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';

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
        <div className="text-slate-500 text-xs">Loading tax invoice document...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-sm font-semibold">Tax Invoice Not Found</div>
        <LinkButton href="/invoices" variant="outline" size="sm">
          Back to Invoices
        </LinkButton>
      </div>
    );
  }

  const isDepotUser = currentUser.role === 'DEPOT_USER';

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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Header Bar */}
      <PageHeader
        eyebrow="02 / SALES"
        breadcrumbs={[{ label: 'Tax Invoices', href: '/invoices' }, { label: invoice.invoiceNumber }]}
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="font-mono">{invoice.invoiceNumber}</span>
            <StatusBadge status={invoice.fulfilmentStatus} />
          </span>
        }
        description={
          <>
            Customer: <strong className="text-slate-800">{invoice.customerCompany || invoice.customerName}</strong> · Assigned Hub: <strong className="text-slate-800">{invoice.depotName || 'Depot'}</strong>
          </>
        }
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              iconLeft={<Printer className="h-3.5 w-3.5 text-slate-500" />}
              onClick={() => setIsPrintModalOpen(true)}
            >
              Print Invoice
            </Button>

            <Button
              size="sm"
              variant="outline"
              iconLeft={<UploadCloud className="h-3.5 w-3.5 text-indigo-600" />}
              onClick={() => setIsUploadModalOpen(true)}
            >
              Attach Document
            </Button>

            {invoice.fulfilmentStatus === 'READY_FOR_PACKING' && (
              <Button
                size="sm"
                loading={isPicking}
                iconLeft={<Boxes className="h-3.5 w-3.5" />}
                onClick={handlePickAll}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              >
                Confirm Picked
              </Button>
            )}

            {invoice.fulfilmentStatus === 'PROCESSING' && (
              <Button
                size="sm"
                loading={isPacking}
                iconLeft={<Package className="h-3.5 w-3.5" />}
                onClick={() => setIsPackingModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              >
                Pack Order
              </Button>
            )}

            {invoice.fulfilmentStatus === 'PACKED' && (
              <Button
                size="sm"
                loading={isShipping}
                iconLeft={<Truck className="h-3.5 w-3.5" />}
                onClick={() => setIsShippingModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Dispatch (AWB)
              </Button>
            )}
          </>
        }
      />

      {/* Financial Document View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Document Body */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tax Invoice Items ({invoice.items?.length || 0})
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-700">Currency: USD ($)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Item & SKU</th>
                    <th className="py-2.5 px-4">Serial Numbers</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    {!isDepotUser && <th className="py-2.5 px-4 text-right">Unit Price</th>}
                    {!isDepotUser && <th className="py-2.5 px-4 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          SKU: {item.productSku} · Brand: {item.brand}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.allocatedSerials && item.allocatedSerials.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.allocatedSerials.map((sn) => (
                              <span
                                key={sn}
                                className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Non-serialized</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      {!isDepotUser && (
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatUSD(item.unitPrice)}
                        </td>
                      )}
                      {!isDepotUser && (
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatUSD(item.totalPrice)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isDepotUser && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end space-y-1.5 text-xs font-mono">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="text-slate-900 font-medium">{formatUSD(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between w-64 text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatUSD(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-slate-600">
                  <span>VAT / Tax (5%):</span>
                  <span className="text-slate-900">{formatUSD(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Shipping Charges:</span>
                  <span className="text-slate-900">{formatUSD(invoice.shippingCost)}</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Grand Total (USD):</span>
                  <span className="text-indigo-600 font-bold">{formatUSD(invoice.grandTotal)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Documents Attachment Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cloudinary Documents ({documents.length})
              </h3>
              <button onClick={() => setIsUploadModalOpen(true)} className="text-xs text-indigo-600 font-medium hover:underline">
                + Upload Attachment
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic col-span-2">No documents attached yet.</p>
              ) : (
                documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-md border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">{doc.title}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.category}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </a>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Profile</h3>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{invoice.customerCompany || invoice.customerName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{invoice.customerName}</p>
              <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Shipping Address:</span>
                <span className="text-[11px] leading-relaxed text-slate-500">{invoice.shippingAddress}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fulfilment Depot Hub</h3>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{invoice.depotName || 'Central Depot'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Responsible for physical warehouse dispatch</p>
            </div>
          </Card>

          {shipment && (
            <Card className="p-5 space-y-3 border-indigo-200 bg-indigo-50/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Shipment Dispatched</span>
                <StatusBadge status={shipment.status} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                <div className="flex justify-between">
                  <span>Courier:</span>
                  <span className="font-semibold text-slate-900">{shipment.courier.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>AWB Number:</span>
                  <span className="font-bold text-indigo-600">{shipment.airwayBillNumber}</span>
                </div>
              </div>
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                Track Shipment <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {isPrintModalOpen && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          documentType="TAX_INVOICE"
          data={invoice}
        />
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Package & Box Specs</h3>
              <button onClick={() => setIsPackingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handlePackSubmit} className="flex flex-col gap-3 text-xs text-slate-700">
              <Input label="Packed By Operator" required value={packedBy} onChange={(e) => setPackedBy(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Box Count" type="number" min={1} value={boxCount} onChange={(e) => setBoxCount(Number(e.target.value))} />
                <Input label="Total Weight (kg)" type="number" step="0.1" value={totalWeight} onChange={(e) => setTotalWeight(Number(e.target.value))} />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsPackingModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isPacking}>Confirm Packing Complete</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {isShippingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Dispatch Order & Attach Airway Bill</h3>
              <button onClick={() => setIsShippingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleShipSubmit} className="flex flex-col gap-3 text-xs text-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier / Courier</label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value as Shipment['courier'])}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="DHL_EXPRESS">DHL Express Worldwide</option>
                  <option value="FEDEX_INTERNATIONAL">FedEx International Priority</option>
                  <option value="ARAMEX">Aramex Global Priority</option>
                  <option value="EMIRATES_SKYCARGO">Emirates SkyCargo Freight</option>
                </select>
              </div>
              <Input label="Airway Bill (AWB) Number *" required value={awbNumber} onChange={(e) => setAwbNumber(e.target.value)} />
              <Input label="Tracking URL (Optional)" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsShippingModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isShipping}>Dispatch Shipment</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
