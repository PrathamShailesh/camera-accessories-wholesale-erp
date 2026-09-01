'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Filter,
  Download,
  Building2,
  Users,
  DollarSign,
  Printer,
} from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { TaxInvoice } from '@/types/erp';

export default function SalesReportsPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [selectedDepot, setSelectedDepot] = useState('ALL');

  const loadData = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = invoices.filter((i) => {
    if (selectedDepot !== 'ALL' && i.depotId !== selectedDepot) return false;
    return i.fulfilmentStatus !== 'CANCELLED';
  });

  const totalSales = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalTax = filteredInvoices.reduce((sum, i) => sum + i.taxAmount, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Sales & Revenue Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Breakdown of wholesale transactions by customer, equipment model, and depot hub.
          </p>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Period Sales</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatUSD(totalSales)}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">USD Invoiced</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total VAT / Tax Collected</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {formatUSD(totalTax)}
          </div>
          <span className="text-[11px] text-slate-400">Standard 5% Rate</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Invoiced Deals Count</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {filteredInvoices.length} Invoices
          </div>
          <span className="text-[11px] text-slate-400">100% Fulfilment Ratio</span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Depot Hub</th>
                <th>Date</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th className="text-right">Total (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-bold text-brand-400">
                    <Link href={`/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="font-sans text-slate-200 font-medium">{inv.customerCompany}</td>
                  <td className="font-sans text-slate-300">{inv.depotName}</td>
                  <td className="text-slate-400">{formatDate(inv.issueDate)}</td>
                  <td className="text-slate-300">{formatUSD(inv.subtotal)}</td>
                  <td className="text-slate-400">{formatUSD(inv.taxAmount)}</td>
                  <td className="text-right font-bold text-emerald-400">{formatUSD(inv.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
