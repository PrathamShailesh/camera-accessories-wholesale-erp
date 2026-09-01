'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import React from 'react';
import { cn } from '@/lib/utils';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  className,
  children,
  align = 'end',
  sideOffset = 8,
  ...props
}: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[14rem] rounded-xl border border-line bg-surface p-1.5 shadow-popover animate-fade-in',
          className
        )}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  children,
  ...props
}: RadixDropdown.DropdownMenuItemProps & { destructive?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium outline-none cursor-pointer transition-colors',
        destructive ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-surface-muted',
        className
      )}
      {...props}
    >
      {children}
    </RadixDropdown.Item>
  );
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-3 py-1.5 text-[11px] font-medium text-muted', className)}>{children}</div>;
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <RadixDropdown.Separator className={cn('my-1.5 h-px bg-line', className)} />;
}
