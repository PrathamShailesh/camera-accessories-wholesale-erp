'use client';

import React from 'react';
import { Package } from 'lucide-react';

export interface FreightItemRow {
  key: string | number;
  label: string;
  sku?: string;
  quantity: number;
  unitWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface FreightItemsTableProps {
  items: FreightItemRow[];
  onChange: (key: string | number, patch: Partial<Pick<FreightItemRow, 'unitWeightKg' | 'lengthCm' | 'widthCm' | 'heightCm'>>) => void;
  disabled?: boolean;
}

const numberInputClass =
  'w-full rounded border border-line bg-white px-2 py-1 text-xs font-mono text-ink disabled:opacity-60 disabled:bg-surface-muted';

/**
 * Optional per-product package details (weight + dimensions). Purely inputs
 * to the freight calculation — the user is never forced to fill these in;
 * left at zero, that product simply contributes nothing to the shipment
 * weight.
 */
export function FreightItemsTable({ items, onChange, disabled }: FreightItemsTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-line overflow-hidden">
      <div className="px-3.5 py-2.5 bg-surface border-b border-line flex items-center gap-2">
        <Package className="h-3.5 w-3.5 text-muted" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Package / Weight / Dimensions per Product (optional)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface border-b border-line-soft text-muted uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2 px-3">Product</th>
              <th className="py-2 px-3 text-center">Qty</th>
              <th className="py-2 px-3 text-center">Unit Weight (kg)</th>
              <th className="py-2 px-3 text-center">L (cm)</th>
              <th className="py-2 px-3 text-center">W (cm)</th>
              <th className="py-2 px-3 text-center">H (cm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {items.map((item) => (
              <tr key={item.key}>
                <td className="py-2 px-3">
                  <div className="font-semibold text-ink truncate max-w-[180px]">{item.label}</div>
                  {item.sku && <div className="text-[10px] font-mono text-muted">{item.sku}</div>}
                </td>
                <td className="py-2 px-3 text-center font-mono text-ink-secondary">{item.quantity}</td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.unitWeightKg || ''}
                    disabled={disabled}
                    onChange={(e) => onChange(item.key, { unitWeightKg: Number(e.target.value) })}
                    className={numberInputClass}
                    placeholder="0"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={item.lengthCm || ''}
                    disabled={disabled}
                    onChange={(e) => onChange(item.key, { lengthCm: Number(e.target.value) })}
                    className={numberInputClass}
                    placeholder="0"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={item.widthCm || ''}
                    disabled={disabled}
                    onChange={(e) => onChange(item.key, { widthCm: Number(e.target.value) })}
                    className={numberInputClass}
                    placeholder="0"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={item.heightCm || ''}
                    disabled={disabled}
                    onChange={(e) => onChange(item.key, { heightCm: Number(e.target.value) })}
                    className={numberInputClass}
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
