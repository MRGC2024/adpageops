import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  normalizeOperationalStatus,
  DEFAULT_STATUS_CONFIG,
  rankPagesByRecommended,
} from "@adpageops/shared";
import type { OperationalStatus, DashboardPageRow } from "@adpageops/shared";

type PageInsight = { impressions: number; spend: number; conversions: number };

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string, adAccountId: string, rangeDays: 7 | 14 | 30) {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const account = await this.prisma.adAccount.findFirst({
      where: { id: adAccountId, tenantId },
    });
    if (!account) return { pages: [], adAccount: null };

    const pages = await this.prisma.page.findMany({
      where: { tenantId, adAccountId },
      include: {
        ads: {
          include: {
            insightsDaily: {
              where: { date: { gte: since30 } },
              orderBy: { date: "desc" },
            },
          },
        },
      },
    });

    const insightRows = await this.prisma.insightDaily.findMany({
      where: {
        tenantId,
        adAccountId,
        entityLevel: "page",
        date: { gte: since30 },
      },
    });
    const byPageByRange: Record<string, { "7": PageInsight; "14": PageInsight; "30": PageInsight }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const r of insightRows) {
      const key = r.entityId;
      if (!byPageByRange[key]) {
        byPageByRange[key] = {
          "7": { impressions: 0, spend: 0, conversions: 0 },
          "14": { impressions: 0, spend: 0, conversions: 0 },
          "30": { impressions: 0, spend: 0, conversions: 0 },
        };
      }
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      const daysAgo = Math.floor((today.getTime() - d.getTime()) / 86400000);
      const actions = (r.actions as { action_type: string; value: string }[]) ?? [];
      const conv = actions.filter((a) => a.action_type?.includes("lead") || a.action_type?.includes("purchase")).reduce((s, a) => s + parseFloat(a.value || "0"), 0);
      const row = byPageByRange[key];
      if (daysAgo <= 7) {
        row["7"].impressions += r.impressions;
        row["7"].spend += Number(r.spend);
        row["7"].conversions += conv;
      }
      if (daysAgo <= 14) {
        row["14"].impressions += r.impressions;
        row["14"].spend += Number(r.spend);
        row["14"].conversions += conv;
      }
      row["30"].impressions += r.impressions;
      row["30"].spend += Number(r.spend);
      row["30"].conversions += conv;
    }

    const config = { ...DEFAULT_STATUS_CONFIG, deliveryWindowDays: Math.min(7, rangeDays) };

    const rows: (DashboardPageRow & { deliveringCount: number; spend7d: number; impressions7d: number })[] = [];
    for (const page of pages) {
      const counts: Record<OperationalStatus, number> = {
        DELIVERING: 0,
        NOT_DELIVERING: 0,
        IN_REVIEW: 0,
        REJECTED: 0,
        PAUSED: 0,
        ACCOUNT_ISSUE: 0,
      };
      for (const ad of page.ads) {
        const insights = ad.insightsDaily ?? [];
        const imp = insights.reduce((s, i) => s + i.impressions, 0);
        const spend = insights.reduce((s, i) => s + Number(i.spend), 0);
        const status = normalizeOperationalStatus({
          configuredStatus: ad.configuredStatus ?? "",
          effectiveStatus: ad.effectiveStatus ?? "",
          impressionsInWindow: imp,
          spendInWindow: spend,
          config: { deliveryWindowDays: config.deliveryWindowDays },
        });
        counts[status]++;
      }
      const ins = byPageByRange[page.id] ?? {
        "7": { impressions: 0, spend: 0, conversions: 0 },
        "14": { impressions: 0, spend: 0, conversions: 0 },
        "30": { impressions: 0, spend: 0, conversions: 0 },
      };
      rows.push({
        pageId: page.id,
        pageName: page.name ?? "Unknown",
        metaPageId: page.metaPageId,
        counts,
        spend7d: ins["7"].spend,
        spend14d: ins["14"].spend,
        spend30d: ins["30"].spend,
        impressions7d: ins["7"].impressions,
        impressions14d: ins["14"].impressions,
        impressions30d: ins["30"].impressions,
        conversions7d: ins["7"].conversions,
        conversions14d: ins["14"].conversions,
        conversions30d: ins["30"].conversions,
        saturationScore: 0,
        recommendedRank: 0,
        deliveringCount: counts.DELIVERING,
        spend7d: ins["7"].spend,
        impressions7d: ins["7"].impressions,
      });
    }

    const withRank = rankPagesByRecommended(rows);
    return {
      adAccount: { id: account.id, name: account.name, metaAdAccountId: account.metaAdAccountId },
      pages: withRank.map((r) => ({
        pageId: r.pageId,
        pageName: r.pageName,
        metaPageId: r.metaPageId,
        counts: r.counts,
        spend7d: r.spend7d,
        spend14d: r.spend14d,
        spend30d: r.spend30d,
        impressions7d: r.impressions7d,
        impressions14d: r.impressions14d,
        impressions30d: r.impressions30d,
        conversions7d: r.conversions7d,
        conversions14d: r.conversions14d,
        conversions30d: r.conversions30d,
        saturationScore: r.saturationScore,
        recommendedRank: r.recommendedRank,
      })),
    };
  }
}
