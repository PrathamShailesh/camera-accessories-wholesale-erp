'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Filter,
  Download,
  Building2,
  PieChart,
} from 'lucide-react';
import dataStore from '@/lib/data-store';
import { formatUSD } from '@/lib/utils';
import { ProfitabilityMetric, BusinessInsight } from '@/types/erp';

export default function ProfitabilityPage() {
  const [metrics, setMetrics] = useState<ProfitabilityMetric[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);

  const loadData = () => {
    setMetrics(dataStore.getProfitabilityMetrics());
    setInsights(dataStore.getBusinessInsights());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = metrics.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0);
  const totalProfit = metrics.reduce((sum, m) => sum + m.grossProfit, 0);
  const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '24.5';

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Profitability & Business Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time margin analysis across cameras, lenses and accessories in USD ($).
          </p>
        </div>
      </div>

      {/* Top Margin KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Wholesale Sales</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatUSD(totalRevenue)}
          </div>
          <span className="text-[11px] text-brand-400 font-mono">Gross Invoiced Volume</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Cost of Goods Sold (COGS)</div>
          <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
            {formatUSD(totalCost)}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Manufacturer Base Cost</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Gross Profit</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {formatUSD(totalProfit)}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Net Wholesale Earnings</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Average Gross Margin</div>
          <div className="text-2xl font-bold font-mono text-brand-400 mt-1">
            {overallMargin}%
          </div>
          <span className="text-[11px] text-slate-400">Target Benchmark: 22%</span>
        </div>
      </div>

      {/* Automated Business Intelligence Engine Cards (PDF Section 22) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Automated Business Intelligence Rule Engine
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((bi) => (
            <div
              key={bi.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      bi.urgency === 'ALERT'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : bi.urgency === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    }`}
                  >
                    {bi.type.replace(/_/g, ' ')}
                  </span>
                  {bi.metricValue && (
                    <span className="font-mono text-xs font-bold text-white">{bi.metricValue}</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">{bi.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{bi.message}</p>
              </div>

              {bi.actionLink && (
                <div className="pt-3 border-t border-slate-800/80 mt-2">
                  <Link
                    href={bi.actionLink}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <span>{bi.actionLabel || 'Investigate in System'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product-Level Profitability Table (PDF Section 21) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
          Product Margin & Profit Contribution Table
        </h3>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Equipment / Product</th>
                  <th>Category</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Total Sales ($)</th>
                  <th className="text-right">Total Cost ($)</th>
                  <th className="text-right">Gross Profit ($)</th>
                  <th className="text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {metrics.map((m) => (
                  <tr key={m.productId}>
                    <td>
                      <div className="font-bold text-white font-sans text-xs">{m.productName}</div>
                      <div className="text-[10px] text-brand-400 font-mono">
                        {m.sku} • {m.brand}
                      </div>
                    </td>
                    <td className="font-sans text-slate-300">{m.categoryName}</td>
                    <td className="text-right font-bold text-slate-200">{m.unitsSold}</td>
                    <td className="text-right font-bold text-white">{formatUSD(m.totalRevenue)}</td>
                    <td className="text-right text-slate-400">{formatUSD(m.totalCost)}</td>
                    <td className="text-right font-bold text-emerald-400">
                      {formatUSD(m.grossProfit)}
                    </td>
                    <td className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          m.grossMarginPercent >= 25
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {m.grossMarginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
