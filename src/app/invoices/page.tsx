'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Printer,
  Building2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate } from '@/lib/utils';
import { TaxInvoice, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <div className="text-slate-500 text-xs font-medium">Loading tax invoices...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        eyebrow="02 / SALES"
        title="Tax Invoices"
        description="Legal commercial invoices and physical depot fulfilment queue."
        actions={
          <LinkButton href="/proformas/new" iconLeft={<Plus className="h-4 w-4" />}>
            New Proforma
          </LinkButton>
        }
      />

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Invoice # or Customer..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'READY_FOR_PACKING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </Card>

      {/* Summary Ribbon */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
        <span>Showing {filteredInvoices.length} invoices</span>
        {!isDepotUser && (
          <span>
            Total Invoiced: <strong className="text-slate-900">{formatUSD(totalInvoiced)}</strong>
          </span>
        )}
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Tax Invoices Found"
            description="Convert approved proformas to generate tax invoices."
            action={
              <LinkButton href="/proformas/new" iconLeft={<Plus className="h-4 w-4" />}>
                Create Proforma
              </LinkButton>
            }
          />
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <TableHeader>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer / Company</TableHead>
              <TableHead>Assigned Hub</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Total (USD)</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-mono font-bold text-indigo-600 hover:underline text-xs"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    {inv.proformaNumber && (
                      <div className="text-[10px] text-slate-400 font-mono">Ref: {inv.proformaNumber}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs">{inv.customerCompany}</div>
                    <div className="text-[11px] text-slate-500">{inv.customerName}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {inv.depotName.replace(' Central Depot', '').replace(' Logistics Hub', '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-500">{formatDate(inv.issueDate)}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.fulfilmentStatus} />
                  </TableCell>
                  <TableCell align="right" className="font-mono font-bold text-xs text-slate-900">
                    {!isDepotUser ? formatUSD(inv.grandTotal) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton label="Print / PDF" onClick={() => setSelectedDoc(inv)}>
                        <Printer className="h-3.5 w-3.5 text-slate-500" />
                      </IconButton>
                      <LinkButton href={`/invoices/${inv.id}`} size="sm" variant="secondary">
                        Open
                      </LinkButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Printable Modal */}
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
