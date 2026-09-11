'use client';

import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Stamp,
} from 'lucide-react';
import { Proforma, TaxInvoice, CompanySettings } from '@/types/erp';
import { formatUSD, formatDocDate, numberToWordsUSD } from '@/lib/utils';
import dataStore from '@/lib/data-store';
import { evaluateSealPolicy } from '@/lib/seal-policy';

interface PrintableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'PROFORMA' | 'TAX_INVOICE' | 'PACKING_LIST';
  data: Proforma | TaxInvoice | any;
}

export default function PrintableDocumentModal({
  isOpen,
  onClose,
  documentType,
  data,
}: PrintableDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const settings: CompanySettings = dataStore.getCompanySettings();

  const policy = evaluateSealPolicy({
    documentType,
    status: data?.status,
    fulfilmentStatus: data?.fulfilmentStatus,
    paymentStatus: data?.paymentStatus,
  });

  const [overrideSeal, setOverrideSeal] = useState<boolean | null>(null);
  const shouldShowSeal = overrideSeal !== null ? overrideSeal : policy.shouldSeal;

  if (!isOpen || !data) return null;

  const isTaxInvoice = documentType === 'TAX_INVOICE';
  const isProforma = documentType === 'PROFORMA';
  const isPackingList = documentType === 'PACKING_LIST';

  const docTitle = isTaxInvoice
    ? `TAX INVOICE #${data.invoiceNumber}`
    : isProforma
    ? `PROFORMA INVOICE #${data.proformaNumber}`
    : `PACKING SLIP #${data.invoiceNumber || data.id}`;

  const docNumber = isTaxInvoice
    ? data.invoiceNumber || 'INV-200444'
    : isProforma
    ? data.proformaNumber || 'QAR-200444'
    : data.invoiceNumber || 'SLIP-200444';

  const totalQuantity = (data.items || []).reduce(
    (sum: number, item: any) => sum + (Number(item.quantity) || 0),
    0
  );

  const grandTotal = data.grandTotal || data.subtotal || 0;

  const handlePrint = () => {
    window.print();
  };

  // Derive Incoterms & Shipment mode
  const shipmentMode =
    data.shipmentMode ||
    (data.deliveryTerms?.toLowerCase().includes('air')
      ? 'AIR'
      : data.deliveryTerms?.toLowerCase().includes('sea')
      ? 'SEA'
      : 'AIR');

  const incoterms =
    data.incoterms ||
    (data.deliveryTerms?.includes('(')
      ? data.deliveryTerms.match(/\((.*?)\)/)?.[1]
      : data.deliveryTerms) ||
    'C&F Vietnam';

  const estShipDate =
    data.expiryDate ||
    data.dueDate ||
    (data.issueDate ? new Date(new Date(data.issueDate).getTime() + 6 * 86400000).toISOString() : '2026-08-25');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fade-in no-print-backdrop">
      <div className="relative w-full max-w-4xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden my-auto">
        {/* Action Header bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-line bg-surface no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
              Document Preview
            </span>
            <span className="text-xs text-muted">• {docTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOverrideSeal((prev) => (prev !== null ? !prev : !policy.shouldSeal))}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                shouldShowSeal
                  ? 'bg-success-soft border-success-border text-success hover:bg-success-soft/70'
                  : 'bg-surface-muted border-line text-muted hover:text-ink'
              }`}
              title={`${policy.reason} (Click to toggle company seal on/off)`}
            >
              <Stamp className="h-3.5 w-3.5" />
              <span>Seal: {shouldShowSeal ? 'Included' : 'Omitted'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted hover:text-ink hover:bg-surface-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-8 bg-surface">
          <div
            ref={printRef}
            className="print-page mx-auto bg-white text-black p-8 sm:p-12 rounded-xl shadow-lg max-w-3xl text-xs font-sans leading-normal border border-line"
            style={{ minHeight: '1000px' }}
          >
            {/* Document Watermark / State Notice */}
            {policy.isDraft && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold px-3 py-1.5 rounded mb-4 text-center uppercase tracking-wider print:border-amber-400">
                PRELIMINARY DRAFT QUOTATION — FOR REVIEW ONLY (NOT AN OFFICIAL TAX INVOICE)
              </div>
            )}
            {policy.isCancelled && (
              <div className="bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-bold px-3 py-1.5 rounded mb-4 text-center uppercase tracking-wider print:border-rose-400">
                CANCELLED TRANSACTION — VOID & UNOFFICIAL
              </div>
            )}
            {/* Header: Company Logo, Name & Contact (Left) vs Document Info (Right) */}
            <div className="flex justify-between items-start mb-6">
              {/* Top Left: Logo & Contact */}
              <div className="flex flex-col items-start gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pdflogo.png"
                  alt="ARIB GLOBAL"
                  className="h-14 w-auto object-contain shrink-0 max-h-16"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="text-xs text-black mt-1 font-medium">
                  Contact: {settings.phone || '+91 62827 59863'}
                </div>
              </div>

              {/* Top Right */}
              <div className="text-right">
                <div className="text-[10px] font-medium text-black mb-1">1 of 1</div>
                <div className="grid grid-cols-[115px_1fr] gap-x-2 gap-y-0.5 text-xs text-black text-left">
                  <span className="font-bold">
                    {isTaxInvoice ? 'Invoice No.:' : isProforma ? 'Proforma No.:' : 'Slip No.:'}
                  </span>
                  <span className="font-medium">{docNumber}</span>

                  <span className="font-bold">Date:</span>
                  <span>{formatDocDate(data.issueDate || data.createdAt)}</span>

                  <span className="font-bold">Shipment Mode:</span>
                  <span>{shipmentMode}</span>

                  <span className="font-bold">Payment Terms:</span>
                  <span>{data.paymentTerms || 'Cash In Advance'}</span>

                  <span className="font-bold">Incoterms:</span>
                  <span>{incoterms}</span>

                  <span className="font-bold">Est. Ship. Date:</span>
                  <span>{formatDocDate(estShipDate)}</span>
                </div>
              </div>
            </div>

            {/* Customer & Consignee Section */}
            <div className="space-y-4 mb-6 text-xs text-black">
              {/* Customer */}
              <div className="grid grid-cols-[95px_1fr] gap-x-2 items-start">
                <span className="font-bold text-black">Customer:</span>
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-black">
                    {data.customerCompany || data.customerName || 'ABC COMPANY'}
                  </div>
                  <div className="text-black uppercase whitespace-pre-line leading-tight">
                    {data.billingAddress || data.shippingAddress || 'UNIT C & D, 63/F, ALEXANDER IND AREA\n35-45 XY STREET, HAWAI, VIETNAM'}
                  </div>
                </div>
              </div>

              {/* Consignee */}
              <div className="grid grid-cols-[95px_1fr] gap-x-2 items-start">
                <span className="font-bold text-black">Consignee:</span>
                <div className="space-y-0.5">
                  <div className="font-bold uppercase text-black">
                    {data.customerCompany || data.customerName || 'ABC COMPANY'}
                  </div>
                  <div className="text-black uppercase whitespace-pre-line leading-tight">
                    {data.shippingAddress || data.billingAddress || 'UNIT C & D, 63/F, ALEXANDER IND AREA\n35-45 XY STREET, HAWAI, VIETNAM'}
                  </div>
                  <div className="text-black pt-0.5 font-normal">
                    Tel: {data.customerPhone || '+84 1234 5678, 4567 8910'}
                    {data.customerEmail && <span className="ml-4">Email: {data.customerEmail}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Items Table with Continuous Black Grid Borders */}
            <div className="mb-3">
              <table className="w-full text-left border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-surface-muted border-b border-black text-[11px] font-bold text-black">
                    <th className="py-1.5 px-2 border-r border-black text-center w-[7%]">Sl. No.</th>
                    <th className="py-1.5 px-2 border-r border-black text-center w-[16%]">Item Code</th>
                    <th className="py-1.5 px-3 border-r border-black text-left w-[43%]">Product Description</th>
                    <th className="py-1.5 px-2 border-r border-black text-center w-[8%]">Qty</th>
                    <th className="py-1.5 px-2 border-r border-black text-right w-[13%]">Rate US$</th>
                    <th className="py-1.5 px-2 text-right w-[13%]">Amount US$</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1.5 px-2 border-r border-black text-center font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-mono font-medium">
                        {item.productSku || item.barcode || 'ITEM-CODE'}
                      </td>
                      <td className="py-1.5 px-3 border-r border-black text-left">
                        <div className="font-semibold text-black uppercase">
                          {item.productName}
                        </div>
                        {/* Serial numbers badge if allocated or packing list */}
                        {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                          <div className="text-[10px] text-ink-secondary font-mono mt-0.5 font-normal">
                            S/N: {item.allocatedSerials.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-2 border-r border-black text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 px-2 border-r border-black text-right font-medium">
                        {formatUSD(item.unitPrice)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-medium">
                        {formatUSD(item.totalPrice)}
                      </td>
                    </tr>
                  ))}

                  {/* Spacer Rows to maintain proper document height with continuous vertical divider lines */}
                  {(!data.items || data.items.length < 5) && (
                    <tr style={{ height: '140px' }} className="align-top">
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td className="border-r border-black"></td>
                      <td></td>
                    </tr>
                  )}

                  {/* Embedded Banking Details in bottom area of table */}
                  <tr className="border-t border-black">
                    <td
                      colSpan={3}
                      className="border-r border-black p-3 align-bottom text-[10px] leading-relaxed"
                    >
                      <div className="font-bold text-black mb-0.5">Payments to be made to:</div>
                      <div className="text-black font-medium">{settings.bankDetails?.accountName || settings.accountName || 'Not configured'}</div>
                      <div className="text-black">Bank: {settings.bankDetails?.bankName || settings.bankName || 'Not configured'}</div>
                      <div className="font-bold text-black">
                        USD IBAN A/c #: {settings.bankDetails?.iban || settings.iban || 'Not configured'}
                      </div>
                      <div className="font-bold text-black">
                        SWIFT: {settings.bankDetails?.swiftBic || settings.swiftBic || 'Not configured'}
                      </div>
                    </td>
                    <td className="border-r border-black p-2 align-bottom"></td>
                    <td className="border-r border-black p-2 align-bottom"></td>
                    <td className="p-2 align-bottom"></td>
                  </tr>
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="border-t border-black font-bold text-xs bg-white">
                    <td colSpan={2} className="border-r border-black py-1.5 px-2"></td>
                    <td className="border-r border-black py-1.5 px-3 text-right font-bold">
                      Total Qty:
                    </td>
                    <td className="border-r border-black py-1.5 px-2 text-center font-bold">
                      {totalQuantity}
                    </td>
                    <td className="border-r border-black py-1.5 px-2 text-right font-bold">
                      Total US$
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold text-black">
                      {formatUSD(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Post-Table Section: Amount in Words */}
            <div className="text-xs font-bold text-black mb-3">
              Amount in Words:{' '}
              <span className="font-normal ml-1">
                {numberToWordsUSD(grandTotal)}
              </span>
            </div>

            {/* Terms / Details Rectangle Box */}
            <div className="border border-black p-2.5 my-3 text-xs text-black max-w-xl space-y-1">
              <div className="grid grid-cols-[85px_1fr] gap-2">
                <span className="font-bold">Delivery:</span>
                <span>{data.deliveryTerms || 'C&F Vietnam Airport'}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-2">
                <span className="font-bold">Valid Till:</span>
                <span>{formatDocDate(data.expiryDate || data.dueDate || '2026-08-30')}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-2">
                <span className="font-bold">Warranty:</span>
                <span>{data.warrantyTerms || 'N/A'}</span>
              </div>
            </div>

            {/* Remarks Section */}
            {data.notes && (
              <div className="mt-4 text-xs text-black">
                <span className="font-bold">Remarks:</span>
                <span className="ml-2 font-normal">{data.notes}</span>
              </div>
            )}

            {/* Payments To Be Made To Reminder or Warehouse Verification Notice */}
            {isPackingList ? (
              <div className="text-xs text-black mt-4 mb-4 p-3 bg-surface border border-line rounded-lg">
                <div className="font-bold uppercase tracking-wide text-ink mb-1">Warehouse Dispatch Notice</div>
                <div className="text-ink-secondary">All serial numbers, package counts, and tamper-evident carton seals must be physically inspected before vehicle departure. Report discrepancies to logistics dispatch immediately.</div>
              </div>
            ) : (
              <div className="text-xs text-black mt-4 mb-4">
                <div className="font-bold">Payments to be made to:</div>
                <div className="font-semibold uppercase">{settings.companyName || 'ARIB GLOBAL'}</div>
                <div>Contact: {settings.phone || '+971 4 800 0100'}</div>
              </div>
            )}

            {/* Sign-off, Official Company Seal & Warehouse Verification */}
            {isPackingList ? (
              <div className="flex justify-between items-end text-xs text-black pt-4 border-t border-line mt-4">
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wide text-ink">
                    Warehouse Verification & Dispatch
                  </div>
                  <div className="text-[11px] text-ink-secondary">Origin Depot: {data.depot?.name || 'Central Logistics Hub, Dubai'}</div>
                  <div className="text-[10px] text-muted font-mono">
                    Package Count: {data.packingDetails?.packageCount || 1} Box(es) • Weight: {data.packingDetails?.totalWeightKg || '—'} KG
                  </div>
                  <div className="text-[9px] text-muted italic pt-1 font-sans">
                    <div>THIS IS AN OPERATIONAL WAREHOUSE PACKING SHEET</div>
                    <div>VERIFIED AGAINST PHYSICAL INVENTORY AT DISPATCH DOCK</div>
                  </div>
                </div>

                {/* Warehouse Dual Signatures */}
                <div className="flex gap-6 text-center shrink-0">
                  <div className="w-32">
                    <div className="h-12 border-b border-line border-dashed mb-1 flex items-end justify-center pb-1">
                      <span className="text-[11px] font-mono text-ink">{data.packingDetails?.packedBy || 'Depot Inspector'}</span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink">
                      Packed & Checked
                    </div>
                    <div className="text-[9px] text-muted uppercase tracking-widest font-mono">
                      Warehouse Staff
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="h-12 border-b border-line border-dashed mb-1 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-muted italic">Sign & Date</span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink">
                      Consignee Receipt
                    </div>
                    <div className="text-[9px] text-muted uppercase tracking-widest font-mono">
                      Courier / Customer
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-end text-xs text-black pt-4 border-t border-line mt-4">
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wide text-ink">
                    For {settings.companyName || 'ARIB GLOBAL GENERAL TRADING L.L.C'}
                  </div>
                  <div className="text-[11px] text-ink-secondary">Contact: {settings.phone || '+971 4 800 0100'}</div>
                  <div className="text-[10px] text-muted font-mono">TRN: {settings.vatGstNumber || '100889218200001'}</div>
                  <div className="text-[9px] italic text-ink-secondary pt-2 font-sans tracking-wide">
                    <div>THIS IS A COMPUTER GENERATED DOCUMENT</div>
                    {shouldShowSeal ? (
                      <div className="text-brand-700 font-semibold">DIGITALLY AUTHENTICATED WITH OFFICIAL COMPANY SEAL</div>
                    ) : (
                      <div>SUBJECT TO FINAL TERMS & AUTHORIZED APPROVAL</div>
                    )}
                  </div>
                </div>

                {/* Official Seal OR Unsigned Signatory Placeholder */}
                <div className="flex flex-col items-center justify-end text-center shrink-0">
                  {shouldShowSeal ? (
                    <>
                      <div className="relative flex items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.sealUrl || '/arib-seal.png'}
                          alt="ARIB GLOBAL Official Company Seal"
                          className="h-28 w-28 object-contain shrink-0 select-none print:h-28 print:w-28"
                          style={{ aspectRatio: '1 / 1' }}
                        />
                      </div>
                      <div className="border-t border-line pt-1 w-36 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink">
                          Official Company Seal
                        </div>
                        <div className="text-[9px] text-muted uppercase tracking-widest font-mono">
                          Authorized Signatory
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-36">
                      <div className="h-16 border-b border-line border-dashed mb-1 flex items-end justify-center pb-1">
                        <span className="text-[10px] text-muted italic">Signature</span>
                      </div>
                      <div className="border-t border-line pt-1 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink">
                          Authorized Signatory
                        </div>
                        <div className="text-[9px] text-muted uppercase tracking-widest font-mono">
                          {policy.isDraft ? 'Preliminary / Unsealed' : 'Pending Stamp'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
