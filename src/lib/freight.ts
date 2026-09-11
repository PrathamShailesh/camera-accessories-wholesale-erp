// Invoice-level freight calculation. Deliberately configuration-free: carrier
// rates and the volumetric divisor always come from CompanySettings or from
// values the user enters — never hardcoded here. Shared by client (live
// preview while building a Proforma/Invoice) and server (authoritative
// recompute on save, so a stale or tampered client value can't corrupt totals).

export interface FreightLineInput {
  quantity: number;
  unitWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface FreightAllocationLineInput {
  quantity: number;
  unitWeightKg: number;
  totalPrice: number;
}

export type FreightAllocationMethod = 'WEIGHT' | 'QUANTITY' | 'VALUE' | 'MANUAL';

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Sum of quantity × unit weight across every line — the physical scale weight. */
export function computeActualWeightKg(items: FreightLineInput[]): number {
  const total = items.reduce(
    (sum, it) => sum + Math.max(0, Number(it.quantity) || 0) * Math.max(0, Number(it.unitWeightKg) || 0),
    0
  );
  return round2(total);
}

/**
 * Sum of quantity × (L × W × H) ÷ divisor across every line — the space the
 * shipment occupies, expressed as an equivalent weight. `divisor` is the
 * carrier's volumetric divisor (commonly 5000 or 6000 for air freight) and
 * must be supplied by the caller; a missing/invalid divisor yields 0 rather
 * than silently assuming a value.
 */
export function computeVolumetricWeightKg(items: FreightLineInput[], divisor: number): number {
  if (!divisor || divisor <= 0) return 0;
  const total = items.reduce((sum, it) => {
    const volumeCm3 =
      Math.max(0, Number(it.lengthCm) || 0) *
      Math.max(0, Number(it.widthCm) || 0) *
      Math.max(0, Number(it.heightCm) || 0);
    return sum + (Math.max(0, Number(it.quantity) || 0) * volumeCm3) / divisor;
  }, 0);
  return round2(total);
}

/** Carriers bill whichever of actual/volumetric weight is greater. */
export function computeChargeableWeightKg(actualWeightKg: number, volumetricWeightKg: number): number {
  return round2(Math.max(Math.max(0, actualWeightKg), Math.max(0, volumetricWeightKg)));
}

export function computeFreightCharge(chargeableWeightKg: number, freightRatePerKg: number): number {
  return round2(Math.max(0, chargeableWeightKg) * Math.max(0, freightRatePerKg));
}

export function computeTotalFreight(freightCharge: number, additionalFreightCharges: number): number {
  return round2(Math.max(0, freightCharge) + Math.max(0, additionalFreightCharges));
}

export interface FreightCalculationInput {
  items: FreightLineInput[];
  volumetricDivisor: number;
  freightRatePerKg: number;
  additionalFreightCharges: number;
  /** When true, `manualTotalFreight` wins over the computed total. Weights and
   *  freight charge are still computed and stored for the audit trail. */
  isManualOverride: boolean;
  manualTotalFreight?: number;
}

export interface FreightCalculationResult {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  freightRatePerKg: number;
  freightCharge: number;
  additionalFreightCharges: number;
  freightVolumetricDivisor: number;
  freightIsManualOverride: boolean;
  /** The one figure that populates the Shipping/Freight Cost field. */
  totalFreight: number;
}

/** The single source of truth for turning line-item weights into a Total
 *  Freight figure. Used identically on the client (for live preview) and the
 *  server (to recompute authoritatively before persisting), so the two can
 *  never drift apart. */
export function calculateFreight(input: FreightCalculationInput): FreightCalculationResult {
  const actualWeightKg = computeActualWeightKg(input.items);
  const volumetricWeightKg = computeVolumetricWeightKg(input.items, input.volumetricDivisor);
  const chargeableWeightKg = computeChargeableWeightKg(actualWeightKg, volumetricWeightKg);
  const freightRatePerKg = Math.max(0, Number(input.freightRatePerKg) || 0);
  const freightCharge = computeFreightCharge(chargeableWeightKg, freightRatePerKg);
  const additionalFreightCharges = round2(Math.max(0, Number(input.additionalFreightCharges) || 0));
  const computedTotal = computeTotalFreight(freightCharge, additionalFreightCharges);
  const isManualOverride = Boolean(input.isManualOverride);
  const totalFreight = isManualOverride
    ? round2(Math.max(0, Number(input.manualTotalFreight) || 0))
    : computedTotal;

  return {
    actualWeightKg,
    volumetricWeightKg,
    chargeableWeightKg,
    freightRatePerKg,
    freightCharge,
    additionalFreightCharges,
    freightVolumetricDivisor: Math.max(0, Number(input.volumetricDivisor) || 0),
    freightIsManualOverride: isManualOverride,
    totalFreight,
  };
}

/**
 * Optional, reporting-only distribution of the invoice-level freight across
 * line items. Never feeds back into subtotal/grandTotal — the invoice keeps
 * exactly one Total Freight charge; this only annotates each line with its
 * share of it for costing/profitability analysis.
 */
export function allocateFreight(
  items: FreightAllocationLineInput[],
  totalFreight: number,
  method: Exclude<FreightAllocationMethod, 'MANUAL'>
): number[] {
  if (items.length === 0 || totalFreight <= 0) return items.map(() => 0);

  const weights = items.map((it) => {
    if (method === 'WEIGHT') return Math.max(0, Number(it.quantity) || 0) * Math.max(0, Number(it.unitWeightKg) || 0);
    if (method === 'QUANTITY') return Math.max(0, Number(it.quantity) || 0);
    return Math.max(0, Number(it.totalPrice) || 0); // VALUE
  });

  const weightSum = weights.reduce((a, b) => a + b, 0);
  const shares =
    weightSum > 0
      ? weights.map((w) => (w / weightSum) * totalFreight)
      : items.map(() => totalFreight / items.length); // even split when nothing to weight by

  const rounded = shares.map(round2);
  // Rounding can drift the sum by a cent or two — patch the last line so the
  // allocations always add back up to exactly the invoice's Total Freight.
  const drift = round2(totalFreight - rounded.reduce((a, b) => a + b, 0));
  if (rounded.length > 0 && drift !== 0) {
    rounded[rounded.length - 1] = round2(rounded[rounded.length - 1] + drift);
  }
  return rounded;
}
