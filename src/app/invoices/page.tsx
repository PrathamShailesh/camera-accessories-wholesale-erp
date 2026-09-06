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
  XCircle,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatUSD, formatDate } from '@/lib/utils';
import { TaxInvoice, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { fetchWithCache, getCurrentUserCachedSync } from '@/lib/client-cache';

export default function InvoicesPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User>(
    () => (getCurrentUserCachedSync()?.user as User) || ({
      id: 'usr-admin',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      email: 'admin@arib.com',
      status: 'ACTIVE',
    } as User)
  );
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedDoc, setSelectedDoc] = useState<TaxInvoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<TaxInvoice | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const cached = getCurrentUserCachedSync()?.user;
      if (cached) setCurrentUser(cached);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (filterStatus && filterStatus !== 'ALL') params.set('fulfilmentStatus', filterStatus);
      const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await fetchWithCache<TaxInvoice[]>(url, undefined, force ? 0 : 5000);
      setInvoices(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Something went wrong. Please try again.');
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [debouncedSearch, filterStatus]);

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
        {isLoading && invoices.length === 0 ? (
          <SkeletonTable rows={8} cols={6} />
        ) : filteredInvoices.length === 0 ? (
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
                      className="font-mono font-bold text-brand-600 hover:underline text-xs"
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
                      {inv.fulfilmentStatus !== 'DELIVERED' &&
                        inv.fulfilmentStatus !== 'SHIPPED' &&
                        inv.fulfilmentStatus !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setCancellingInvoice(inv)}
                            className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Cancel Invoice & Restore Stock"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
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

      <ConfirmDialog
        open={cancellingInvoice !== null}
        onClose={() => setCancellingInvoice(null)}
        onConfirm={async () => {
          if (!cancellingInvoice) return;
          setIsCancelling(true);
          try {
            const res = await fetch(`/api/invoices/${cancellingInvoice.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fulfilmentStatus: 'CANCELLED' }),
            });
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              throw new Error(d.error || 'Failed to cancel invoice');
            }
            toast({ title: 'Invoice cancelled and stock restored to depot', variant: 'success' });
            setCancellingInvoice(null);
            loadData(true);
          } catch (err: any) {
            toast({ title: err.message || 'Could not cancel invoice', variant: 'error' });
          } finally {
            setIsCancelling(false);
          }
        }}
        title={`Cancel Tax Invoice ${cancellingInvoice?.invoiceNumber}?`}
        description="This will cancel the invoice, restore allocated inventory units back to the depot, and release all reserved serial numbers."
        confirmLabel="Cancel Invoice"
        destructive
        loading={isCancelling}
      />
    </div>
  );
}
