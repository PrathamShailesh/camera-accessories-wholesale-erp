'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { formatUSD } from '@/lib/utils';

export interface CategoryDatum {
  name: string;
  revenue: number;
  units: number;
}

const BASE_COLOR = '#5d6ee8';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryDatum;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5 shadow-popover text-xs">
      <div className="font-semibold text-ink mb-1">{d.name}</div>
      <div className="text-muted">
        Revenue: <span className="font-medium text-ink">{formatUSD(d.revenue)}</span>
      </div>
      <div className="text-muted">
        Units sold: <span className="font-medium text-ink">{d.units}</span>
      </div>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryDatum[] }) {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const height = Math.max(180, sorted.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e4e7ef" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: '#202536' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f3f8' }} />
        <Bar dataKey="revenue" fill={BASE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18}>
          {sorted.map((_, i) => (
            <Cell key={i} fillOpacity={1 - i * 0.07} />
          ))}
          <LabelList
            dataKey="revenue"
            position="right"
            formatter={(v: React.ReactNode) => formatUSD(typeof v === 'number' ? v : Number(v) || 0)}
            style={{ fontSize: 11, fill: '#737b8d', fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
