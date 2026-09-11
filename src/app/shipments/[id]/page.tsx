'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  ArrowLeft,
  ExternalLink,
  Building2,
  Package,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Receipt,
  MapPin,
} from 'lucide-react';
import { formatUSD, formatDate } from '@/lib/utils';
import { Shipment, TaxInvoice } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingDelivered, setIsMarkingDelivered] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shipments/${id}`);
      if (!res.ok) {
        setShipment(null);
        return;
      }
      const s = await res.json();
      setShipment(s);

      if (s.invoiceId) {
        try {
          const invRes = await fetch(`/api/invoices/${s.invoiceId}`);
          if (invRes.ok) {
            const inv = await invRes.json();
            setInvoice(inv);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error loading shipment detail:', err);
      setShipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleMarkDelivered = async () => {
    if (!shipment) return;
    setIsMarkingDelivered(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update delivery status');
      }

      toast({ title: 'Shipment marked as DELIVERED', variant: 'success' });
      setShipment((prev) => (prev ? { ...prev, status: 'DELIVERED' } : null));
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    } finally {
      setIsMarkingDelivered(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-muted text-xs font-medium animate-pulse">
          Loading shipment consignment and tracking status...
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-muted text-sm font-semibold">Shipment record not found</div>
        <LinkButton href="/shipments" variant="outline" size="sm">
          Back to Shipments
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        breadcrumbs={[{ label: 'Shipments', href: '/shipments' }, { label: shipment.shipmentNumber }]}
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="font-mono">{shipment.shipmentNumber}</span>
            <StatusBadge status={shipment.status} />
          </span>
        }
        description={`Carrier: ${shipment.courier.replace(/_/g, ' ')} · AWB: ${shipment.airwayBillNumber} · Destination: ${shipment.destinationCountry}`}
        actions={
          <div className="flex items-center gap-2">
            {shipment.trackingUrl && (
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
              >
                Track Live <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {shipment.status !== 'DELIVERED' && (
              <Button
                variant="outline"
                size="sm"
                loading={isMarkingDelivered}
                iconLeft={<CheckCircle2 className="h-4 w-4 text-success" />}
                onClick={handleMarkDelivered}
              >
                Mark Delivered
              </Button>
            )}
            {shipment.invoiceId && (
              <LinkButton
                href={`/invoices/${shipment.invoiceId}`}
                size="sm"
                variant="secondary"
                iconLeft={<Receipt className="h-4 w-4" />}
              >
                View Invoice
              </LinkButton>
            )}
          </div>
        }
      />

      {/* Shipment Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Consignment Specs & Origin
          </h3>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-line-soft">
              <span className="text-muted font-sans">Gross Weight</span>
              <span className="text-ink font-bold">{shipment.weightKg} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line-soft">
              <span className="text-muted font-sans">Carton / Box Count</span>
              <span className="text-ink font-bold">{shipment.packageCount} Carton</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line-soft">
              <span className="text-muted font-sans">Origin Depot Hub</span>
              <span className="text-ink font-sans font-semibold">{shipment.depotName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-line-soft">
              <span className="text-muted font-sans">Airway Bill Number</span>
              <span className="text-primary font-bold">{shipment.airwayBillNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted font-sans">Dispatched Date</span>
              <span className="text-ink-secondary font-sans">{formatDate(shipment.shippingDate)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Delivery Destination & Consignee
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-surface border border-line">
              <div className="font-bold text-ink text-sm">{shipment.customerCompany}</div>
              <div className="text-ink-secondary mt-0.5">Attn: {shipment.customerName}</div>
              <div className="flex items-start gap-1.5 text-muted mt-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted shrink-0" />
                <span className="leading-relaxed">{shipment.shippingAddress || 'Address on file'}</span>
              </div>
            </div>

            {invoice && (
              <div className="p-3 rounded-lg border border-line-soft space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted font-sans">Linked Invoice:</span>
                  <Link href={`/invoices/${invoice.id}`} className="text-primary font-bold hover:underline">
                    {invoice.invoiceNumber}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted font-sans">Invoice Total:</span>
                  <span className="text-ink font-bold">{formatUSD(invoice.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
