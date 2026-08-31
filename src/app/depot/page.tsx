'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Boxes,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { User, TaxInvoice } from '@/types/erp';

export default function DepotDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState(true);

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
          setInvoices(await res.json());
        }
      } catch {}

      setLoading(false);
    };

    loadData();
  }, []);

  const readyToPick = invoices.filter((i) => i.fulfilmentStatus === 'READY_FOR_PACKING');
  const inPacking = invoices.filter((i) => i.fulfilmentStatus === 'PROCESSING' || i.fulfilmentStatus === 'PACKED');
  const dispatched = invoices.filter((i) => i.fulfilmentStatus === 'SHIPPED' || i.fulfilmentStatus === 'DELIVERED');

  const statCards = [
    {
      title: 'Ready to Pick',
      value: readyToPick.length,
      icon: Boxes,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      href: '/depot/pick',
    },
    {
      title: 'In Packing',
      value: inPacking.length,
      icon: Package,
      color: 'text-brand-400',
      bgColor: 'bg-brand-500/10',
      borderColor: 'border-brand-500/30',
      href: '/depot/pack',
    },
    {
      title: 'Dispatched',
      value: dispatched.length,
      icon: Truck,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      href: '/depot/ship',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading depot dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Depot Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Depot Dashboard</h1>
          <p className="text-slate-400 mt-1">
            {currentUser?.assignedDepotName || 'Warehouse Operations'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Smartphone className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">
            Depot System Active
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.title}
              href={stat.href}
              className="p-6 rounded-2xl border bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bgColor} ${stat.borderColor} border flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm text-slate-400 group-hover:text-white transition-colors">
                <span>View details</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </a>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Recent Orders</h2>
        
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400/50" />
            <p>No orders in your depot</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    invoice.fulfilmentStatus === 'READY_FOR_PACKING' 
                      ? 'bg-amber-500/10 text-amber-400'
                      : invoice.fulfilmentStatus === 'PACKED' || invoice.fulfilmentStatus === 'PROCESSING'
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {invoice.fulfilmentStatus === 'READY_FOR_PACKING' && <Boxes className="h-5 w-5" />}
                    {(invoice.fulfilmentStatus === 'PACKED' || invoice.fulfilmentStatus === 'PROCESSING') && <Package className="h-5 w-5" />}
                    {(invoice.fulfilmentStatus === 'SHIPPED' || invoice.fulfilmentStatus === 'DELIVERED') && <Truck className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{invoice.customerCompany}</p>
                    <p className="text-sm text-slate-400">{invoice.invoiceNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invoice.fulfilmentStatus === 'READY_FOR_PACKING' 
                      ? 'bg-amber-500/10 text-amber-400'
                      : invoice.fulfilmentStatus === 'PACKED' || invoice.fulfilmentStatus === 'PROCESSING'
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {invoice.fulfilmentStatus}
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
