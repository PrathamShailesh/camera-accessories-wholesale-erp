'use client';

import React from 'react';
import { Search, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-ink">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="flex items-center gap-1 text-[11px] text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

const baseInputClasses =
  'w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-ring disabled:opacity-50 disabled:bg-surface-muted';

function borderClasses(hasError?: boolean) {
  return hasError ? 'border-danger focus:border-danger' : 'border-line focus:border-primary';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, wrapperClassName, id, required, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={inputId} required={required} hint={hint} error={error}>
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={cn(baseInputClasses, borderClasses(!!error), 'h-9', className)}
          {...props}
        />
      </Field>
    </div>
  );
});

export interface CurrencyInputProps extends Omit<InputProps, 'type'> {
  currency?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { label, hint, error, className, wrapperClassName, id, required, currency = 'USD', ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={wrapperClassName}>
      <Field
        label={label ? `${label} (${currency === 'USD' ? '$' : currency})` : label}
        htmlFor={inputId}
        required={required}
        hint={hint}
        error={error}
      >
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
            {currency === 'USD' ? '$' : currency}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="number"
            step="0.01"
            required={required}
            className={cn(baseInputClasses, borderClasses(!!error), 'h-9 pl-7', className)}
            {...props}
          />
        </div>
      </Field>
    </div>
  );
});

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(function SearchInput(
  { className, wrapperClassName, ...props },
  ref
) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
      <input
        ref={ref}
        type="search"
        className={cn(baseInputClasses, 'border-line focus:border-primary h-9 pl-9', className)}
        {...props}
      />
    </div>
  );
});

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, wrapperClassName, id, required, options, placeholder, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={selectId} required={required} hint={hint} error={error}>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={cn(
              baseInputClasses,
              borderClasses(!!error),
              'h-9 appearance-none pr-8 cursor-pointer',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </Field>
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, required, ...props },
  ref
) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={textareaId} required={required} hint={hint} error={error}>
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          className={cn(baseInputClasses, borderClasses(!!error), 'py-2 min-h-[80px] resize-y', className)}
          {...props}
        />
      </Field>
    </div>
  );
});
