'use client';

import React, { useState } from 'react';
import { cn, cloudinaryThumb } from '@/lib/utils';

const PALETTE = [
  'bg-[#e0e7ff] text-[#4338ca]',
  'bg-[#dcfce7] text-[#166534]',
  'bg-[#ffedd5] text-[#9a3412]',
  'bg-[#fee2e2] text-[#991b1b]',
  'bg-[#e0f2fe] text-[#075985]',
  'bg-[#f3e8ff] text-[#6b21a8]',
  'bg-[#fef9c3] text-[#854d0e]',
];

function initialsOf(name?: string | null): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

function paletteFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
};

const sizePx = { xs: 24, sm: 28, md: 36, lg: 48, xl: 64 };

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  ring?: boolean;
}

export function Avatar({ name, src, size = 'md', className, ring }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold select-none',
        sizeClasses[size],
        ring && 'ring-2 ring-surface shadow-card',
        !showImage && paletteFor(name || 'user'),
        className
      )}
      title={name || undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cloudinaryThumb(src, sizePx[size] * 2) || src!}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </div>
  );
}
