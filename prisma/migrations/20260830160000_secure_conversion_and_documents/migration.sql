-- A proforma may produce exactly one tax invoice.
CREATE UNIQUE INDEX IF NOT EXISTS "TaxInvoice_proformaId_key" ON "TaxInvoice"("proformaId") WHERE "proformaId" IS NOT NULL;

-- Documents need a first-class depot scope; without it depot users could read unrelated files.
ALTER TABLE "CloudDocument" ADD COLUMN IF NOT EXISTS "depotId" TEXT;
CREATE INDEX IF NOT EXISTS "CloudDocument_depotId_idx" ON "CloudDocument"("depotId");
