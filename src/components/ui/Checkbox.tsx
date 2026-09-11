'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref
) {
  return (
    <label
      className={cn(
        'relative inline-flex h-11 w-11 -m-[14px] shrink-0 cursor-pointer items-center justify-center md:h-4 md:w-4 md:m-0',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 m-auto h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-line bg-white transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring"
        {...props}
      />
      <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
    </label>
  );
});
