-- Transactional email delivery log (proforma sends, depot/manager notifications).
-- The model existed in schema.prisma but had no migration, so the table was
-- missing in the database and every notification write failed at runtime.

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "relatedEntityRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailLog_idempotencyKey_key" ON "EmailLog"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "EmailLog_idempotencyKey_idx" ON "EmailLog"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "EmailLog_notificationType_idx" ON "EmailLog"("notificationType");
CREATE INDEX IF NOT EXISTS "EmailLog_relatedEntityId_idx" ON "EmailLog"("relatedEntityId");
CREATE INDEX IF NOT EXISTS "EmailLog_status_idx" ON "EmailLog"("status");
