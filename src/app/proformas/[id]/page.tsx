'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck2,
  ArrowLeft,
  Printer,
  Mail,
  CheckCircle2,
  Receipt,
  Building2,
  Send,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  FileText,
  Zap,
  Download,
  Truck,
  Check,
} from 'lucide-react';
const fireConfetti = (opts: Record<string, unknown>) => {
  import('canvas-confetti').then((m) => m.default(opts as any)).catch(() => {});
};
import { formatUSD, formatDate } from '@/lib/utils';
import { Proforma, Depot } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { Button, LinkButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function ProformaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<{ id: string; number: string } | null>(null);

  const prevStatusRef = useRef<string | null>(null);

  const loadData = async (silent = false) => {
    try {
      const res = await fetch(`/api/proformas/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        if (!silent) setProforma(null);
        return;
      }
      const data = await res.json();

      if (prevStatusRef.current && prevStatusRef.current !== data.status) {
        if (data.status === 'CONFIRMED') {
          fireConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#10b981', '#3b82f6', '#f59e0b'],
          });
          setLiveNotification('🎉 Live Update: Customer confirmed and accepted this quotation!');
        } else if (data.status === 'CONVERTED') {
          setLiveNotification('✅ Live Update: Quotation converted to Tax Invoice.');
        } else {
          setLiveNotification(`⚡ Live Update: Status changed to ${data.status}`);
        }
      }
      prevStatusRef.current = data.status;

      setProforma(data);

      const depsRes = await fetch('/api/depots');
      if (depsRes.ok) {
        const allDepots = await depsRes.json();
        setDepots(allDepots);
        if (!selectedDepotId) {
          setSelectedDepotId(data.items[0]?.selectedDepotId || allDepots[0]?.id || 'dep-dxb');
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading proforma:', error);
        setProforma(null);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?id=${id}`);
      eventSource.onopen = () => setIsLiveConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'PROFORMA_UPDATED' || payload.type === 'PROFORMA_CONFIRMED') {
            if (payload.id === id || payload.proformaNumber === id || !payload.id) {
              loadData(true);
            }
          }
        } catch {}
      };
      eventSource.onerror = () => setIsLiveConnected(false);
    } catch {}

    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', onFocus);
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-xs">Loading proforma document...</div>
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-sm font-semibold">Proforma Quotation Not Found</div>
        <LinkButton href="/proformas" variant="outline" size="sm">
          Back to Proformas
        </LinkButton>
      </div>
    );
  }

  const handleStatusChange = async (status: Proforma['status']) => {
    try {
      const res = await fetch(`/api/proformas/${proforma.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProforma(updated);
        prevStatusRef.current = updated.status;
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/proformas/${proforma.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depotId: selectedDepotId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Conversion failed');
      }

      const newInvoice = await res.json();

      fireConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#059669', '#0284c7', '#d97706'],
      });

      setGeneratedInvoice({ id: newInvoice.id, number: newInvoice.invoiceNumber });
      setConversionSuccess(true);
      setIsConverting(false);
      loadData(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed');
      setIsConverting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!proforma) return;
    try {
      setIsSendingEmail(true);
      setErrorMessage('');
      const res = await fetch('/api/emails/send-proforma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proformaNumber: proforma.proformaNumber,
          proformaId: proforma.id,
          customerEmail: proforma.customerEmail,
          customerName: proforma.customerName,
          grandTotal: formatUSD(proforma.grandTotal),
          appUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.proforma) {
          setProforma((prev) => (prev ? { ...prev, status: 'SENT' } : prev));
        }
        await loadData(true);
        setEmailSentSuccess(true);
        setTimeout(() => {
          setEmailSentSuccess(false);
          setIsEmailModalOpen(false);
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(errorData?.error || 'Failed to send email. Check settings.');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to send email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Live Notification Banner */}
      {liveNotification && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>{liveNotification}</span>
          </div>
          <button onClick={() => setLiveNotification(null)} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/proformas"
            className="p-2 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {proforma.proformaNumber}
              </h1>
              <StatusBadge status={proforma.status} />
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong className="text-slate-800">{proforma.customerCompany}</strong> · Created: {formatDate(proforma.issueDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            iconLeft={<Printer className="h-3.5 w-3.5 text-slate-500" />}
            onClick={() => setIsPrintModalOpen(true)}
          >
            Print PDF
          </Button>

          <LinkButton
            href={`/quote/${proforma.id}`}
            target="_blank"
            variant="outline"
            size="sm"
            iconLeft={<ExternalLink className="h-3.5 w-3.5 text-indigo-600" />}
          >
            Customer Portal
          </LinkButton>

          {proforma.status !== 'CONVERTED' && (
            <Button
              size="sm"
              variant="outline"
              iconLeft={<Mail className="h-3.5 w-3.5 text-indigo-600" />}
              onClick={() => setIsEmailModalOpen(true)}
            >
              Email Quote
            </Button>
          )}

          {proforma.status === 'SENT' && (
            <Button
              size="sm"
              iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleStatusChange('CONFIRMED')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Mark Confirmed
            </Button>
          )}

          {/* Primary Convert to Tax Invoice Action */}
          {proforma.status === 'CONFIRMED' && (
            <Button
              size="sm"
              iconLeft={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => setIsConvertModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
            >
              Convert to Tax Invoice
            </Button>
          )}

          {proforma.status === 'CONVERTED' && proforma.convertedToInvoiceId && (
            <LinkButton
              href={`/invoices/${proforma.convertedToInvoiceId}`}
              size="sm"
              iconLeft={<Receipt className="h-3.5 w-3.5" />}
              className="bg-emerald-600 text-white font-semibold text-xs"
            >
              View Tax Invoice #{proforma.convertedToInvoiceNumber}
            </LinkButton>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Document Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quotation Line Items ({proforma.items?.length || 0})
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-700">Currency: USD ($)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Equipment / Model</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Discount</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proforma.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          SKU: {item.productSku} · Brand: {item.brand}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {formatUSD(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatUSD(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col items-end space-y-1.5 text-xs font-mono">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Subtotal:</span>
                <span className="text-slate-900 font-medium">{formatUSD(proforma.subtotal)}</span>
              </div>
              {proforma.discountAmount > 0 && (
                <div className="flex justify-between w-64 text-rose-600">
                  <span>Special Discount:</span>
                  <span>-{formatUSD(proforma.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-64 text-slate-600">
                <span>VAT / Tax (5%):</span>
                <span className="text-slate-900">{formatUSD(proforma.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>Shipping Charges:</span>
                <span className="text-slate-900">{formatUSD(proforma.shippingCost)}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Grand Total (USD):</span>
                <span className="text-indigo-600 font-bold">{formatUSD(proforma.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Prompt Section 15: Converted State Banner */}
          {proforma.status === 'CONVERTED' && (
            <Card className="p-5 bg-emerald-50/50 border-emerald-200 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-900">Tax Invoice Created</h3>
              </div>
              <p className="text-xs text-emerald-700">
                Converted to Tax Invoice <strong className="font-mono">{proforma.convertedToInvoiceNumber}</strong> and moved into depot fulfilment queue.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {proforma.convertedToInvoiceId && (
                  <LinkButton href={`/invoices/${proforma.convertedToInvoiceId}`} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs">
                    View Invoice
                  </LinkButton>
                )}
                <Button size="sm" variant="outline" iconLeft={<Printer className="h-3.5 w-3.5" />} onClick={() => setIsPrintModalOpen(true)}>
                  Download PDF
                </Button>
                <LinkButton href="/depot" size="sm" variant="secondary" iconLeft={<Truck className="h-3.5 w-3.5" />}>
                  Go to Depot Fulfilment
                </LinkButton>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Customer & Terms */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Details</h3>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{proforma.customerCompany}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{proforma.customerName}</p>
              <p className="text-xs text-slate-500">{proforma.customerEmail}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Billing Address:</span>
                <span className="text-[11px] leading-relaxed text-slate-500">{proforma.billingAddress}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Shipping Address:</span>
                <span className="text-[11px] leading-relaxed text-slate-500">{proforma.shippingAddress}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Commercial Terms</h3>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Payment Terms:</span>
                <span className="text-slate-900 font-medium">{proforma.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Terms:</span>
                <span className="text-slate-900 font-medium">{proforma.deliveryTerms}</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry Date:</span>
                <span className="text-slate-900 font-mono">{formatDate(proforma.expiryDate)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Section 15: Tax Invoice Conversion Confirmation Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl p-7 space-y-5">
            {!conversionSuccess && (
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary mb-1.5">
                    {proforma.proformaNumber}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900">Convert to Tax Invoice</h3>
                </div>
                <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-slate-600 mt-1">
                  ✕
                </button>
              </div>
            )}

            {conversionSuccess ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600 mt-1">
                    Tax Invoice Created
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono">
                    {generatedInvoice?.number}
                  </div>
                  <p className="text-sm text-slate-500 max-w-xs">
                    The order has been placed into the physical depot fulfilment workflow.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-slate-100">
                  <LinkButton href={`/invoices/${generatedInvoice?.id}`} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                    View Invoice
                  </LinkButton>
                  <Button size="sm" variant="outline" iconLeft={<Printer className="h-3.5 w-3.5" />} onClick={() => setIsPrintModalOpen(true)}>
                    Download PDF
                  </Button>
                  <LinkButton href="/depot" size="sm" variant="secondary">
                    Go to Depot
                  </LinkButton>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-sm text-slate-700">
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
                  <div className="flex justify-between px-3.5 py-2.5">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-semibold text-slate-900">{proforma.customerCompany}</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2.5">
                    <span className="text-slate-500">Products</span>
                    <span className="text-slate-900">{proforma.items?.length || 0} line items</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2.5">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-900">{formatUSD(proforma.subtotal)}</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2.5">
                    <span className="text-slate-500">Tax</span>
                    <span className="text-slate-900">{formatUSD(proforma.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2.5 bg-slate-50 rounded-b-lg">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-bold text-indigo-600">{formatUSD(proforma.grandTotal)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs leading-relaxed">
                  This will create a Tax Invoice and move this order into the depot fulfilment workflow.
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Select Fulfilment Depot</label>
                  <select
                    value={selectedDepotId}
                    onChange={(e) => setSelectedDepotId(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsConvertModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    loading={isConverting}
                    onClick={handleConvert}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    Create Tax Invoice
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF Modal */}
      {isPrintModalOpen && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          documentType="PROFORMA"
          data={proforma}
        />
      )}
    </div>
  );
}
