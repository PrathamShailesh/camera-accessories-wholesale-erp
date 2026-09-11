'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Row that lays out filter pills + search on the left and primary actions on the right. */
export function Toolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between', className)}>
      {children}
    </div>
  );
}

export function ToolbarGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

export interface PillSelectOption {
  label: string;
  value: string;
}

/** Pill-shaped native <select> used for "Status ▾ / Customer ▾ / Date ▾" style filters. */
export const PillSelect = React.forwardRef<HTMLSelectElement, {
  label: string;
  value: string;
  options: PillSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}>(function PillSelect({ label, value, options, onChange, className }, ref) {
  const hasValue = value !== '' && value !== 'ALL';
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'peer h-11 md:h-9 appearance-none rounded-full border bg-white pl-3.5 pr-8 text-xs font-medium cursor-pointer transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary',
          hasValue ? 'border-primary/40 bg-primary-soft text-primary' : 'border-line text-ink hover:bg-surface'
        )}
      >
        <option value="ALL">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className={cn('pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2', hasValue ? 'text-primary' : 'text-muted')} />
    </div>
  );
});

/** Segmented pill group used for status/tab-style filters ("All / Draft / Sent / ..."). */
export function FilterPillGroup({
  options,
  value,
  onChange,
  className,
}: {
  options: PillSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'h-11 md:h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors',
              active ? 'bg-ink text-white' : 'bg-white text-ink-secondary border border-line hover:bg-surface'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
