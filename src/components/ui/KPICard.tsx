import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KPITone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const iconToneClasses: Record<KPITone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-muted text-muted',
};

export interface KPITrend {
  direction: 'up' | 'down' | 'flat';
  value: string;
  label: string;
  /** When the direction being "up" is bad (e.g. pending orders), set to false to flip the color. */
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

export function KPICard({ label, value, icon: Icon, tone = 'primary', trend, helperText, restricted, className }: KPICardProps) {
  const trendGood = trend ? (trend.positiveIsGood === false ? trend.direction === 'down' : trend.direction === 'up') : null;
  const TrendIcon = trend?.direction === 'up' ? ArrowUp : trend?.direction === 'down' ? ArrowDown : Minus;

  return (
    <div className={cn('rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-card-hover', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconToneClasses[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
          {restricted ? <span className="text-muted text-base font-medium">Restricted</span> : value}
        </div>
        {!restricted && trend && (
          <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', trendGood ? 'text-success' : 'text-danger')}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend.value}</span>
            <span className="text-muted font-normal">{trend.label}</span>
          </div>
        )}
        {!restricted && !trend && helperText && <div className="mt-1.5 text-xs text-muted">{helperText}</div>}
      </div>
    </div>
  );
}
