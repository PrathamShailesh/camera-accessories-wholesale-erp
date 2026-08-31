'use client';

import React, { useState, useEffect } from 'react';
import { Package, Camera, CheckCircle2, Upload } from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';

export default function DepotPackPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);

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
          const filtered = allInvoices.filter((inv: any) => inv.fulfilmentStatus === 'PROCESSING' || inv.fulfilmentStatus === 'PACKED');
          setInvoices(filtered);
        }
      } catch {}
    };

    loadData();
  }, []);

  const handlePackOrder = async (inv: TaxInvoice) => {
    const res = await fetch(`/api/invoices/${inv.id}/pack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packedBy: currentUser?.name, packageCount: 1, totalWeightKg: 6.8, dimensionsCm: { length: 45, width: 35, height: 25 } }) });
    if (res.ok) setInvoices((items) => items.filter((i) => i.id !== inv.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pack Orders</h1>
        <p className="text-slate-400 mt-1">Verify items, take photos, and prepare for shipping</p>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <Package className="h-12 w-12 mx-auto mb-3 text-brand-400/50" />
          <p className="text-slate-400">No orders in packing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    invoice.fulfilmentStatus === 'PACKED' 
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {invoice.fulfilmentStatus}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{invoice.customerCompany}</h3>
                  <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm text-white">Package Photo</span>
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </button>
                </div>

                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <p className="font-medium text-white">{item.productName}</p>
                    <span className="px-3 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-sm font-bold">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {invoice.fulfilmentStatus !== 'PACKED' ? (
                <button
                  onClick={() => handlePackOrder(invoice)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all"
                >
                  <Package className="h-5 w-5" />
                  <span>Mark Packed & Verified</span>
                </button>
              ) : (
                <div className="text-center py-3 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 inline mr-2" />
                  Ready for shipping
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
