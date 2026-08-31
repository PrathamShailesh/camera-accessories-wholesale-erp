'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, CheckCircle2, Printer, Search } from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';

export default function DepotPickPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
          const filtered = allInvoices.filter((inv: any) => inv.fulfilmentStatus === 'READY_FOR_PACKING');
          setInvoices(filtered);
        }
      } catch {}
    };

    loadData();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePickOrder = async (inv: TaxInvoice) => {
    const itemPicks = inv.items.map((i) => ({ id: i.id, isPicked: true }));
    const res = await fetch(`/api/invoices/${inv.id}/pick`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemPicks }) });
    if (res.ok) setInvoices((items) => items.filter((i) => i.id !== inv.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pick Orders</h1>
          <p className="text-slate-400 mt-1">Select items and allocate serial numbers</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400/50" />
          <p className="text-slate-400">No orders ready to pick</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{invoice.customerCompany}</h3>
                  <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                </div>
                <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
                  <Printer className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      {item.allocatedSerials && item.allocatedSerials.length > 0 && (
                        <p className="text-xs text-brand-400 mt-1">
                          Serials: {item.allocatedSerials.join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePickOrder(invoice)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirm Pick & Move to Packing</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
