/** Operational status taxonomy (deterministic) */
export type OperationalStatus =
  | "DELIVERING"
  | "NOT_DELIVERING"
  | "IN_REVIEW"
  | "REJECTED"
  | "PAUSED"
  | "ACCOUNT_ISSUE";

export type TenantRole = "tenant_admin" | "tenant_user";

export type InsightRange = 7 | 14 | 30;

export interface DashboardPageRow {
  pageId: string;
  pageName: string;
  metaPageId: string | null;
  counts: Record<OperationalStatus, number>;
  spend7d: number;
  spend14d: number;
  spend30d: number;
  impressions7d: number;
  impressions14d: number;
  impressions30d: number;
  conversions7d: number;
  conversions14d: number;
  conversions30d: number;
  saturationScore: number;
  recommendedRank: number;
}

export interface AdWithStatus {
  id: string;
  metaAdId: string;
  name: string;
  configuredStatus: string;
  effectiveStatus: string;
  operationalStatus: OperationalStatus;
  adsetId: string;
  campaignId: string;
  lastSpend: number;
  lastImpressions: number;
  lastConversions: number;
}

export interface AlertPayload {
  ruleKey: string;
  adAccountId: string;
  pageId?: string;
  count?: number;
  threshold?: number;
  message: string;
}
