-- Performance pass: composite/missing indexes matching the actual filter+sort
-- patterns used by list endpoints (where depotId/status, orderBy createdAt).
-- All CREATE INDEX (non-CONCURRENTLY) — acceptable for current table sizes;
-- revisit with CONCURRENTLY if these tables grow large enough that a brief
-- write lock during index creation becomes a concern.

CREATE INDEX IF NOT EXISTS "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX IF NOT EXISTS "Proforma_createdAt_idx" ON "Proforma"("createdAt");
CREATE INDEX IF NOT EXISTS "TaxInvoice_depotId_createdAt_idx" ON "TaxInvoice"("depotId", "createdAt");
CREATE INDEX IF NOT EXISTS "Shipment_depotId_createdAt_idx" ON "Shipment"("depotId", "createdAt");
CREATE INDEX IF NOT EXISTS "CloudDocument_depotId_uploadedAt_idx" ON "CloudDocument"("depotId", "uploadedAt");
CREATE INDEX IF NOT EXISTS "StockTransfer_createdAt_idx" ON "StockTransfer"("createdAt");
CREATE INDEX IF NOT EXISTS "StockAdjustment_createdAt_idx" ON "StockAdjustment"("createdAt");
CREATE INDEX IF NOT EXISTS "SerialNumber_depotId_status_createdAt_idx" ON "SerialNumber"("depotId", "status", "createdAt");
