'use client';

import React from 'react';
import { Info, Lock, Truck } from 'lucide-react';
import { formatUSD } from '@/lib/utils';
import { calculateFreight } from '@/lib/freight';
import { Badge } from '@/components/ui/Badge';

export interface FreightSummaryPanelProps {
  actualWeightKg: number;
  volumetricWeightKg: number;
  volumetricDivisor: number;
  onVolumetricDivisorChange?: (value: number) => void;
  freightRatePerKg: number;
  onFreightRateChange: (value: number) => void;
  additionalFreightCharges: number;
  onAdditionalChargesChange: (value: number) => void;
  isManualOverride: boolean;
  onManualOverrideChange: (value: boolean) => void;
  manualTotalFreight: number;
  onManualTotalFreightChange: (value: number) => void;
  disabled?: boolean;
  /** Compact rendering for use inside a drawer/modal rather than a full page step. */
  compact?: boolean;
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="text-sm font-bold font-mono text-ink mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

/**
 * Shared freight breakdown + calculator used in the Proforma builder, the
 * Proforma "Edit Terms" drawer, and the Tax Invoice freight editor. Renders
 * Actual/Volumetric/Chargeable Weight, Freight Rate, Freight Charge,
 * Additional Shipping Charges, and Total Freight — the total is the single
 * figure that populates the existing Shipping/Freight Cost field, never a
 * second charge added on top of it.
 */
export function FreightSummaryPanel({
  actualWeightKg,
  volumetricWeightKg,
  volumetricDivisor,
  onVolumetricDivisorChange,
  freightRatePerKg,
  onFreightRateChange,
  additionalFreightCharges,
  onAdditionalChargesChange,
  isManualOverride,
  onManualOverrideChange,
  manualTotalFreight,
  onManualTotalFreightChange,
  disabled,
  compact,
}: FreightSummaryPanelProps) {
  const chargeableWeightKg = Math.max(0, actualWeightKg, volumetricWeightKg);
  const freightCharge = Math.max(0, chargeableWeightKg) * Math.max(0, freightRatePerKg || 0);
  const computedTotal = freightCharge + Math.max(0, additionalFreightCharges || 0);
  const totalFreight = isManualOverride ? Math.max(0, manualTotalFreight || 0) : computedTotal;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Freight Calculator</h3>
        </div>
        {onVolumetricDivisorChange ? (
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            Volumetric divisor
            <input
              type="number"
              min={1}
              value={volumetricDivisor || ''}
              disabled={disabled}
              onChange={(e) => onVolumetricDivisorChange(Number(e.target.value))}
              className="w-16 rounded border border-line bg-white px-1.5 py-0.5 text-xs font-mono text-ink disabled:opacity-60"
              title="Configured in Settings → Freight & Logistics"
            />
          </label>
        ) : (
          <span className="text-[11px] text-muted font-mono">Divisor: {volumetricDivisor || '—'}</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat label="Actual Weight" value={`${actualWeightKg.toFixed(2)} kg`} />
        <Stat label="Volumetric Weight" value={`${volumetricWeightKg.toFixed(2)} kg`} />
        <Stat label="Chargeable Weight" value={`${chargeableWeightKg.toFixed(2)} kg`} hint="Higher of the two" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">
            Freight Rate ($ / kg)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={freightRatePerKg}
            disabled={disabled || isManualOverride}
            onChange={(e) => onFreightRateChange(Number(e.target.value))}
            className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink disabled:opacity-60 disabled:bg-surface-muted"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider font-semibold block mb-1">
            Additional Shipping Charges ($)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={additionalFreightCharges}
            disabled={disabled || isManualOverride}
            onChange={(e) => onAdditionalChargesChange(Number(e.target.value))}
            className="w-full rounded-md border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink disabled:opacity-60 disabled:bg-surface-muted"
            title="Customs, handling, or other charges billed alongside freight"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-line-soft bg-surface px-3 py-2">
        <span className="text-xs text-ink-secondary">Freight Charge (Chargeable Weight × Rate)</span>
        <span className="text-xs font-mono font-semibold text-ink">{formatUSD(freightCharge)}</span>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-line-soft bg-surface px-3 py-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={isManualOverride}
          disabled={disabled}
          onChange={(e) => onManualOverrideChange(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary-ring"
        />
        <span className="text-xs text-ink-secondary">
          <span className="font-semibold text-ink">Manual Freight Override</span>
          <span className="block text-[11px] text-muted mt-0.5">
            Enter the Total Freight directly instead of using the calculated amount.
          </span>
        </span>
      </label>

      {isManualOverride && (
        <div>
          <label className="text-[10px] text-warning uppercase tracking-wider font-semibold block mb-1 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Manual Freight Override Amount ($)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={manualTotalFreight}
            disabled={disabled}
            onChange={(e) => onManualTotalFreightChange(Number(e.target.value))}
            className="w-full rounded-md border border-warning-border bg-warning-soft/40 px-3 py-1.5 text-xs font-mono text-ink disabled:opacity-60"
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary-soft px-4 py-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Total Freight</div>
          {isManualOverride && (
            <Badge tone="warning" className="mt-1">
              Manual Freight Override
            </Badge>
          )}
        </div>
        <div className="text-lg font-bold font-mono text-primary">{formatUSD(totalFreight)}</div>
      </div>

      <p className="flex items-start gap-1.5 text-[11px] text-muted">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        Total Freight automatically fills the Shipping / Freight Cost field below — it is added once, not
        alongside it.
      </p>
    </div>
  );
}

/** Re-exported for callers that need the same numbers without rendering the panel. */
export { calculateFreight };
