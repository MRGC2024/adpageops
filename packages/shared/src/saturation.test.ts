import { describe, it } from "node:test";
import assert from "node:assert";
import { computeSaturationScore, rankPagesByRecommended } from "./saturation";

describe("computeSaturationScore", () => {
  it("returns higher score for more delivering and spend", () => {
    const a = computeSaturationScore({ deliveringCount: 1, spend7d: 0, impressions7d: 0 });
    const b = computeSaturationScore({ deliveringCount: 10, spend7d: 100, impressions7d: 1000 });
    assert.ok(b > a);
  });
});

describe("rankPagesByRecommended", () => {
  it("ranks by lower saturation first", () => {
    const pages = [
      { deliveringCount: 5, spend7d: 50, impressions7d: 500 },
      { deliveringCount: 1, spend7d: 0, impressions7d: 0 },
      { deliveringCount: 10, spend7d: 200, impressions7d: 2000 },
    ];
    const ranked = rankPagesByRecommended(pages);
    assert.strictEqual(ranked[0].recommendedRank, 1);
    assert.strictEqual(ranked[0].deliveringCount, 1);
    assert.strictEqual(ranked[2].recommendedRank, 3);
  });
});
