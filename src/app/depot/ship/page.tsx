'use client';

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, ExternalLink } from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';

export default function DepotShipPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [awbInputs, setAwbInputs] = useState<Record<string, string>>({});
  const [courierInputs, setCourierInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      let user: User | null = null;

      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.authenticated && userData.user) {
            user = userData.user;
            setCurrentUser(user);
          }
        }
      } catch {}

      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          const allInvoices = await res.json();
          const filtered = allInvoices.filter((inv: any) => {
            const statusMatch = ['PACKED', 'SHIPPED', 'DELIVERED'].includes(inv.fulfilmentStatus);
            const depotMatch = !user?.assignedDepotId || inv.depotId === user.assignedDepotId;
            return statusMatch && depotMatch;
          });
          setInvoices(filtered);
        }
      } catch {}
    };

    loadData();
  }, []);

  const handleQuickShip = async (inv: TaxInvoice) => {
    const awbNumber = awbInputs[inv.id] || '';
    if (!awbNumber.trim()) {
      alert('Please enter an Airway Bill number');
      return;
    }
    const courier = courierInputs[inv.id] || 'DHL_EXPRESS';
    const res = await fetch(`/api/invoices/${inv.id}/ship`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courier, airwayBillNumber: awbNumber.trim(), trackingUrl: `https://www.dhl.com/en/express/tracking.html?AWB=${awbNumber.replace(/[^0-9]/g, '')}`, weightKg: 6.8, packageCount: 1 }) });
    if (res.ok) {
      setAwbInputs(prev => ({ ...prev, [inv.id]: '' }));
      setInvoices((items) => items.filter((i) => i.id !== inv.id));
      alert('Shipment created successfully!');
    } else {
      const error = await res.json();
      alert(`Failed to create shipment: ${error.error || 'Unknown error'}`);
    }
  };

  const packedOrders = invoices.filter(i => i.fulfilmentStatus === 'PACKED');
  const shippedOrders = invoices.filter(i => i.fulfilmentStatus === 'SHIPPED' || i.fulfilmentStatus === 'DELIVERED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ship Orders</h1>
        <p className="text-slate-400 mt-1">Create shipments and generate airway bills</p>
      </div>

      {/* Ready to Ship */}
      {packedOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Ready to Ship</h2>
          {packedOrders.map((invoice) => (
            <div key={invoice.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{invoice.customerCompany}</h3>
                  <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold bg-brand-500/10 text-brand-400">
                  PACKED
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Airway Bill Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DHL-9482103847"
                    value={awbInputs[invoice.id] || ''}
                    onChange={(e) => setAwbInputs(prev => ({ ...prev, [invoice.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Courier</label>
                  <select
                    value={courierInputs[invoice.id] || 'DHL_EXPRESS'}
                    onChange={(e) => setCourierInputs(prev => ({ ...prev, [invoice.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DHL_EXPRESS">DHL Express</option>
                    <option value="FEDEX_INTERNATIONAL">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="ARAMEX">Aramex</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleQuickShip(invoice)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
              >
                <Truck className="h-5 w-5" />
                <span>Create Shipment & Dispatch</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shipped Orders */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Shipped Orders</h2>
        {shippedOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Truck className="h-12 w-12 mx-auto mb-3 text-cyan-400/50" />
            <p className="text-slate-400">No shipped orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shippedOrders.map((invoice) => (
              <div key={invoice.id} className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white">{invoice.customerCompany}</h3>
                    <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    invoice.fulfilmentStatus === 'DELIVERED' 
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {invoice.fulfilmentStatus}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-slate-400">{invoice.shippingAddress}</p>
                  <span className="flex items-center gap-1 text-sm text-cyan-400">
                    <ExternalLink className="h-4 w-4" />
                    <span>Track</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
