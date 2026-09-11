'use client';

import React, { useMemo, useState } from 'react';
import { X, Boxes, Hash, DollarSign, PenLine } from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { allocateFreight, FreightAllocationMethod } from '@/lib/freight';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FreightAllocationItem {
  id: string;
  label: string;
  sku?: string;
  quantity: number;
  unitWeightKg: number;
  totalPrice: number;
  /** Previously saved allocation, if any — used to pre-fill Manual mode. */
  allocatedFreight?: number;
}

export interface FreightAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FreightAllocationItem[];
  totalFreight: number;
  documentLabel: string;
  isSaving?: boolean;
  onSave: (method: FreightAllocationMethod, allocations: { id: string; allocatedFreight: number }[]) => void;
}

const METHODS: { value: FreightAllocationMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'WEIGHT', label: 'By Weight', icon: Boxes },
  { value: 'QUANTITY', label: 'By Quantity', icon: Hash },
  { value: 'VALUE', label: 'By Product Value', icon: DollarSign },
  { value: 'MANUAL', label: 'Manual', icon: PenLine },
];

/**
 * Optional, reporting-only distribution of the invoice's single Total
 * Freight charge across its line items — for costing/profitability, never a
 * second freight charge. The invoice keeps exactly one freight line; this
 * only annotates each product with its share of it.
 */
export function FreightAllocationModal({
  isOpen,
  onClose,
  items,
  totalFreight,
  documentLabel,
  isSaving,
  onSave,
}: FreightAllocationModalProps) {
  const [method, setMethod] = useState<FreightAllocationMethod>('WEIGHT');
  const [manualValues, setManualValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((it) => [it.id, it.allocatedFreight || 0]))
  );

  const computedAllocations = useMemo(() => {
    if (method === 'MANUAL') return items.map((it) => manualValues[it.id] || 0);
    return allocateFreight(items, totalFreight, method);
  }, [items, totalFreight, method, manualValues]);

  const manualSum = useMemo(
    () => Object.values(manualValues).reduce((a, b) => a + (Number(b) || 0), 0),
    [manualValues]
  );
  const manualDrift = Math.abs(Number((manualSum - totalFreight).toFixed(2)));

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(
      method,
      items.map((it, idx) => ({ id: it.id, allocatedFreight: computedAllocations[idx] || 0 }))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-white shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-soft shrink-0">
          <div>
            <h3 className="text-sm font-bold text-ink">Allocate Freight to Products</h3>
            <p className="text-xs text-muted mt-0.5">
              {documentLabel} · Total Freight {formatUSD(totalFreight)} stays a single invoice-level charge — this
              only splits it across products for reporting.
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink-secondary shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    'flex items-center gap-1.5 h-9 rounded-full px-3.5 text-xs font-semibold transition-colors',
                    active ? 'bg-ink text-white' : 'bg-white text-ink-secondary border border-line hover:bg-surface'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-line overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface border-b border-line-soft text-muted uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Weight (kg)</th>
                  <th className="py-2 px-3 text-right">Value</th>
                  <th className="py-2 px-3 text-right">Allocated Freight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {items.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-ink truncate max-w-[160px]">{it.label}</div>
                      {it.sku && <div className="text-[10px] font-mono text-muted">{it.sku}</div>}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-ink-secondary">{it.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-ink-secondary">
                      {(it.quantity * it.unitWeightKg).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-ink-secondary">{formatUSD(it.totalPrice)}</td>
                    <td className="py-2 px-3 text-right">
                      {method === 'MANUAL' ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={manualValues[it.id] ?? 0}
                          onChange={(e) =>
                            setManualValues((prev) => ({ ...prev, [it.id]: Number(e.target.value) }))
                          }
                          className="w-24 rounded border border-line bg-white px-2 py-1 text-xs font-mono text-ink text-right"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-ink">
                          {formatUSD(computedAllocations[idx] || 0)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {method === 'MANUAL' && manualDrift > 0.01 && (
            <div className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-xs text-warning">
              Manual allocations total {formatUSD(manualSum)}, which differs from Total Freight{' '}
              {formatUSD(totalFreight)} by {formatUSD(manualDrift)}. You can still save — this is for reporting
              only and does not change the invoice total.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line-soft shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save Allocation
          </Button>
        </div>
      </div>
    </div>
  );
}
