'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  RefreshCw,
  Mail,
  Eye,
  CheckCircle2,
  Clock,
  TrendingUp,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ServiceInvoice, ServiceInvoiceStatus } from '@/types/erp';
import { formatUSD, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import { Toolbar, ToolbarGroup, FilterPillGroup } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function ServiceInvoicesListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [invoices, setInvoices] = useState<ServiceInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSendingEmail, setIsSendingEmail] = useState<Record<string, boolean>>({});
  const [deletingInvoice, setDeletingInvoice] = useState<ServiceInvoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<ServiceInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (debouncedSearch.trim()) queryParams.set('search', debouncedSearch.trim());

      const res = await fetch(`/api/service-invoices?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load service invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, debouncedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const confirmCancel = async () => {
    if (!cancellingInvoice) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/service-invoices/${cancellingInvoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to cancel service invoice');
      }
      toast({ title: 'Service invoice cancelled', variant: 'success' });
      setCancellingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      toast({ title: err.message || 'Could not cancel service invoice', variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInvoice) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/service-invoices/${deletingInvoice.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete service invoice');
      }
      toast({ title: 'Service invoice deleted', variant: 'success' });
      setDeletingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      toast({ title: err.message || 'Could not delete service invoice', variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendInvoiceEmail = async (inv: ServiceInvoice) => {
    setIsSendingEmail((prev) => ({ ...prev, [inv.id]: true }));
    try {
      const res = await fetch(`/api/service-invoices/${inv.id}/email`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        const isSimulated = Boolean(data.simulated);
        toast({
          title: isSimulated ? 'Email Logged (SMTP not configured)' : 'Service Invoice Sent',
          description:
            data.message ||
            (isSimulated
              ? 'SMTP is not configured, so the email was logged but not delivered. Add SMTP credentials in Settings.'
              : `Invoice #${inv.invoiceNumber} emailed to ${inv.customerEmail}`),
          variant: isSimulated ? 'warning' : 'success',
        });

        // Update local status
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === inv.id
              ? {
                  ...i,
                  emailStatus: 'SENT',
                  status: i.status === 'DRAFT' ? 'SENT' : i.status,
                }
              : i
          )
        );
      } else {
        toast({
          title: 'Email Delivery Failed',
          description: data.error || 'Unable to send email',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send email',
        variant: 'error',
      });
    } finally {
      setIsSendingEmail((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  // Metrics
  const totalServiceRevenue = invoices
    .filter((i) => i.status === 'PAID' || i.status === 'ISSUED' || i.status === 'SENT')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const pendingAmount = invoices
    .filter((i) => i.status === 'ISSUED' || i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const paidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const getStatusBadge = (status: ServiceInvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-success-soft text-success border-success-border';
      case 'ISSUED':
      case 'SENT':
        return 'bg-primary-soft text-primary border-info-border';
      case 'PARTIALLY_PAID':
        return 'bg-warning-soft text-warning border-warning-border';
      case 'OVERDUE':
        return 'bg-danger-soft text-danger border-danger-border';
      case 'CANCELLED':
        return 'bg-surface-muted text-muted border-line';
      default:
        return 'bg-surface-muted text-ink-secondary border-line';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        title="Manual Service Invoices"
        description="Billing for logistics, packaging, transport, installation & business services — separate from product inventory."
        actions={
          <LinkButton href="/service-invoices/new" iconLeft={<Plus className="h-4 w-4" />}>
            Create Service Invoice
          </LinkButton>
        }
      />

      {/* Compact summary indicators */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-ink text-white px-4 h-9 text-xs font-semibold">
          <TrendingUp className="h-3.5 w-3.5" />
          Total Revenue <span className="tabular-nums">{formatUSD(totalServiceRevenue)}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-success-soft text-success px-4 h-9 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Paid <span className="tabular-nums">{formatUSD(paidAmount)}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-soft text-orange px-4 h-9 text-xs font-semibold">
          <Clock className="h-3.5 w-3.5" />
          Pending <span className="tabular-nums">{formatUSD(pendingAmount)}</span>
        </div>
      </div>

      {/* Filters + Search */}
      <Toolbar>
        <ToolbarGroup>
          <FilterPillGroup
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All', value: 'ALL' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Issued', value: 'ISSUED' },
              { label: 'Sent', value: 'SENT' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ]}
          />
        </ToolbarGroup>
        <form onSubmit={handleSearchSubmit} className="w-full lg:w-72">
          <SearchInput
            placeholder="Search invoice #, customer, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </Toolbar>

      {/* Service Invoices Data Table */}
      <div>
        {isLoading ? (
          <SkeletonTable rows={6} cols={8} />
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white">
            <EmptyState
              icon={FileText}
              title="No Service Invoices Found"
              description="Create a manual service invoice to bill logistics, transport, packaging, or handling charges separately from product inventory."
              action={
                <LinkButton href="/service-invoices/new" iconLeft={<Plus className="h-4 w-4" />}>
                  Create First Service Invoice
                </LinkButton>
              }
            />
          </div>
        ) : (
          <>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Issue / Due Date</TableHead>
              <TableHead align="right">Grand Total</TableHead>
              <TableHead align="center">Status</TableHead>
              <TableHead align="center">Email</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/service-invoices/${inv.id}`} className="font-semibold text-primary hover:underline text-sm">
                      #{inv.invoiceNumber}
                    </Link>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-ink text-sm">{inv.customerCompany}</div>
                    <div className="text-xs text-muted">{inv.customerName} • {inv.customerEmail}</div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(inv.items || []).slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-semibold"
                        >
                          {item.category}: {item.description}
                        </span>
                      ))}
                      {(inv.items?.length || 0) > 2 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-muted">
                          +{(inv.items?.length || 0) - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted">
                    <div>Issue: {formatDate(inv.issueDate)}</div>
                    <div className="text-danger font-medium">Due: {formatDate(inv.dueDate)}</div>
                  </TableCell>

                  <TableCell align="right" className="font-semibold text-sm text-ink tabular-nums">
                    {formatUSD(inv.grandTotal)}
                  </TableCell>

                  <TableCell align="center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </TableCell>

                  <TableCell align="center" className="text-[11px]">
                    {inv.emailStatus === 'SENT' ? (
                      <span className="inline-flex items-center gap-1 text-success font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Sent
                      </span>
                    ) : (
                      <span className="text-muted">Not Sent</span>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSendInvoiceEmail(inv)}
                        loading={Boolean(isSendingEmail[inv.id])}
                        iconLeft={!isSendingEmail[inv.id] ? <Mail className="h-3.5 w-3.5" /> : undefined}
                        title="Send Service Invoice to Customer Email"
                      >
                        <span className="hidden sm:inline">Email</span>
                      </Button>

                      <IconButton label="View Service Invoice Details" onClick={() => router.push(`/service-invoices/${inv.id}`)}>
                        <Eye className="h-4 w-4 text-muted" />
                      </IconButton>

                      {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                        <IconButton
                          label="Cancel Service Invoice"
                          className="text-muted hover:text-warning hover:bg-warning-soft"
                          onClick={() => setCancellingInvoice(inv)}
                        >
                          <XCircle className="h-4 w-4" />
                        </IconButton>
                      )}

                      {(inv.status === 'DRAFT' || inv.status === 'CANCELLED') && (
                        <IconButton
                          label="Delete Service Invoice"
                          className="text-muted hover:text-danger hover:bg-danger-soft"
                          onClick={() => setDeletingInvoice(inv)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          <div className="md:hidden space-y-3">
            {invoices.map((inv) => (
              <Card key={inv.id} className="p-4 space-y-2.5">
                <Link href={`/service-invoices/${inv.id}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary text-sm">#{inv.invoiceNumber}</div>
                    <div className="font-medium text-ink text-sm truncate">{inv.customerCompany}</div>
                    <div className="text-xs text-muted truncate">{inv.customerName} • {inv.customerEmail}</div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(inv.status)}`}>
                    {inv.status}
                  </span>
                </Link>

                <div className="flex flex-wrap gap-1">
                  {(inv.items || []).slice(0, 2).map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-semibold"
                    >
                      {item.category}: {item.description}
                    </span>
                  ))}
                  {(inv.items?.length || 0) > 2 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-muted">
                      +{(inv.items?.length || 0) - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-line-soft">
                  <div className="text-muted">
                    <div>Issue: {formatDate(inv.issueDate)}</div>
                    <div className="text-danger font-medium">Due: {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="font-semibold text-sm text-ink tabular-nums">{formatUSD(inv.grandTotal)}</div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {inv.emailStatus === 'SENT' ? (
                    <span className="inline-flex items-center gap-1 text-success font-semibold text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Sent
                    </span>
                  ) : (
                    <span className="text-muted text-[11px]">Not Sent</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSendInvoiceEmail(inv)}
                      loading={Boolean(isSendingEmail[inv.id])}
                      iconLeft={!isSendingEmail[inv.id] ? <Mail className="h-3.5 w-3.5" /> : undefined}
                      title="Send Service Invoice to Customer Email"
                    >
                      Email
                    </Button>

                    <IconButton label="View Service Invoice Details" onClick={() => router.push(`/service-invoices/${inv.id}`)}>
                      <Eye className="h-4 w-4 text-muted" />
                    </IconButton>

                    {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                      <IconButton
                        label="Cancel Service Invoice"
                        className="text-muted hover:text-warning hover:bg-warning-soft"
                        onClick={() => setCancellingInvoice(inv)}
                      >
                        <XCircle className="h-4 w-4" />
                      </IconButton>
                    )}

                    {(inv.status === 'DRAFT' || inv.status === 'CANCELLED') && (
                      <IconButton
                        label="Delete Service Invoice"
                        className="text-muted hover:text-danger hover:bg-danger-soft"
                        onClick={() => setDeletingInvoice(inv)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={cancellingInvoice !== null}
        onClose={() => setCancellingInvoice(null)}
        onConfirm={confirmCancel}
        title={`Cancel Service Invoice #${cancellingInvoice?.invoiceNumber}?`}
        description="Are you sure you want to cancel this service invoice? It will be marked as CANCELLED."
        confirmLabel="Cancel Invoice"
        destructive
        loading={isProcessing}
      />

      <ConfirmDialog
        open={deletingInvoice !== null}
        onClose={() => setDeletingInvoice(null)}
        onConfirm={confirmDelete}
        title={`Delete Service Invoice #${deletingInvoice?.invoiceNumber}?`}
        description="Are you sure you want to permanently delete this service invoice? This action cannot be undone."
        confirmLabel="Delete Invoice"
        destructive
        loading={isProcessing}
      />
    </div>
  );
}
