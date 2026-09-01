'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Building2,
  CheckCircle,
  Truck,
  Boxes,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { TaxInvoice, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';

export default function InvoicesPage() {
  const [currentUser, setCurrentUser] = useState<User>(dataStore.getCurrentUser());
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<TaxInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      setCurrentUser(dataStore.getCurrentUser());
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load invoices');
        setInvoices(dataStore.getInvoices());
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setInvoices(dataStore.getInvoices());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDepotUser = currentUser.role === 'DEPOT_USER';

  const filteredInvoices = invoices.filter((inv) => {
    // If Depot User, only show invoices assigned to user's depot
    if (isDepotUser && currentUser.assignedDepotId && inv.depotId !== currentUser.assignedDepotId) {
      return false;
    }
    if (filterStatus !== 'ALL' && inv.fulfilmentStatus !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerCompany.toLowerCase().includes(q) ||
        inv.proformaNumber?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalInvoiced = filteredInvoices
    .filter((i) => i.fulfilmentStatus !== 'CANCELLED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-400 text-sm">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Tax Invoices Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official legal billing documents, depot fulfilment triggers, and serial tracking in USD ($).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Invoice # (INV-10291) or Customer..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'READY_FOR_PACKING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Summary Ribbon */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>Displaying {filteredInvoices.length} invoices</span>
        {!isDepotUser && (
          <span>
            Ledger Sum: <strong className="text-emerald-400">{formatUSD(totalInvoiced)}</strong>
          </span>
        )}
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer / Company</th>
                <th>Assigned Depot</th>
                <th>Issue Date</th>
                <th>Payment</th>
                <th>Fulfilment Status</th>
                <th>Total (USD)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-emerald-400 flex items-center justify-center">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Tax Invoices Found</h4>
                      <p className="text-xs text-slate-400">
                        Convert approved proforma quotations to generate commercial tax invoices and trigger depot packing workflows.
                      </p>
                      <Link
                        href="/proformas/new"
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
                      >
                        <span>Create New Proforma</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const badge = getStatusBadgeClasses(inv.fulfilmentStatus);
                  const payBadge = getStatusBadgeClasses(inv.paymentStatus);

                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono font-bold text-emerald-400 hover:underline text-xs"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        {inv.proformaNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Ref: {inv.proformaNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-white text-xs">{inv.customerCompany}</div>
                        <div className="text-[10px] text-slate-400">{inv.customerName}</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {inv.depotName.replace(' Central Depot', '').replace(' Logistics Hub', '')}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-400">{formatDate(inv.issueDate)}</span>
                      </td>
                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${payBadge.bg} ${payBadge.text} ${payBadge.border}`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {inv.fulfilmentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-xs text-white">
                        {!isDepotUser ? formatUSD(inv.grandTotal) : '— (Restricted)'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDoc(inv)}
                            title="Print / Save PDF"
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                          >
                            Open
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Document Modal */}
      {selectedDoc && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentType="TAX_INVOICE"
          data={selectedDoc}
        />
      )}
    </div>
  );
}
