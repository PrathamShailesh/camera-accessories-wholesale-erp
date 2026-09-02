'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { ProfitabilityMetric, BusinessInsight } from '@/types/erp';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { MarginBadge, Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function ProfitabilityPage() {
  const [metrics, setMetrics] = useState<ProfitabilityMetric[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);

  const loadData = async () => {
    const res = await fetch('/api/dashboard/stats');
    if (res.ok) {
      const data = await res.json();
      setMetrics(data.profitability || []);
      setInsights(data.insights || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = metrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
  const totalProfit = metrics.reduce((sum, m) => sum + m.grossProfit, 0);
  const overallMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;

  return (
    <div className="flex flex-col gap-6 pb-16">
      <PageHeader
        eyebrow="06 / ANALYTICS"
        title="Profitability"
        description="Executive margin analysis across equipment models, categories, and customer channels."
      />

      {/* Top Margin KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <KPICard
          label="Total Revenue"
          value={formatUSD(totalRevenue)}
          helperText="Gross invoiced volume"
        />
        <KPICard
          label="Cost of Goods Sold (COGS)"
          value={formatUSD(totalCost)}
          helperText="Manufacturer base cost"
        />
        <KPICard
          label="Gross Profit"
          value={formatUSD(totalProfit)}
          tone="success"
          helperText="Net wholesale earnings"
        />
        <KPICard
          label="Gross Margin %"
          value={`${overallMargin}%`}
          tone="primary"
          helperText="Target benchmark: 22.0%"
        />
      </div>

      {/* Automated BI Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Business Intelligence Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((bi) => (
            <Card key={bi.id} className="p-4 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={bi.urgency === 'ALERT' ? 'danger' : bi.urgency === 'SUCCESS' ? 'success' : 'primary'}>
                    {bi.type.replace(/_/g, ' ')}
                  </Badge>
                  {bi.metricValue && (
                    <span className="font-mono text-xs font-bold text-slate-900">{bi.metricValue}</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{bi.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{bi.message}</p>
              </div>

              {bi.actionLink && (
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <Link
                    href={bi.actionLink}
                    className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <span>{bi.actionLabel || 'Investigate in System'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Product Profitability Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Most Profitable Products & Margin Contribution
          </h3>
        </div>

        <Table className="border-0 rounded-none shadow-none">
          <TableHeader>
            <TableHead>Equipment / Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead align="right">Units Sold</TableHead>
            <TableHead align="right">Revenue ($)</TableHead>
            <TableHead align="right">Cost ($)</TableHead>
            <TableHead align="right">Gross Profit ($)</TableHead>
            <TableHead align="right">Margin Status</TableHead>
          </TableHeader>
          <TableBody>
            {metrics.map((m) => (
              <TableRow key={m.productId}>
                <TableCell>
                  <div className="font-bold text-slate-900 text-xs">{m.productName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    SKU: {m.sku} · {m.brand}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{m.categoryName}</TableCell>
                <TableCell align="right" className="font-bold text-slate-900">{m.unitsSold}</TableCell>
                <TableCell align="right" className="font-bold text-slate-900">{formatUSD(m.totalRevenue)}</TableCell>
                <TableCell align="right" className="text-slate-500">{formatUSD(m.totalCost)}</TableCell>
                <TableCell align="right" className="font-bold text-emerald-700">
                  {formatUSD(m.grossProfit)}
                </TableCell>
                <TableCell align="right">
                  <MarginBadge marginPercent={m.grossMarginPercent} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
