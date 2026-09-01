import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-line', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function TableHeader({ children, sticky }: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <thead className={cn('bg-surface-muted', sticky && 'sticky top-0 z-10')}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line-soft">{children}</tbody>;
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
      className={cn('bg-surface transition-colors', onClick && 'cursor-pointer', 'hover:bg-surface-muted', className)}
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
      <th className={cn('px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted', alignClass, className)}>
        {children}
      </th>
    );
  }
  const Icon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <th className={cn('px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted', alignClass, className)}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          'inline-flex items-center gap-1 hover:text-ink transition-colors',
          align === 'right' && 'flex-row-reverse'
        )}
      >
        {children}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  className,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return <td className={cn('px-4 py-3 text-ink align-middle', alignClass, className)}>{children}</td>;
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
