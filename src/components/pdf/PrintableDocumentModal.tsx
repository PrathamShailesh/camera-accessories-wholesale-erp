'use client';

import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Proforma, TaxInvoice, CompanySettings } from '@/types/erp';
import { formatUSD, formatDocDate, numberToWordsUSD } from '@/lib/utils';
import dataStore from '@/lib/data-store';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in no-print-backdrop">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* Action Header bar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 font-mono">
              Document Preview
            </span>
            <span className="text-xs text-slate-400">• {docTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow hover:bg-brand-500 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-8 bg-slate-950/90 text-slate-200">
          <div
            ref={printRef}
            className="print-page mx-auto bg-white text-black p-8 sm:p-12 rounded-xl shadow-lg max-w-3xl text-xs font-sans leading-normal border border-slate-200"
            style={{ minHeight: '1000px' }}
          >
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
                  <tr className="bg-slate-100 border-b border-black text-[11px] font-bold text-black">
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
                          <div className="text-[10px] text-slate-700 font-mono mt-0.5 font-normal">
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

            {/* Payments To Be Made To Reminder */}
            <div className="text-xs text-black mt-4 mb-6">
              <div className="font-bold">Payments to be made to:</div>
              <div className="font-semibold uppercase">{settings.companyName || 'ARIB GLOBAL'}</div>
              <div>Contact: {settings.phone || '+91 62827 59863'}</div>
            </div>

            {/* Sign-off & Computer Generated Notice */}
            <div className="flex justify-between items-end text-xs text-black pt-4">
              <div>
                <div className="font-bold uppercase">For {settings.companyName || 'ARIB GLOBAL'}</div>
                <div className="mt-0.5">Contact: {settings.phone || '+91 62827 59863'}</div>
              </div>
              <div className="text-right text-[9px] italic text-slate-700 font-sans tracking-wide">
                <div>THIS IS A COMPUTER GENERATED DOCUMENT</div>
                <div>AND DOES NOT REQUIRE A SIGNATURE.</div>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="mt-6 text-xs text-black">
              <span className="font-bold">Remarks:</span>
              {data.notes && <span className="ml-2 font-normal">{data.notes}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
