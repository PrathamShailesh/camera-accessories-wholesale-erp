'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Shipment } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { SearchInput } from '@/components/ui/Input';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { fetchWithCache, invalidateApiCache } from '@/lib/client-cache';

export default function ShipmentsPage() {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchWithCache<Shipment[]>('/api/shipments', undefined, 10000);
      setShipments(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Unable to load shipments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkDelivered = async (shipmentId: string) => {
    setUpdatingId(shipmentId);
    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shipmentId, status: 'DELIVERED' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to mark this shipment as delivered');
      }
      toast({ title: 'Shipment marked delivered', variant: 'success' });
      invalidateApiCache('/api/shipments');
      await loadData();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = shipments.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.airwayBillNumber || '').toLowerCase().includes(q) ||
      (s.shipmentNumber || '').toLowerCase().includes(q) ||
      (s.customerCompany || '').toLowerCase().includes(q) ||
      (s.invoiceNumber || '').toLowerCase().includes(q)
    );
  });

  const inTransit = shipments.filter((s) => s.status !== 'DELIVERED').length;
  const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="04 / DEPOT & FULFILMENT"
        title="Shipments & AWBs"
        description="Dispatched orders, airway bills, and delivery tracking."
      />

      <div className="grid grid-cols-3 border border-line rounded-lg divide-x divide-line bg-surface">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Total Shipments</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{shipments.length}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">In Transit</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{inTransit}</div>
        </div>
        <div className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted">Delivered</div>
          <div className="text-2xl font-semibold text-ink mt-1.5">{delivered}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchInput
          placeholder="Search AWB, shipment, invoice, or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          wrapperClassName="w-full sm:w-96"
        />
        <span className="text-xs text-muted sm:ml-auto">{filtered.length} shipments</span>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : error ? (
        <ErrorState description={error} action={<Button onClick={loadData}>Try Again</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={shipments.length === 0 ? 'No shipments yet' : 'No matching shipments'}
          description={
            shipments.length === 0
              ? 'Shipments appear here once depot orders are packed and dispatched with an airway bill.'
              : 'No shipments match your search.'
          }
          action={shipments.length === 0 && <LinkButton href="/depot/ship">Go to Dispatch</LinkButton>}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableHead>Shipment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Courier / AWB</TableHead>
              <TableHead>Dispatched</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono font-semibold text-ink">{s.shipmentNumber}</TableCell>
                  <TableCell>{s.customerCompany}</TableCell>
                  <TableCell>
                    <Link href={`/invoices/${s.invoiceId}`} className="font-mono text-primary hover:underline">
                      {s.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-ink">{(s.courier || '').replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted font-mono mt-0.5">{s.airwayBillNumber}</div>
                  </TableCell>
                  <TableCell className="text-muted">
                    {formatDate(((s as any).dispatchedAt ?? s.shippingDate) as any)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      {s.trackingUrl && (
                        <a
                          href={s.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Track <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {s.status !== 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={updatingId === s.id}
                          onClick={() => handleMarkDelivered(s.id)}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
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
