-- AdPageOps initial schema (aligned with Prisma)
-- Run via: supabase db push (or supabase migration up)

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'tenant_user',
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");

CREATE TABLE IF NOT EXISTS "MetaConnection" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP(3),
  "metaUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId")
);
CREATE INDEX IF NOT EXISTS "MetaConnection_tenantId_idx" ON "MetaConnection"("tenantId");

CREATE TABLE IF NOT EXISTS "AdAccount" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "metaAdAccountId" TEXT NOT NULL,
  "name" TEXT,
  "currency" TEXT,
  "isSelected" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "metaAdAccountId")
);
CREATE INDEX IF NOT EXISTS "AdAccount_tenantId_idx" ON "AdAccount"("tenantId");

CREATE TABLE IF NOT EXISTS "Page" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "metaPageId" TEXT,
  "metaInstagramActorId" TEXT,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "adAccountId", "metaPageId")
);
CREATE INDEX IF NOT EXISTS "Page_tenantId_adAccountId_idx" ON "Page"("tenantId", "adAccountId");
CREATE INDEX IF NOT EXISTS "Page_tenantId_metaPageId_idx" ON "Page"("tenantId", "metaPageId");

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "metaCampaignId" TEXT NOT NULL,
  "name" TEXT,
  "status" TEXT,
  "effectiveStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "metaCampaignId")
);
CREATE INDEX IF NOT EXISTS "Campaign_tenantId_adAccountId_idx" ON "Campaign"("tenantId", "adAccountId");

CREATE TABLE IF NOT EXISTS "AdSet" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "campaignId" TEXT NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,
  "metaAdSetId" TEXT NOT NULL,
  "name" TEXT,
  "status" TEXT,
  "effectiveStatus" TEXT,
  "optimizationGoal" TEXT,
  "billingEvent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "metaAdSetId")
);
CREATE INDEX IF NOT EXISTS "AdSet_tenantId_adAccountId_idx" ON "AdSet"("tenantId", "adAccountId");

CREATE TABLE IF NOT EXISTS "Ad" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "adSetId" TEXT NOT NULL REFERENCES "AdSet"("id") ON DELETE CASCADE,
  "pageId" TEXT REFERENCES "Page"("id") ON DELETE SET NULL,
  "metaAdId" TEXT NOT NULL,
  "name" TEXT,
  "configuredStatus" TEXT,
  "effectiveStatus" TEXT,
  "creativeSnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("tenantId", "metaAdId")
);
CREATE INDEX IF NOT EXISTS "Ad_tenantId_adAccountId_idx" ON "Ad"("tenantId", "adAccountId");
CREATE INDEX IF NOT EXISTS "Ad_tenantId_pageId_idx" ON "Ad"("tenantId", "pageId");
CREATE INDEX IF NOT EXISTS "Ad_tenantId_metaAdId_idx" ON "Ad"("tenantId", "metaAdId");

CREATE TABLE IF NOT EXISTS "InsightDaily" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "entityLevel" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "spend" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "actions" JSONB,
  "actionValues" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "entityLevel", "entityId", "date")
);
CREATE INDEX IF NOT EXISTS "InsightDaily_tenantId_entityId_date_idx" ON "InsightDaily"("tenantId", "entityId", "date");
CREATE INDEX IF NOT EXISTS "InsightDaily_tenantId_adAccountId_date_idx" ON "InsightDaily"("tenantId", "adAccountId", "date");

CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "adAccountId" TEXT NOT NULL REFERENCES "AdAccount"("id") ON DELETE CASCADE,
  "ruleKey" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Alert_tenantId_adAccountId_idx" ON "Alert"("tenantId", "adAccountId");
CREATE INDEX IF NOT EXISTS "Alert_tenantId_resolvedAt_idx" ON "Alert"("tenantId", "resolvedAt");
