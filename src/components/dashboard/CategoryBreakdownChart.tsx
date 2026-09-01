'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { formatUSD } from '@/lib/utils';

export interface CategoryDatum {
  name: string;
  revenue: number;
  units: number;
}

const BASE_COLOR = '#4f46e5';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CategoryDatum;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
      <div className="font-semibold text-slate-900 mb-1">{d.name}</div>
      <div className="text-slate-500">
        Revenue: <span className="font-semibold text-slate-900">{formatUSD(d.revenue)}</span>
      </div>
      <div className="text-slate-500">
        Units sold: <span className="font-semibold text-slate-900">{d.units}</span>
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
        <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: '#1e293b' }}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="revenue" fill={BASE_COLOR} radius={[0, 4, 4, 0]} maxBarSize={18}>
          {sorted.map((_, i) => (
            <Cell key={i} fillOpacity={1 - i * 0.08} />
          ))}
          <LabelList
            dataKey="revenue"
            position="right"
            formatter={(v: React.ReactNode) => formatUSD(typeof v === 'number' ? v : Number(v) || 0)}
            style={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
