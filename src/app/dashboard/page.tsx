'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { TaxInvoice, Shipment, User } from '@/types/erp';
import PrintableDocumentModal from '@/components/pdf/PrintableDocumentModal';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button, LinkButton, IconButton } from '@/components/ui/Button';
import { StatusBadge, MarginBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonKPIRow, SkeletonTable, SkeletonCard } from '@/components/ui/Skeleton';
import { RevenueProfitChart, TrendPoint } from '@/components/dashboard/RevenueProfitChart';
import { CategoryBreakdownChart } from '@/components/dashboard/CategoryBreakdownChart';

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

function greeting(): string {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ type: 'TAX_INVOICE' | 'PROFORMA'; data: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.authenticated && userData.user) setCurrentUser(userData.user);
      }

      const [overviewRes, invoicesRes, shipmentsRes] = await Promise.all([
        fetch('/api/dashboard/overview'),
        fetch('/api/invoices'),
        fetch('/api/shipments'),
      ]);

      if (!overviewRes.ok || !invoicesRes.ok || !shipmentsRes.ok) {
        setError('Unable to load dashboard data.');
        return;
      }

      setOverview(await overviewRes.json());
      const invoicesData = await invoicesRes.json();
      const shipmentsData = await shipmentsRes.json();
      setInvoices((Array.isArray(invoicesData) ? invoicesData : []).slice(0, 6));
      setShipments((Array.isArray(shipmentsData) ? shipmentsData : []).slice(0, 4));
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Something went wrong while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isDepotUser = currentUser?.role === 'DEPOT_USER';

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-12">
        <Skeleton className="h-20 w-full rounded-xl" />
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
      <PageHeader
        title={`${greeting()}${currentUser ? `, ${currentUser.name.split(' ')[0]}` : ''}`}
        description={
          isDepotUser
            ? `Assigned Depot: ${currentUser?.assignedDepotName || '—'} · Live picking & packing queue`
            : `Here's how the business is performing · Operating in USD · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
        }
        actions={
          isDepotUser ? (
            <LinkButton href="/depot" iconLeft={<Boxes className="h-4 w-4" />}>
              Open Pick & Pack Queue
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/proformas/new" iconLeft={<PlusCircle className="h-4 w-4" />}>
                Create Proforma
              </LinkButton>
              <LinkButton href="/documents" variant="outline" iconLeft={<FolderLock className="h-4 w-4 text-info" />}>
                Documents
              </LinkButton>
            </>
          )
        }
      />

      {error && (
        <div className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Revenue"
          value={formatUSD(t.revenue)}
          icon={DollarSign}
          tone="primary"
          restricted={isDepotUser}
          trend={trendFor(cm.revenueChangePct)}
        />
        <KPICard
          label="Gross Profit"
          value={formatUSD(t.grossProfit)}
          icon={TrendingUp}
          tone="success"
          restricted={isDepotUser}
          trend={trendFor(cm.profitChangePct)}
          helperText={`${t.grossMarginPercent}% avg margin`}
        />
        <KPICard
          label="Orders"
          value={t.orders}
          icon={ShoppingCart}
          tone="info"
          trend={trendFor(cm.ordersChangePct)}
        />
        <KPICard
          label="Inventory Value"
          value={formatUSD(t.inventoryValue)}
          icon={Package}
          tone="neutral"
          restricted={isDepotUser}
          helperText={`${t.inventoryUnits.toLocaleString()} units on hand`}
        />
        <KPICard
          label="Pending Proformas"
          value={t.pendingProformas}
          icon={FileCheck2}
          tone="warning"
          helperText="Awaiting confirmation"
        />
        <KPICard
          label="Pending Shipments"
          value={t.pendingShipments}
          icon={Truck}
          tone="warning"
          helperText="Not yet delivered"
        />
      </div>

      {/* Charts */}
      {!isDepotUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue & Profit Trend</CardTitle>
              <Link href="/reports/sales" className="text-xs text-primary hover:underline shrink-0">
                Full report
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

      {/* Top Products / Top Customers */}
      {!isDepotUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <Link href="/reports/profit" className="text-xs text-primary hover:underline shrink-0">
                View all
              </Link>
            </CardHeader>
            {overview!.topProducts.length === 0 ? (
              <EmptyState icon={Package} title="No product sales yet" compact />
            ) : (
              <Table className="border-0 rounded-none">
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
                        <div className="font-medium text-ink">{p.name}</div>
                        <div className="text-[11px] text-muted font-mono">{p.sku}</div>
                      </TableCell>
                      <TableCell align="right">{p.unitsSold}</TableCell>
                      <TableCell align="right" className="font-medium">{formatUSD(p.revenue)}</TableCell>
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
              <Link href="/customers" className="text-xs text-primary hover:underline shrink-0">
                View all
              </Link>
            </CardHeader>
            {overview!.topCustomers.length === 0 ? (
              <EmptyState icon={Building2} title="No customer activity yet" compact />
            ) : (
              <Table className="border-0 rounded-none">
                <TableHeader>
                  <TableHead>Customer</TableHead>
                  <TableHead align="right">Orders</TableHead>
                  <TableHead align="right">Revenue</TableHead>
                  <TableHead align="right">Margin</TableHead>
                </TableHeader>
                <TableBody>
                  {overview!.topCustomers.map((c) => (
                    <TableRow key={c.customerId}>
                      <TableCell className="font-medium text-ink">{c.name}</TableCell>
                      <TableCell align="right">{c.orders}</TableCell>
                      <TableCell align="right" className="font-medium">{formatUSD(c.revenue)}</TableCell>
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

      {/* Depot Performance */}
      {!isDepotUser && overview!.depotPerformance.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Depot Performance</CardTitle>
          </CardHeader>
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Depot</TableHead>
              <TableHead align="right">Sales</TableHead>
              <TableHead align="right">Profit</TableHead>
              <TableHead align="right">Orders</TableHead>
              <TableHead align="right">Inventory</TableHead>
            </TableHeader>
            <TableBody>
              {overview!.depotPerformance.map((d) => (
                <TableRow key={d.depotId}>
                  <TableCell className="font-medium text-ink">{d.name}</TableCell>
                  <TableCell align="right">{formatUSD(d.revenue)}</TableCell>
                  <TableCell align="right">{formatUSD(d.profit)}</TableCell>
                  <TableCell align="right">{d.orders}</TableCell>
                  <TableCell align="right">
                    {d.inventoryUnits.toLocaleString()} units
                    <span className="text-muted"> · {formatUSD(d.inventoryValue)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Tax Invoices & Active Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-3">
          <SectionHeader
            title="Tax Invoices & Fulfilment Queue"
            actions={
              <Link href="/invoices" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
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
              <Table className="border-0 rounded-none">
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
                        <Link href={`/invoices/${inv.id}`} className="font-mono font-semibold text-primary hover:underline text-xs">
                          {inv.invoiceNumber}
                        </Link>
                        {inv.proformaNumber && <div className="text-[10px] text-muted font-mono">From: {inv.proformaNumber}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-ink text-xs">{inv.customerCompany}</div>
                        <div className="text-[11px] text-muted">{inv.customerName}</div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Building2 className="h-3.5 w-3.5" />
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
                            <Printer className="h-3.5 w-3.5" />
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
            title="Active Dispatches"
            actions={
              <Link href="/shipments" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
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
                <Card key={shp.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-info bg-info-soft px-2 py-0.5 rounded">
                        {shp.courier.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-xs font-semibold text-ink mt-1.5">{shp.customerCompany}</h4>
                      <p className="text-[11px] font-mono text-muted">AWB: {shp.airwayBillNumber}</p>
                    </div>
                    <StatusBadge status={shp.status} />
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-muted text-[11px] text-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Origin Depot</span>
                      <span className="text-ink font-medium">{shp.depotName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weight & Boxes</span>
                      <span className="text-ink font-mono">{shp.weightKg} kg ({shp.packageCount} box)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={shp.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Live Tracking
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
