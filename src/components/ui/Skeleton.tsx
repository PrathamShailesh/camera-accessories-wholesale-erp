import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} />;
}

export function SkeletonKPIRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="bg-surface-muted px-4 py-2.5 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-line-soft">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex gap-6">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface p-5', className)}>
      <Skeleton className="h-4 w-40 mb-3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
