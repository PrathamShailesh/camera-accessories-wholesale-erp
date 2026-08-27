'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  Truck,
  FileCheck2,
  Receipt,
  Building2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  PlusCircle,
  FolderLock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Camera,
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react';
import { formatUSD, formatDate, getStatusBadgeClasses } from '@/lib/utils';
import { TaxInvoice, Shipment, BusinessInsight, ProfitabilityMetric, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-admin',
    name: 'Sarah Jenkins',
    email: 'sarah.admin@lenscore.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 890 1200',
    status: 'ACTIVE',
    lastLogin: new Date().toISOString(),
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [metrics, setMetrics] = useState<ProfitabilityMetric[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ type: 'TAX_INVOICE' | 'PROFORMA'; data: any } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // Load current user from session
      try {
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.authenticated && userData.user) {
            setCurrentUser(userData.user);
          }
        } else if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('erp_current_user');
          if (storedUser) setCurrentUser(JSON.parse(storedUser));
        }
      } catch {}

      const [dashboardRes, invoicesRes, shipmentsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/invoices'),
        fetch('/api/shipments'),
      ]);
      const dashboard = await dashboardRes.json();
      const invoicesData = await invoicesRes.json();
      const shipmentsData = await shipmentsRes.json();
      setDashboardData(dashboard);
      setInvoices(invoicesData);
      setShipments(shipmentsData);
      
      // Generate insights from dashboard data
      const generatedInsights: BusinessInsight[] = [];
      if (dashboard.pendingInvoices > 5) {
        generatedInsights.push({
          id: 'ins-1',
          type: 'DEPOT_BOTTLENECK',
          urgency: 'WARNING',
          title: 'High Pending Order Volume',
          message: `${dashboard.pendingInvoices} orders awaiting packing. Consider allocating more warehouse staff.`,
          actionLabel: 'View Order Pipeline',
          actionLink: '/invoices',
        });
      }
      if (dashboard.totalStockUnits < 1000) {
        generatedInsights.push({
          id: 'ins-2',
          type: 'LOW_STOCK_WARNING',
          urgency: 'INFO',
          title: 'Low Stock Alert',
          message: 'Total inventory across all depots is below 1000 units. Review stock levels.',
          actionLabel: 'View Inventory',
          actionLink: '/inventory',
        });
      }
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const isDepotUser = currentUser.role === 'DEPOT_USER';

  // Calculate totals from dashboard data
  const totalSales = invoices
    .filter((i) => i.fulfilmentStatus !== 'CANCELLED')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalGrossProfit = metrics.reduce((sum, m) => sum + m.grossProfit, 0);
  const avgMargin = totalSales > 0 ? ((totalGrossProfit / totalSales) * 100).toFixed(1) : '24.5';

  const pendingFulfilment = dashboardData?.pendingInvoices || 0;
  const totalInventoryUnits = dashboardData?.totalStockUnits || 0;
  const totalInventoryVal = dashboardData?.totalStockValue || 0;

  const lowStockCount = 0; // Would need API endpoint for this

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-925 shadow-glass">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 font-semibold mb-1">
            <Sparkles className="h-4 w-4" />
            <span>WHOLESALE OPERATIONS CONTROL CENTER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {isDepotUser
              ? `Assigned Depot: ${currentUser.assignedDepotName} • Live Picking & Packing Queue`
              : `Operating in USD ($) • 4 Regional Depots Active (Dubai, Bangalore, Mumbai, Singapore)`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isDepotUser ? (
            <>
              <Link
                href="/proformas/new"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Proforma</span>
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
              >
                <FolderLock className="h-4 w-4 text-cyan-400" />
                <span>Cloud Documents</span>
              </Link>
            </>
          ) : (
            <Link
              href="/depot-mobile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all"
            >
              <Boxes className="h-4 w-4" />
              <span>Open Mobile Pick & Pack Queue</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total B2B Revenue</span>
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {!isDepotUser ? formatUSD(totalSales) : '— (Restricted)'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.4% vs last month</span>
            </div>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gross Profit (Margin)</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {!isDepotUser ? `${formatUSD(totalGrossProfit)}` : '— (Restricted)'}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <span className="text-emerald-400 font-bold font-mono">{avgMargin}%</span>
              <span>avg wholesale margin</span>
            </div>
          </div>
        </div>

        {/* Pending Depot Fulfilment */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Packing & Dispatch</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-amber-400 font-mono">
              {pendingFulfilment} Orders
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Assigned to Dubai & Bangalore</span>
            </div>
          </div>
        </div>

        {/* Total Inventory Asset Value */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Inventory Stock & Value</span>
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {totalInventoryUnits} Units
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
              <span className="font-mono">{formatUSD(totalInventoryVal)}</span>
              {lowStockCount > 0 && (
                <span className="text-rose-400 font-medium">{lowStockCount} Low</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Intelligence Insights Strip */}
      {!isDepotUser && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Automated Business Intelligence & Operational Insights
              </h2>
            </div>
            <Link
              href="/reports/profit"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        insight.urgency === 'ALERT'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : insight.urgency === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      }`}
                    >
                      {insight.type.replace('_', ' ')}
                    </span>
                    {insight.metricValue && (
                      <span className="text-xs font-mono font-bold text-white">
                        {insight.metricValue}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{insight.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {insight.actionLink && (
                  <Link
                    href={insight.actionLink}
                    className="mt-3 text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>{insight.actionLabel || 'Investigate'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Tax Invoices & Active Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tax Invoices & Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Tax Invoices & Fulfilment Queue
              </h2>
            </div>
            <Link
              href="/invoices"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
            >
              <span>View all invoices</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Depot</th>
                    <th>Total (USD)</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((inv) => {
                    const badge = getStatusBadgeClasses(inv.fulfilmentStatus);
                    return (
                      <tr key={inv.id}>
                        <td>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-mono font-bold text-brand-400 hover:underline text-xs"
                          >
                            {inv.invoiceNumber}
                          </Link>
                          {inv.proformaNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              From: {inv.proformaNumber}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="font-semibold text-white text-xs">{inv.customerCompany}</div>
                          <div className="text-[10px] text-slate-400">{inv.customerName}</div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            {inv.depotName.replace(' Depot', '').replace(' Hub', '')}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-xs text-white">
                          {!isDepotUser ? formatUSD(inv.grandTotal) : '—'}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {inv.fulfilmentStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDoc({ type: 'TAX_INVOICE', data: inv })}
                              title="Print / PDF"
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200"
                            >
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Shipments & Airway Bills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Active Dispatches</h2>
            </div>
            <Link
              href="/shipments"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>All AWBs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {shipments.map((shp) => (
              <div
                key={shp.id}
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {shp.courier.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{shp.customerCompany}</h4>
                    <p className="text-[11px] font-mono text-slate-400">AWB: {shp.airwayBillNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {shp.status}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Origin Depot:</span>
                    <span className="text-slate-200 font-medium">{shp.depotName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight & Boxes:</span>
                    <span className="text-slate-200 font-mono">{shp.weightKg} kg ({shp.packageCount} box)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispatched By:</span>
                    <span className="text-slate-200">{shp.dispatchedBy || 'Depot Operator'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={shp.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>Live Tracking</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <Link
                    href={`/shipments/${shp.id}`}
                    className="text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Modal */}
      {selectedDoc && (
        <PrintableDocumentModal
          isOpen={true}
          onClose={() => setSelectedDoc(null)}
          documentType={selectedDoc.type}
          data={selectedDoc.data}
        />
      )}
    </div>
  );
}
