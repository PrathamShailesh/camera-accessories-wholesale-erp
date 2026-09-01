import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children, sticky }: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200', sticky && 'sticky top-0 z-10')}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>;
}

export function TableRow({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'bg-white transition-colors',
        onClick && 'cursor-pointer hover:bg-slate-50/90',
        !onClick && 'hover:bg-slate-50/60',
        className
      )}
    >
      {children}
    </tr>
  );
}

export type SortDirection = 'asc' | 'desc' | null;

export interface TableHeadProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  className?: string;
}

export function TableHead({ children, align = 'left', sortable, sortDirection, onSort, className }: TableHeadProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  if (!sortable) {
    return (
      <th className={cn('px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500', alignClass, className)}>
        {children}
      </th>
    );
  }
  const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <th className={cn('px-3.5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500', alignClass, className)}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1 hover:text-slate-900 transition-colors',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {children}
        <Icon className="h-3 w-3 text-slate-400" />
      </button>
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  colSpan,
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  colSpan?: number;
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return <td colSpan={colSpan} className={cn('px-3.5 py-3.5 text-slate-800 align-middle text-sm', alignClass, className)}>{children}</td>;
}

export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        {children}
      </td>
    </tr>
  );
}
