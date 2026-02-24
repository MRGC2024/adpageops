import type { OperationalStatus } from "./types";

/**
 * Saturation score: higher = page is "heavier" (more ads delivering, more spend).
 * Used for ranking "recommended page" (often we want lower saturation for diversification).
 *
 * Formula (configurable): weight by delivering count + log(spend + 1) + log(impressions + 1)
 */
export interface SaturationInput {
  deliveringCount: number;
  spend7d: number;
  impressions7d: number;
}

export interface SaturationConfig {
  weightDelivering: number;
  weightSpend: number;
  weightImpressions: number;
  spendLogScale: number;
  impressionsLogScale: number;
}

export const DEFAULT_SATURATION_CONFIG: SaturationConfig = {
  weightDelivering: 10,
  weightSpend: 2,
  weightImpressions: 1,
  spendLogScale: 1,
  impressionsLogScale: 1,
};

export function computeSaturationScore(
  input: SaturationInput,
  config: Partial<SaturationConfig> = {}
): number {
  const c = { ...DEFAULT_SATURATION_CONFIG, ...config };
  const spendScore = Math.log1p(input.spend7d) * c.weightSpend * c.spendLogScale;
  const impScore =
    Math.log1p(input.impressions7d) * c.weightImpressions * c.impressionsLogScale;
  return (
    input.deliveringCount * c.weightDelivering + spendScore + impScore
  );
}

/**
 * Rank pages for "recommended": lower saturation = higher rank (1 = best).
 * Ties broken by spend (lower spend = better rank).
 */
export function rankPagesByRecommended<T extends SaturationInput>(
  pages: T[],
  config?: Partial<SaturationConfig>
): (T & { saturationScore: number; recommendedRank: number })[] {
  const withScore = pages.map((p) => ({
    ...p,
    saturationScore: computeSaturationScore(p, config),
  }));
  withScore.sort((a, b) => {
    if (a.saturationScore !== b.saturationScore)
      return a.saturationScore - b.saturationScore;
    return a.spend7d - b.spend7d;
  });
  return withScore.map((p, i) => ({ ...p, recommendedRank: i + 1 }));
}
