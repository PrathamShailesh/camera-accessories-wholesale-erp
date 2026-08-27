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
  Clock,
  Send,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText,
  Radio,
  Bell,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Proforma, Depot } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';

export default function ProformaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proforma, setProforma] = useState<Proforma | null>(null);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepotId, setSelectedDepotId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const prevStatusRef = useRef<string | null>(null);

  const loadData = async (silent = false) => {
    try {
      const res = await fetch(`/api/proformas/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        if (!silent) setProforma(null);
        return;
      }
      const data = await res.json();

      // Check if status changed in real-time
      if (prevStatusRef.current && prevStatusRef.current !== data.status) {
        if (data.status === 'CONFIRMED') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0c8ae9', '#10b981', '#38bdf8', '#fbbf24'],
          });
          setLiveNotification('🎉 Live Update: Customer just confirmed and accepted this quotation!');
        } else if (data.status === 'CONVERTED') {
          setLiveNotification('✅ Live Update: Quotation was converted to Tax Invoice.');
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

  // Real-time synchronization: SSE stream + Fast adaptive polling
  useEffect(() => {
    loadData(false);

    // 1. Setup Server-Sent Events (SSE) stream for instant push
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?id=${id}`);
      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };
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
      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (err) {
      console.warn('SSE connection failed, relying on adaptive polling:', err);
    }

    // 2. Focus revalidation on tab switch
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      window.removeEventListener('focus', onFocus);
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Loading proforma...</div>
      </div>
    );
  }

  if (!proforma) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Proforma not found</div>
        <Link href="/proformas" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          Back to Proformas
        </Link>
      </div>
    );
  }

  const badge = getStatusBadgeClasses(proforma.status);

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

      // Trigger Confetti Celebration for deal closed!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0c8ae9', '#10b981', '#38bdf8', '#fbbf24'],
      });

      // Update state and route to invoice after brief moment
      setTimeout(() => {
        router.push(`/invoices/${newInvoice.id}`);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Conversion failed');
      setIsConverting(false);
    }
  };

  const handleSendEmail = async () => {
    try {
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
        setEmailSentSuccess(true);
        handleStatusChange('SENT');
        setTimeout(() => {
          setEmailSentSuccess(false);
          setIsEmailModalOpen(false);
        }, 1500);
      } else {
        const errorData = await res.json().catch(() => null);
        setErrorMessage(errorData?.error || 'Failed to send email. Please check email configuration in Settings.');
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      setErrorMessage(error?.message || 'Failed to send email. Please check email configuration in Settings.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Real-Time Live Notification Banner */}
      {liveNotification && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/50 shadow-glow-emerald flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3 text-emerald-300 text-xs font-bold">
            <Zap className="h-5 w-5 text-emerald-400 animate-pulse" />
            <span>{liveNotification}</span>
          </div>
          <button
            onClick={() => setLiveNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/proformas"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                {proforma.proformaNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {proforma.status}
              </span>

              {/* Live Synchronization Status Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                  isLiveConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
                title="Real-time live synchronization is active"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: <strong className="text-slate-200">{proforma.customerCompany}</strong> • Created: {formatDate(proforma.issueDate)}
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
            <span>Print PDF</span>
          </button>

          {/* Preview Customer Portal */}
          <Link
            href={`/quote/${proforma.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            title="Open customer-facing quotation portal"
          >
            <ExternalLink className="h-4 w-4 text-cyan-400" />
            <span>Customer Portal</span>
          </Link>

          {/* Email Customer */}
          {proforma.status !== 'CONVERTED' && (
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <Mail className="h-4 w-4 text-brand-400" />
              <span>Email Quote</span>
            </button>
          )}

          {/* Mark Confirmed (Manual Override) */}
          {proforma.status === 'SENT' && (
            <button
              onClick={() => handleStatusChange('CONFIRMED')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-glow transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Mark Deal Confirmed</span>
            </button>
          )}

          {/* Convert to Tax Invoice Button */}
          {proforma.status === 'CONFIRMED' && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all animate-pulse"
            >
              <Sparkles className="h-4 w-4" />
              <span>1-Click Convert to Tax Invoice</span>
            </button>
          )}

          {proforma.status === 'CONVERTED' && proforma.convertedToInvoiceId && (
            <Link
              href={`/invoices/${proforma.convertedToInvoiceId}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
            >
              <Receipt className="h-4 w-4" />
              <span>View Generated Invoice #{proforma.convertedToInvoiceNumber}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Deal Pipeline Stepper */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED'].includes(proforma.status)
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">1. Draft Created</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(proforma.issueDate)}</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['SENT', 'CONFIRMED', 'CONVERTED'].includes(proforma.status)
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">2. Sent to Client</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {proforma.status === 'DRAFT' ? 'Pending Send' : 'Email Delivered'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              ['CONFIRMED', 'CONVERTED'].includes(proforma.status)
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">3. Deal Confirmed</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {proforma.status === 'CONFIRMED' || proforma.status === 'CONVERTED'
                ? 'Customer Accepted'
                : 'Awaiting Customer'}
            </div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all ${
              proforma.status === 'CONVERTED'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <div className="font-bold">4. Tax Invoice</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {proforma.status === 'CONVERTED' ? proforma.convertedToInvoiceNumber : 'Pending Conversion'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Line Items & Totals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Quotation Line Items ({proforma.items?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">Currency: USD ($)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">SKU / Item</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Qty</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Unit Price</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Discount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {proforma.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.productSku} • {item.brand}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatUSD(item.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatUSD(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-col items-end space-y-1.5 text-xs font-mono">
              <div className="flex justify-between w-64 text-slate-400">
                <span>Subtotal:</span>
                <span className="text-white">{formatUSD(proforma.subtotal)}</span>
              </div>
              {proforma.discountAmount > 0 && (
                <div className="flex justify-between w-64 text-amber-400">
                  <span>Special Discount:</span>
                  <span>-{formatUSD(proforma.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between w-64 text-slate-400">
                <span>VAT / Tax (5%):</span>
                <span className="text-white">{formatUSD(proforma.taxAmount)}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-400">
                <span>Shipping Charges:</span>
                <span className="text-white">{formatUSD(proforma.shippingCost)}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-800 text-sm font-black text-brand-400">
                <span>Grand Total:</span>
                <span>{formatUSD(proforma.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Conversion Box when Deal Confirmed */}
          {proforma.status === 'CONFIRMED' && (
            <div className="p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 shadow-glow-emerald space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                <h3 className="text-sm font-bold text-white">Ready for 1-Click Tax Invoice Conversion</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Converting this deal will automatically generate a legally binding Tax Invoice, deduct stock across depots, allocate serial numbers, and assign the fulfilment task directly to the destination warehouse.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="w-full sm:w-64">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Assign Fulfilment Depot
                  </label>
                  <select
                    value={selectedDepotId}
                    onChange={(e) => setSelectedDepotId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full sm:w-auto mt-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all active:scale-98"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isConverting ? 'Processing Conversion...' : 'Execute Conversion Now'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Customer Details & Commercial Terms */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Customer Profile
            </h3>
            <div>
              <h4 className="text-sm font-bold text-white">{proforma.customerCompany}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{proforma.customerName}</p>
              <p className="text-xs text-slate-400">{proforma.customerEmail}</p>
              {proforma.customerPhone && (
                <p className="text-xs text-slate-400">{proforma.customerPhone}</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Billing Address:</span>
                <span className="text-[11px] leading-relaxed">{proforma.billingAddress}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-300 block mb-0.5">Shipping Address:</span>
                <span className="text-[11px] leading-relaxed">{proforma.shippingAddress}</span>
              </div>
            </div>
          </div>

          {/* Commercial Terms */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Commercial Terms
            </h3>
            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Payment Terms:</span>
                <span className="text-slate-200 font-medium">{proforma.paymentTerms}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Terms:</span>
                <span className="text-slate-200 font-medium">{proforma.deliveryTerms}</span>
              </div>
              <div className="flex justify-between">
                <span>Expiry Date:</span>
                <span className="text-slate-200 font-mono">{formatDate(proforma.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Currency:</span>
                <span className="text-emerald-400 font-mono font-bold">USD ($)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Modal */}
      {isPrintModalOpen && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          documentType="PROFORMA"
          data={proforma}
        />
      )}

      {/* Email Customer Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-400" />
                <h3 className="text-sm font-bold text-white">Send Quote via Email</h3>
              </div>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {emailSentSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Quotation email sent successfully with interactive confirmation link!</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  An official quotation notification will be delivered to:
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-white font-semibold">{proforma.customerCompany}</div>
                  <div className="text-brand-400 font-mono">{proforma.customerEmail}</div>
                  <div className="text-slate-400 font-mono">Amount: {formatUSD(proforma.grandTotal)}</div>
                </div>
                <p className="text-slate-400 text-[11px]">
                  The email contains an interactive link for the customer to review the proforma and confirm the deal with 1 click.
                </p>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px]">
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Email Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
