'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-card disabled:hover:bg-primary',
  secondary: 'bg-surface-muted text-ink hover:bg-line-soft border border-line',
  outline: 'bg-surface text-ink border border-line hover:bg-surface-muted',
  ghost: 'bg-transparent text-muted hover:bg-surface-muted hover:text-ink',
  destructive: 'bg-danger text-white hover:bg-danger-hover shadow-card',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg shrink-0',
};

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps
  extends BaseButtonProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {}

const buttonClassName = (
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string
) =>
  cn(
    'inline-flex items-center justify-center whitespace-nowrap font-medium leading-none transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
    'disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, iconLeft, iconRight, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClassName(variant, size, className)}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface LinkButtonProps extends BaseButtonProps {
  href: string;
  target?: string;
  rel?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function LinkButton({
  href,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  iconLeft,
  iconRight,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClassName(variant, size, className)} {...props}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </Link>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'size'> {
  label: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', className, children, ...props },
  ref
) {
  return (
    <Button ref={ref} variant={variant} size="icon" aria-label={label} title={label} className={className} {...props}>
      {children}
    </Button>
  );
});
