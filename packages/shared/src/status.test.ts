import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeOperationalStatus } from "./status";

describe("normalizeOperationalStatus", () => {
  it("returns PAUSED when configured_status is PAUSED", () => {
    assert.strictEqual(
      normalizeOperationalStatus({
        configuredStatus: "PAUSED",
        effectiveStatus: "PAUSED",
        impressionsInWindow: 100,
        spendInWindow: 10,
      }),
      "PAUSED"
    );
  });

  it("returns DELIVERING when has impressions in window", () => {
    assert.strictEqual(
      normalizeOperationalStatus({
        configuredStatus: "ACTIVE",
        effectiveStatus: "ACTIVE",
        impressionsInWindow: 1,
        spendInWindow: 0,
      }),
      "DELIVERING"
    );
  });

  it("returns NOT_DELIVERING when ACTIVE but no delivery", () => {
    assert.strictEqual(
      normalizeOperationalStatus({
        configuredStatus: "ACTIVE",
        effectiveStatus: "ACTIVE",
        impressionsInWindow: 0,
        spendInWindow: 0,
      }),
      "NOT_DELIVERING"
    );
  });

  it("returns IN_REVIEW when effective_status is PENDING_REVIEW", () => {
    assert.strictEqual(
      normalizeOperationalStatus({
        configuredStatus: "ACTIVE",
        effectiveStatus: "PENDING_REVIEW",
        impressionsInWindow: 0,
        spendInWindow: 0,
      }),
      "IN_REVIEW"
    );
  });

  it("returns REJECTED when effective_status is DISAPPROVED", () => {
    assert.strictEqual(
      normalizeOperationalStatus({
        configuredStatus: "ACTIVE",
        effectiveStatus: "DISAPPROVED",
        impressionsInWindow: 0,
        spendInWindow: 0,
      }),
      "REJECTED"
    );
  });
});
