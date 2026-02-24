import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { normalizeOperationalStatus, DEFAULT_STATUS_CONFIG } from "@adpageops/shared";

const prisma = new PrismaClient();

const ALERT_RULES = {
  DELIVERING_GT_N: { key: "delivering_gt_n", defaultN: 10 },
  REJECTED_7D_GT_N: { key: "rejected_7d_gt_n", defaultN: 3 },
  IN_REVIEW_STALE: { key: "in_review_stale", defaultHours: 48 },
  NOT_DELIVERING_DAYS: { key: "not_delivering_days", defaultDays: 7 },
};

export async function alertsProcessor(job: Job<{ tenantId: string; adAccountId: string; correlationId?: string }>) {
  const { tenantId, adAccountId } = job.data;
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const pages = await prisma.page.findMany({
    where: { tenantId, adAccountId },
    include: {
      ads: {
        include: {
          insightsDaily: { where: { date: { gte: since7 } } },
        },
      },
    },
  });

  const config = { ...DEFAULT_STATUS_CONFIG, deliveryWindowDays: 7 };

  for (const page of pages) {
    const counts: Record<string, number> = {};
    for (const ad of page.ads) {
      const imp = ad.insightsDaily.reduce((s, i) => s + i.impressions, 0);
      const spend = ad.insightsDaily.reduce((s, i) => s + Number(i.spend), 0);
      const status = normalizeOperationalStatus({
        configuredStatus: ad.configuredStatus ?? "",
        effectiveStatus: ad.effectiveStatus ?? "",
        impressionsInWindow: imp,
        spendInWindow: spend,
        config,
      });
      counts[status] = (counts[status] || 0) + 1;
    }

    const delivering = counts.DELIVERING || 0;
    const rejected = counts.REJECTED || 0;
    const inReview = counts.IN_REVIEW || 0;
    const notDelivering = counts.NOT_DELIVERING || 0;

    const N = 10;
    if (delivering > N) {
      await upsertAlert(tenantId, adAccountId, "delivering_gt_n", { pageId: page.id, count: delivering, threshold: N, message: `Page has ${delivering} ads DELIVERING (threshold ${N})` });
    } else {
      await resolveAlert(tenantId, adAccountId, "delivering_gt_n", page.id);
    }

    if (rejected >= 3) {
      await upsertAlert(tenantId, adAccountId, "rejected_7d_gt_n", { pageId: page.id, count: rejected, threshold: 3, message: `Page has ${rejected} REJECTED ads in last 7 days` });
    } else {
      await resolveAlert(tenantId, adAccountId, "rejected_7d_gt_n", page.id);
    }

    if (inReview > 0) {
      await upsertAlert(tenantId, adAccountId, "in_review_stale", { pageId: page.id, count: inReview, message: `${inReview} ads IN_REVIEW` });
    } else {
      await resolveAlert(tenantId, adAccountId, "in_review_stale", page.id);
    }

    if (notDelivering >= 1) {
      await upsertAlert(tenantId, adAccountId, "not_delivering_days", { pageId: page.id, count: notDelivering, message: `${notDelivering} ads NOT_DELIVERING with active config` });
    } else {
      await resolveAlert(tenantId, adAccountId, "not_delivering_days", page.id);
    }
  }
}

async function upsertAlert(tenantId: string, adAccountId: string, ruleKey: string, payload: any) {
  const existing = await prisma.alert.findFirst({
    where: { tenantId, adAccountId, ruleKey, resolvedAt: null },
  });
  if (existing) {
    await prisma.alert.update({ where: { id: existing.id }, data: { payloadJson: payload } });
    return;
  }
  await prisma.alert.create({
    data: {
      tenantId,
      adAccountId,
      ruleKey,
      type: ruleKey,
      severity: "medium",
      entityType: "page",
      entityId: payload?.pageId ?? null,
      payloadJson: payload,
    },
  });
}

async function resolveAlert(tenantId: string, adAccountId: string, ruleKey: string, _pageId: string) {
  await prisma.alert.updateMany({
    where: { tenantId, adAccountId, ruleKey, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
}
