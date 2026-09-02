'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Barcode, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchInput, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

const STATUS_FILTERS = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'In Stock', value: 'IN_STOCK' },
  { label: 'Allocated', value: 'ALLOCATED' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Returned', value: 'RETURNED' },
];

export default function SerialsPage() {
  const [serials, setSerials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/serials');
      const data = res.ok ? await res.json() : [];
      setSerials(Array.isArray(data) ? data : []);
    } catch {
      setSerials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = serials.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (s.serialNumber || '').toLowerCase().includes(q) ||
        (s.productName || '').toLowerCase().includes(q) ||
        (s.productSku || '').toLowerCase().includes(q) ||
        (s.depotName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const inStockCount = serials.filter((s) => s.status === 'IN_STOCK').length;
  const allocatedCount = serials.filter((s) => s.status === 'ALLOCATED').length;
  const dispatchedCount = serials.filter((s) => s.status === 'DISPATCHED' || s.status === 'SHIPPED').length;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="03 / INVENTORY"
        breadcrumbs={[{ label: 'Inventory', href: '/inventory' }, { label: 'Serial Numbers' }]}
        title="Serial Numbers"
        description="Unit-level traceability for cameras, lenses, and high-value equipment."
        actions={
          <LinkButton href="/products" variant="outline" iconLeft={<Package className="h-4 w-4" />}>
            Product Catalog
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 border border-line rounded-lg divide-x divide-y lg:divide-y-0 divide-line bg-surface">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Tracked Units</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{serials.length}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">In Stock</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{inStockCount}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Allocated</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{allocatedCount}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Dispatched</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{dispatchedCount}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput
          placeholder="Search serial, product, SKU, or depot..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="w-full sm:w-96"
        />
        <Select
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          wrapperClassName="w-44"
        />
        <span className="text-xs text-muted sm:ml-auto">{filtered.length} units</span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Barcode}
          title={serials.length === 0 ? 'No serial numbers yet' : 'No matching serials'}
          description={
            serials.length === 0
              ? 'Serial numbers are generated when serialized products are registered or imported.'
              : 'No serial numbers match your search or status filter.'
          }
          action={
            serials.length === 0 ? (
              <LinkButton href="/products">View Product Catalog</LinkButton>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableHead>Serial Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Depot</TableHead>
              <TableHead>Linked Invoice</TableHead>
              <TableHead>Status</TableHead>
            </TableHeader>
            <TableBody>
              {filtered.map((sn) => (
                <TableRow key={sn.id}>
                  <TableCell className="font-mono font-semibold text-ink">{sn.serialNumber}</TableCell>
                  <TableCell>{sn.productName || '—'}</TableCell>
                  <TableCell className="font-mono text-muted">{sn.productSku || '—'}</TableCell>
                  <TableCell className="text-muted">{sn.depotName || '—'}</TableCell>
                  <TableCell>
                    {sn.invoiceNumber ? (
                      <Link href={`/invoices/${sn.invoiceId}`} className="font-mono text-primary hover:underline">
                        {sn.invoiceNumber}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sn.status} />
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
