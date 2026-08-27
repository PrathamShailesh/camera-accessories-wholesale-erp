'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  Camera,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { Shipment, TaxInvoice } from '@/types/erp';

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [invoice, setInvoice] = useState<TaxInvoice | null>(null);

  const loadData = async () => {
    const s = dataStore.getShipmentById(id);
    if (s) {
      setShipment(s);
      try {
        const res = await fetch(`/api/invoices/${s.invoiceId}`);
        if (res.ok) {
          const inv = await res.json();
          setInvoice(inv);
        } else {
          const fallbackInv = dataStore.getInvoiceById(s.invoiceId);
          if (fallbackInv) setInvoice(fallbackInv);
        }
      } catch {
        const fallbackInv = dataStore.getInvoiceById(s.invoiceId);
        if (fallbackInv) setInvoice(fallbackInv);
      }
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (!shipment) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="text-slate-400 text-sm">Shipment record not found</div>
        <Link href="/shipments" className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-white">
          Back to Shipments
        </Link>
      </div>
    );
  }

  const badge = getStatusBadgeClasses(shipment.status);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/shipments"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                {shipment.shipmentNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                {shipment.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Carrier: <strong>{shipment.courier.replace(/_/g, ' ')}</strong> • AWB: <strong className="text-sky-300 font-mono">{shipment.airwayBillNumber}</strong>
            </p>
          </div>
        </div>

        <a
          href={shipment.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-glow"
        >
          <span>Track Carrier Live</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Shipment Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Consignment Specs & Weight
          </h3>
          <div className="space-y-2 text-slate-300 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Gross Weight:</span>
              <span className="text-white font-bold">{shipment.weightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Box Count:</span>
              <span className="text-white">{shipment.packageCount} Carton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Origin Depot:</span>
              <span className="text-white font-sans">{shipment.depotName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Dispatched Date:</span>
              <span className="text-white font-sans">{formatDate(shipment.shippingDate)}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Delivery Destination
          </h3>
          <div className="space-y-1">
            <div className="font-bold text-white text-sm">{shipment.customerCompany}</div>
            <div className="text-slate-400">{shipment.customerName}</div>
            <p className="text-slate-400 mt-1 leading-relaxed">{shipment.shippingAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
