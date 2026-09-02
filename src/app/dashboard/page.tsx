'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  FileCheck2,
  Truck,
  ShoppingCart,
  Printer,
  Receipt,
  Building2,
  ExternalLink,
  PlusCircle,
  FolderLock,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { TaxInvoice, Shipment, User } from '@/types/erp';
import { fetchCurrentUserCached, getCurrentUserCachedSync, fetchWithCache } from '@/lib/client-cache';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { StatusBadge, MarginBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonKPIRow, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';
import type { TrendPoint } from '@/components/dashboard/RevenueProfitChart';

const RevenueProfitChart = dynamic(
  () => import('@/components/dashboard/RevenueProfitChart').then((m) => m.RevenueProfitChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
const CategoryBreakdownChart = dynamic(
  () => import('@/components/dashboard/CategoryBreakdownChart').then((m) => m.CategoryBreakdownChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

interface OverviewData {
  totals: {
    revenue: number;
    grossProfit: number;
    grossMarginPercent: number;
    orders: number;
    inventoryUnits: number;
    inventoryValue: number;
    pendingProformas: number;
    pendingShipments: number;
  };
  currentMonth: {
    revenue: number;
    profit: number;
    orders: number;
    revenueChangePct: number | null;
    profitChangePct: number | null;
    ordersChangePct: number | null;
  };
  trend: TrendPoint[];
  salesByCategory: { name: string; revenue: number; units: number }[];
  topProducts: { productId: string; name: string; sku: string; brand: string; unitsSold: number; revenue: number; profit: number; marginPercent: number }[];
  topCustomers: { customerId: string; name: string; orders: number; revenue: number; profit: number; marginPercent: number }[];
  depotPerformance: { depotId: string; name: string; revenue: number; profit: number; orders: number; inventoryUnits: number; inventoryValue: number }[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function trendFor(pct: number | null, positiveIsGood = true) {
  if (pct === null) return undefined;
  return {
    direction: (pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
    value: `${pct > 0 ? '+' : ''}${pct}%`,
    label: 'vs last month',
    positiveIsGood,
  };
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUserCachedSync()?.user || null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ type: 'TAX_INVOICE' | 'PROFORMA'; data: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last 30 days');

  const loadData = async (isBackground = false) => {
    if (!isBackground && !overview) {
      setError(null);
    }
    try {
      // Parallel non-blocking requests using client-side cache
      const [userData, overviewData, invoicesData, shipmentsData] = await Promise.all([
        fetchCurrentUserCached(),
        fetchWithCache<OverviewData>('/api/dashboard/overview', undefined, 20000),
        fetchWithCache<TaxInvoice[]>('/api/invoices?limit=6', undefined, 15000),
        fetchWithCache<Shipment[]>('/api/shipments?limit=4', undefined, 15000),
      ]);

      if (userData?.authenticated && userData.user) {
        setCurrentUser(userData.user);
      }

      if (overviewData) setOverview(overviewData);
      if (Array.isArray(invoicesData)) setInvoices(invoicesData.slice(0, 6));
      if (Array.isArray(shipmentsData)) setShipments(shipmentsData.slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (!overview) {
        setError('Something went wrong while loading the dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDepotUser = currentUser?.role === 'DEPOT_USER';
  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Administrator';

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <Skeleton className="h-16 w-full rounded-lg" />
        <SkeletonKPIRow count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonCard className="lg:col-span-2 h-80" />
          <SkeletonCard className="h-80" />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        description={error}
        action={<Button onClick={() => { setLoading(true); loadData(); }}>Try Again</Button>}
      />
    );
  }

  const t = overview!.totals;
  const cm = overview!.currentMonth;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Executive Header */}
      <PageHeader
        eyebrow="01 / OVERVIEW"
        title={`${getGreeting()}, ${userName}`}
        description="Here's how ARIB GLOBAL is performing today."
        actions={
          <>
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent border-none p-0 text-xs font-medium text-slate-700 focus:ring-0 cursor-pointer"
              >
                <option value="Today">Today</option>
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="This Quarter">This Quarter</option>
                <option value="Year to Date">Year to Date</option>
              </select>
            </div>

            <Button
              size="sm"
              variant="outline"
              iconLeft={<SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />}
              className="text-xs text-slate-700 border-slate-200"
            >
              Customize
            </Button>

            {isDepotUser ? (
              <LinkButton href="/depot" iconLeft={<Boxes className="h-4 w-4" />} size="sm">
                Open Depot Queue
              </LinkButton>
            ) : (
              <LinkButton href="/proformas/new" iconLeft={<PlusCircle className="h-4 w-4" />} size="sm">
                New Proforma
              </LinkButton>
            )}
          </>
        }
      />

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>
      )}

      {/* Business Overview KPI Cards */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Business Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <KPICard
            label="Revenue"
            value={formatUSD(t.revenue)}
            restricted={isDepotUser}
            trend={trendFor(cm.revenueChangePct)}
          />
          <KPICard
            label="Gross Profit"
            value={formatUSD(t.grossProfit)}
            restricted={isDepotUser}
            trend={trendFor(cm.profitChangePct)}
            helperText={`${t.grossMarginPercent}% margin`}
          />
          <KPICard
            label="Orders"
            value={t.orders}
            trend={trendFor(cm.ordersChangePct)}
          />
          <KPICard
            label="Inventory Value"
            value={formatUSD(t.inventoryValue)}
            restricted={isDepotUser}
            helperText={`${t.inventoryUnits.toLocaleString()} units`}
          />
          <KPICard
            label="Pending Proformas"
            value={t.pendingProformas}
            helperText="Awaiting conversion"
          />
          <KPICard
            label="Pending Shipments"
            value={t.pendingShipments}
            helperText="Awaiting delivery"
          />
        </div>
      </div>

      {/* Main Charts Row */}
      {!isDepotUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue & Profit</CardTitle>
              <Link href="/reports/sales" className="text-xs text-brand-600 font-medium hover:underline shrink-0">
                Full analytics
              </Link>
            </CardHeader>
            <CardContent>
              {overview!.trend.every((p) => p.revenue === 0) ? (
                <EmptyState icon={TrendingUp} title="No sales yet" description="Revenue and profit trends will appear once invoices are issued." compact />
              ) : (
                <RevenueProfitChart data={overview!.trend} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {overview!.salesByCategory.length === 0 ? (
                <EmptyState icon={Package} title="No category data" compact />
              ) : (
                <CategoryBreakdownChart data={overview!.salesByCategory} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Products & Top Customers */}
      {!isDepotUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <Link href="/reports/profit" className="text-xs text-brand-600 font-medium hover:underline shrink-0">
                View catalog
              </Link>
            </CardHeader>
            {overview!.topProducts.length === 0 ? (
              <EmptyState icon={Package} title="No product sales yet" compact />
            ) : (
              <Table className="border-0 rounded-none shadow-none">
                <TableHeader>
                  <TableHead>Product</TableHead>
                  <TableHead align="right">Units</TableHead>
                  <TableHead align="right">Revenue</TableHead>
                  <TableHead align="right">Margin</TableHead>
                </TableHeader>
                <TableBody>
                  {overview!.topProducts.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                      </TableCell>
                      <TableCell align="right">{p.unitsSold}</TableCell>
                      <TableCell align="right" className="font-semibold">{formatUSD(p.revenue)}</TableCell>
                      <TableCell align="right">
                        <MarginBadge marginPercent={p.marginPercent} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <Link href="/customers" className="text-xs text-brand-600 font-medium hover:underline shrink-0">
                View all
              </Link>
            </CardHeader>
            {overview!.topCustomers.length === 0 ? (
              <EmptyState icon={Building2} title="No customer activity yet" compact />
            ) : (
              <Table className="border-0 rounded-none shadow-none">
                <TableHeader>
                  <TableHead>Customer</TableHead>
                  <TableHead align="right">Orders</TableHead>
                  <TableHead align="right">Revenue</TableHead>
                  <TableHead align="right">Margin</TableHead>
                </TableHeader>
                <TableBody>
                  {overview!.topCustomers.map((c) => (
                    <TableRow key={c.customerId}>
                      <TableCell className="font-semibold text-slate-900">{c.name}</TableCell>
                      <TableCell align="right">{c.orders}</TableCell>
                      <TableCell align="right" className="font-semibold">{formatUSD(c.revenue)}</TableCell>
                      <TableCell align="right">
                        <MarginBadge marginPercent={c.marginPercent} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* Depot Performance Table */}
      {!isDepotUser && overview!.depotPerformance.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Depot Performance</CardTitle>
            <Link href="/depots" className="text-xs text-brand-600 font-medium hover:underline shrink-0">
              Manage hubs
            </Link>
          </CardHeader>
          <Table className="border-0 rounded-none shadow-none">
            <TableHeader>
              <TableHead>Depot Hub</TableHead>
              <TableHead align="right">Sales</TableHead>
              <TableHead align="right">Profit</TableHead>
              <TableHead align="right">Orders</TableHead>
              <TableHead align="right">Inventory Units</TableHead>
            </TableHeader>
            <TableBody>
              {overview!.depotPerformance.map((d) => (
                <TableRow key={d.depotId}>
                  <TableCell className="font-semibold text-slate-900">{d.name}</TableCell>
                  <TableCell align="right">{formatUSD(d.revenue)}</TableCell>
                  <TableCell align="right" className="text-emerald-700 font-medium">{formatUSD(d.profit)}</TableCell>
                  <TableCell align="right">{d.orders}</TableCell>
                  <TableCell align="right" className="font-mono text-slate-700">
                    {d.inventoryUnits.toLocaleString()} units
                    <span className="text-slate-400 font-sans"> ({formatUSD(d.inventoryValue)})</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tax Invoices & Active Dispatches Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <SectionHeader
            title="Tax Invoices & Fulfilment Queue"
            actions={
              <Link href="/invoices" className="text-xs text-brand-600 font-medium hover:underline">
                View all invoices
              </Link>
            }
          />
          <Card className="p-0 overflow-hidden">
            {invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No Tax Invoices Yet"
                description="Tax invoices will appear here once converted from a confirmed proforma."
                action={
                  <LinkButton href="/proformas/new" iconLeft={<PlusCircle className="h-4 w-4" />}>
                    Create First Proforma
                  </LinkButton>
                }
              />
            ) : (
              <Table className="border-0 rounded-none shadow-none">
                <TableHeader>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead align="right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link href={`/invoices/${inv.id}`} className="font-mono font-semibold text-brand-600 hover:underline text-xs">
                          {inv.invoiceNumber}
                        </Link>
                        {inv.proformaNumber && <div className="text-[10px] text-slate-400 font-mono">From: {inv.proformaNumber}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-xs">{inv.customerCompany}</div>
                        <div className="text-[11px] text-slate-500">{inv.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {inv.depotName.replace(' Depot', '').replace(' Hub', '')}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="font-mono font-semibold text-xs">
                        {!isDepotUser ? formatUSD(inv.grandTotal) : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.fulfilmentStatus} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label="Print / PDF" onClick={() => setSelectedDoc({ type: 'TAX_INVOICE', data: inv })}>
                            <Printer className="h-3.5 w-3.5 text-slate-500" />
                          </IconButton>
                          <LinkButton href={`/invoices/${inv.id}`} size="sm" variant="secondary">
                            Open
                          </LinkButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <SectionHeader
            title="Recent Activity & Dispatches"
            actions={
              <Link href="/shipments" className="text-xs text-brand-600 font-medium hover:underline">
                All AWBs
              </Link>
            }
          />
          <div className="flex flex-col gap-3">
            {shipments.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Truck}
                  title="No Active Dispatches"
                  description="Dispatched orders will appear here with live courier tracking."
                  compact
                />
              </Card>
            ) : (
              shipments.map((shp) => (
                <Card key={shp.id} className="p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase">
                        {shp.courier.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-900 mt-1.5">{shp.customerCompany}</h4>
                      <p className="text-[11px] font-mono text-slate-500">AWB: {shp.airwayBillNumber}</p>
                    </div>
                    <StatusBadge status={shp.status} />
                  </div>

                  <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                    <div className="flex justify-between">
                      <span>Depot</span>
                      <span className="text-slate-900 font-medium">{shp.depotName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package</span>
                      <span className="text-slate-900 font-mono">{shp.weightKg} kg ({shp.packageCount} box)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <a
                      href={shp.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      Track Shipment
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <LinkButton href={`/shipments/${shp.id}`} size="sm" variant="secondary">
                      Details
                    </LinkButton>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

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
