'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { TaxInvoice, Depot } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function SalesReportsPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [invRes, depRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/depots')]);
      const invData = invRes.ok ? await invRes.json() : [];
      const depData = depRes.ok ? await depRes.json() : [];
      setInvoices(Array.isArray(invData) ? invData : []);
      setDepots(Array.isArray(depData) ? depData : []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
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
  const averageOrder = filteredInvoices.length > 0 ? totalSales / filteredInvoices.length : 0;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="06 / ANALYTICS"
        title="Sales Reports"
        description="Invoiced revenue, tax collected, and order volume."
        actions={
          depots.length > 1 && (
            <Select
              options={[
                { label: 'All depots', value: 'ALL' },
                ...depots.map((d) => ({ label: d.name, value: d.id })),
              ]}
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              wrapperClassName="w-48"
            />
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-line rounded-lg divide-x divide-y lg:divide-y-0 divide-line bg-surface">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Total Sales</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{formatUSD(totalSales)}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Tax Collected</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{formatUSD(totalTax)}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Invoices</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{filteredInvoices.length}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Average Order</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{formatUSD(averageOrder)}</div>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No sales data yet"
          description="Sales figures appear here once proformas are converted into tax invoices."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Depot</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead align="right">Tax</TableHead>
              <TableHead align="right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/invoices/${inv.id}`} className="font-mono font-semibold text-primary hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.customerCompany}</TableCell>
                  <TableCell className="text-muted">{inv.depotName}</TableCell>
                  <TableCell className="text-muted">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell align="right" className="font-mono text-muted">{formatUSD(inv.taxAmount)}</TableCell>
                  <TableCell align="right" className="font-mono font-semibold">{formatUSD(inv.grandTotal)}</TableCell>
                  <TableCell>
                    <StatusBadge status={inv.fulfilmentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
