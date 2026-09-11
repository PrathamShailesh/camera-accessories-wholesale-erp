-- Invoice-level freight calculation: actual/volumetric/chargeable weight, freight
-- rate & charge, additional shipping charges, and manual-override tracking on
-- Proforma and TaxInvoice; per-line package weight/dimensions plus optional
-- allocated-freight on ProformaItem and InvoiceItem; and the two configurable
-- freight defaults (volumetric divisor, default rate/kg) on CompanySettings.
-- Nothing here is a new total: shippingCost remains the single Total Freight
-- figure already included in grandTotal — these columns only record how it
-- was derived.

ALTER TABLE "Proforma"
  ADD COLUMN IF NOT EXISTS "actualWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "volumetricWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "chargeableWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightRatePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "additionalFreightCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightVolumetricDivisor" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightIsManualOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "freightAllocationMethod" TEXT;

ALTER TABLE "ProformaItem"
  ADD COLUMN IF NOT EXISTS "unitWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lengthCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "widthCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "heightCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "allocatedFreight" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "TaxInvoice"
  ADD COLUMN IF NOT EXISTS "actualWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "volumetricWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "chargeableWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightRatePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "additionalFreightCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightVolumetricDivisor" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "freightIsManualOverride" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "freightAllocationMethod" TEXT;

ALTER TABLE "InvoiceItem"
  ADD COLUMN IF NOT EXISTS "unitWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lengthCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "widthCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "heightCm" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "allocatedFreight" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "CompanySettings"
  ADD COLUMN IF NOT EXISTS "freightVolumetricDivisor" DOUBLE PRECISION NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS "freightDefaultRatePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0;
