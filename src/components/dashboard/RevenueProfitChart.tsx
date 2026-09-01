'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatUSD } from '@/lib/utils';

export interface TrendPoint {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
}

const REVENUE_COLOR = '#5d6ee8';
const PROFIT_COLOR = '#059669';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 shadow-popover text-xs">
      <div className="font-semibold text-ink mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-ink tabular-nums">{formatUSD(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueProfitChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="#e4e7ef" strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737b8d' }} axisLine={{ stroke: '#e4e7ef' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#737b8d' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f3f8' }} />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: '#737b8d' }}
        />
        <Bar dataKey="revenue" name="Revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Line
          dataKey="profit"
          name="Gross Profit"
          type="monotone"
          stroke={PROFIT_COLOR}
          strokeWidth={2}
          dot={{ r: 3, fill: PROFIT_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
