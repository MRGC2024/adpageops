import type { OperationalStatus } from "./types";

/**
 * Configurable parameters for status normalization.
 * @see docs/operational-status.md
 */
export interface StatusConfig {
  /** Window (days) to consider "delivery" (impressions > 0 or spend > 0). Default 7. */
  deliveryWindowDays: number;
  /** Min impressions in window to count as DELIVERING. Default 0. */
  minImpressionsForDelivering: number;
  /** Min spend in window to count as DELIVERING. Default 0. */
  minSpendForDelivering: number;
  /** Hours to consider IN_REVIEW "stale" (heuristic). Default 48. */
  inReviewStaleHours: number;
}

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  deliveryWindowDays: 7,
  minImpressionsForDelivering: 0,
  minSpendForDelivering: 0,
  inReviewStaleHours: 48,
};

/**
 * Fields used from Meta API:
 * - configured_status: ACTIVE | PAUSED | DELETED | ARCHIVED
 * - effective_status: ACTIVE | PAUSED | PENDING_REVIEW | DISAPPROVED | PREAPPROVED | PENDING_BILLING_INFO | etc.
 * - (when available) review_feedback, rejection_reason from ad_insights or ad level
 *
 * Heuristics (when Meta doesn't expose explicit review/reject):
 * - effective_status in PENDING_REVIEW, PENDING_BILLING_INFO → IN_REVIEW
 * - effective_status in DISAPPROVED, etc. → REJECTED
 * - No delivery in deliveryWindowDays with configured_status ACTIVE → NOT_DELIVERING
 */
export function normalizeOperationalStatus(params: {
  configuredStatus: string;
  effectiveStatus: string;
  /** Impressions in the delivery window (e.g. last 7 days). */
  impressionsInWindow: number;
  /** Spend in the delivery window. */
  spendInWindow: number;
  /** If Meta returned review/reject signal. */
  hasReviewSignal?: boolean;
  hasRejectSignal?: boolean;
  config?: Partial<StatusConfig>;
}): OperationalStatus {
  const config = { ...DEFAULT_STATUS_CONFIG, ...params.config };
  const cfg = (params.configuredStatus || "").toUpperCase();
  const eff = (params.effectiveStatus || "").toUpperCase();

  // 1. Explicit pause
  if (cfg === "PAUSED" || cfg === "ARCHIVED" || cfg === "DELETED") {
    return "PAUSED";
  }

  // 2. Account/permission issue (caller can set when API returns permission error)
  if (eff === "ERROR" || eff === "INVALID" || params.hasRejectSignal === true) {
    // If we have explicit reject signal from Meta, use REJECTED
    if (params.hasRejectSignal) return "REJECTED";
    if (eff === "ERROR" || eff === "INVALID") return "ACCOUNT_ISSUE";
  }

  // 3. Review (explicit or heuristic)
  if (params.hasReviewSignal === true) return "IN_REVIEW";
  const inReviewEffective = [
    "PENDING_REVIEW",
    "PENDING_BILLING_INFO",
    "PENDING_SETTLEMENT",
  ];
  if (inReviewEffective.some((s) => eff.includes(s))) return "IN_REVIEW";

  // 4. Rejected (heuristic from effective_status)
  const rejectedEffective = ["DISAPPROVED", "REJECTED"];
  if (rejectedEffective.some((s) => eff.includes(s))) return "REJECTED";

  // 5. Delivery in window
  const hasDelivery =
    params.impressionsInWindow > config.minImpressionsForDelivering ||
    params.spendInWindow > config.minSpendForDelivering;
  if (hasDelivery) return "DELIVERING";

  // 6. Active but no delivery in window
  if (cfg === "ACTIVE") return "NOT_DELIVERING";

  return "PAUSED";
}
