-- V2: tenant_settings, audit_logs, new columns

ALTER TABLE "MetaConnection" ADD COLUMN IF NOT EXISTS "scopesJson" JSONB;
ALTER TABLE "MetaConnection" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "AdAccount" ADD COLUMN IF NOT EXISTS "timezone" TEXT;

ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "identityResolved" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "operationalStatus" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "creativeId" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "lastSeenDeliveringAt" TIMESTAMP(3);

ALTER TABLE "InsightDaily" ADD COLUMN IF NOT EXISTS "ctr" DECIMAL(10,6);
ALTER TABLE "InsightDaily" ADD COLUMN IF NOT EXISTS "cpm" DECIMAL(12,4);

ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'medium';
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "entityId" TEXT;
UPDATE "Alert" SET "type" = "ruleKey" WHERE "type" IS NULL AND "ruleKey" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "TenantSetting" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "key" TEXT NOT NULL,
  "valueJson" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "key")
);
CREATE INDEX IF NOT EXISTS "TenantSetting_tenantId_idx" ON "TenantSetting"("tenantId");

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "payloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
