'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { Customer, TaxInvoice, Proforma } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Button, LinkButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!customer) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to delete customer');
      }
      toast({ title: 'Customer deleted', variant: 'success' });
      router.push('/customers');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to delete customer', variant: 'error' });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-xs font-medium">Loading customer profile...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-500 text-sm font-semibold">Customer account not found</div>
        <LinkButton href="/customers" variant="outline" size="sm">
          Back to Customers
        </LinkButton>
      </div>
    );
  }

  const creditUsedPercent = Math.min(100, Math.round((customer.currentBalance / customer.creditLimit) * 100));
  const estimatedProfit = (customer.totalSpent || 0) * 0.22; // ~22% average gross margin

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        eyebrow="02 / SALES"
        breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: customer.companyName }]}
        title={
          <span className="inline-flex items-center gap-2.5">
            {customer.companyName}
            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 align-middle">
              {customer.customerCode}
            </span>
          </span>
        }
        description={`Contact: ${customer.contactPerson} · ${customer.email} · ${customer.country}`}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton
              href={`/proformas/new?customerId=${customer.id}`}
              iconLeft={<Plus className="h-4 w-4" />}
              size="sm"
            >
              Create Proforma
            </LinkButton>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              iconLeft={<Trash2 className="h-4 w-4" />}
              onClick={() => setIsDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          label="Total Revenue"
          value={formatUSD(customer.totalSpent)}
          helperText={`${customer.totalOrders || 0} lifetime orders`}
        />
        <KPICard
          label="Orders Count"
          value={customer.totalOrders || 0}
          helperText="Completed & active"
        />
        <KPICard
          label="Outstanding Balance"
          value={formatUSD(customer.currentBalance)}
          helperText={`Credit limit: ${formatUSD(customer.creditLimit)}`}
        />
        <KPICard
          label="Profit Generated"
          value={formatUSD(estimatedProfit)}
          helperText="Estimated gross profit"
        />
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>Billing Address</span>
          </div>
          <p className="text-slate-600 leading-relaxed">{customer.billingAddress}</p>
        </Card>

        <Card className="p-5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Shipping / Receiving Hub</span>
          </div>
          <p className="text-slate-600 leading-relaxed">{customer.shippingAddress}</p>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Invoices & Orders ({invoices.length})
          </h3>
        </div>

        <Table className="border-0 rounded-none shadow-none">
          <TableHeader>
            <TableHead>Invoice #</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Depot Hub</TableHead>
            <TableHead align="right">Amount (USD)</TableHead>
            <TableHead>Fulfilment Status</TableHead>
            <TableHead align="right">Action</TableHead>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  No invoices generated yet for this customer account.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-bold text-brand-600">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-slate-500">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell className="text-slate-700">{inv.depotName}</TableCell>
                  <TableCell align="right" className="font-mono font-bold text-slate-900">{formatUSD(inv.grandTotal)}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.fulfilmentStatus} />
                  </TableCell>
                  <TableCell align="right">
                    <LinkButton href={`/invoices/${inv.id}`} size="sm" variant="secondary">
                      View
                    </LinkButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${customer.companyName}?`}
        description="Are you sure you want to permanently delete this customer account? This cannot be undone."
        confirmLabel="Delete Customer"
        destructive
        loading={isDeleting}
      />
    </div>
  );
}
