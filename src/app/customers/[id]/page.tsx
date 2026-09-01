'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Receipt,
  FileCheck2,
  FolderLock,
  ExternalLink,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Customer, TaxInvoice, Proforma, CloudDocument } from '@/types/erp';

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        setCustomer(null);
        return;
      }
      const data = await res.json();
      setCustomer(data);
      setInvoices(data.taxInvoices || []);
      setProformas(data.proformas || []);
      setDocuments([]);
    } catch {
      setCustomer(null);
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
        <div className="text-slate-400 text-sm">Loading customer data...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Customer account not found</div>
        <Link href="/customers" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          Back to Customers
        </Link>
      </div>
    );
  }

  const creditUsedPercent = Math.min(100, Math.round((customer.currentBalance / customer.creditLimit) * 100));

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white">{customer.companyName}</h1>
              <span className="font-mono text-xs text-brand-400 font-bold bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30">
                {customer.customerCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Primary Contact: {customer.contactPerson} • {customer.country}
            </p>
          </div>
        </div>

        <Link
          href={`/proformas/new?customerId=${customer.id}`}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
        >
          Create Proforma for Client
        </Link>
      </div>

      {/* Credit & Financial Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Credit Limit vs Balance</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatUSD(customer.currentBalance)} / {formatUSD(customer.creditLimit)}
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                creditUsedPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${creditUsedPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
            {creditUsedPercent}% Utilized
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Lifetime Spend</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatUSD(customer.totalSpent)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{customer.totalOrders || 0} Total Orders</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Tax & VAT Registration</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            {customer.taxNumber}
          </div>
          <span className="text-[11px] text-slate-400">Payment: {customer.paymentTerms.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Addresses & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase font-mono">
            <MapPin className="h-4 w-4 text-brand-400" />
            <span>Billing Address</span>
          </div>
          <p className="text-slate-400 leading-relaxed">{customer.billingAddress}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase font-mono">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Shipping / Receiving Hub</span>
          </div>
          <p className="text-slate-400 leading-relaxed">{customer.shippingAddress}</p>
        </div>
      </div>

      {/* Transaction History (Tax Invoices) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Tax Invoices & Transaction History
        </h3>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Issue Date</th>
                <th>Depot Hub</th>
                <th>Total (USD)</th>
                <th>Fulfilment Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-sans text-xs">
                    No invoices generated yet for this customer.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const badge = getStatusBadgeClasses(inv.fulfilmentStatus);
                  return (
                    <tr key={inv.id}>
                      <td className="font-bold text-brand-400">{inv.invoiceNumber}</td>
                      <td className="text-slate-400">{formatDate(inv.issueDate)}</td>
                      <td className="font-sans text-slate-300">{inv.depotName}</td>
                      <td className="font-bold text-white">{formatUSD(inv.grandTotal)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                          {inv.fulfilmentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-sans text-slate-200 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
