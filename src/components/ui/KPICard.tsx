import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KPITone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface KPITrend {
  direction: 'up' | 'down' | 'flat';
  value: string;
  label?: string;
  positiveIsGood?: boolean;
}

export interface KPICardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: KPITone;
  trend?: KPITrend;
  helperText?: string;
  restricted?: boolean;
  className?: string;
}

export function KPICard({ label, value, icon: Icon, tone = 'neutral', trend, helperText, restricted, className }: KPICardProps) {
  const isUp = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';
  const trendGood = trend ? (trend.positiveIsGood === false ? isDown : isUp) : null;
  const TrendIcon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-400 border border-slate-100">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <div className="text-xl font-bold tracking-tight text-slate-900 tabular-nums">
          {restricted ? <span className="text-slate-400 text-sm font-medium">Restricted</span> : value}
        </div>
        {!restricted && trend && (
          <div className="flex items-center gap-1 mt-1.5 text-xs font-medium">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold',
                trendGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span>{trend.value}</span>
            </span>
            {trend.label && <span className="text-slate-500 font-normal text-[11px]">{trend.label}</span>}
          </div>
        )}
        {!restricted && !trend && helperText && <div className="mt-1.5 text-xs text-slate-500">{helperText}</div>}
      </div>
    </div>
  );
}
