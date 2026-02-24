import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeOperationalStatus, DEFAULT_STATUS_CONFIG } from "@adpageops/shared";
import type { OperationalStatus } from "@adpageops/shared";

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async getPageDetail(tenantId: string, pageId: string, adAccountId: string, rangeDays: 7 | 14 | 30) {
    const since = new Date();
    since.setDate(since.getDate() - rangeDays);

    const page = await this.prisma.page.findFirst({
      where: { id: pageId, tenantId, adAccountId },
      include: {
        ads: {
          include: {
            adSet: true,
            insightsDaily: { where: { date: { gte: since } }, orderBy: { date: "desc" } },
          },
        },
      },
    });
    if (!page) return null;

    const config = { ...DEFAULT_STATUS_CONFIG, deliveryWindowDays: Math.min(7, rangeDays) };
    const adsWithStatus = page.ads.map((ad) => {
      const imp = ad.insightsDaily.reduce((s, i) => s + i.impressions, 0);
      const spend = ad.insightsDaily.reduce((s, i) => s + Number(i.spend), 0);
      const operationalStatus = normalizeOperationalStatus({
        configuredStatus: ad.configuredStatus ?? "",
        effectiveStatus: ad.effectiveStatus ?? "",
        impressionsInWindow: imp,
        spendInWindow: spend,
        config: { deliveryWindowDays: config.deliveryWindowDays },
      });
      const lastInsight = ad.insightsDaily[0];
      return {
        id: ad.id,
        metaAdId: ad.metaAdId,
        name: ad.name,
        configuredStatus: ad.configuredStatus,
        effectiveStatus: ad.effectiveStatus,
        operationalStatus,
        adsetId: ad.adSetId,
        campaignId: ad.adSet?.campaignId,
        lastSpend: lastInsight ? Number(lastInsight.spend) : 0,
        lastImpressions: lastInsight?.impressions ?? 0,
        lastConversions: 0,
        adSet: ad.adSet ? { id: ad.adSet.id, name: ad.adSet.name, optimizationGoal: ad.adSet.optimizationGoal } : null,
      };
    });

    return {
      page: { id: page.id, name: page.name, metaPageId: page.metaPageId, metaInstagramActorId: page.metaInstagramActorId },
      ads: adsWithStatus,
      adsets: [...new Map(page.ads.map((a) => [a.adSet?.id, a.adSet]).filter(([, s]) => s)).values()].filter(Boolean).map((s) => ({ id: (s as any).id, name: (s as any).name, optimizationGoal: (s as any).optimizationGoal })),
    };
  }

  async exportPageCsv(tenantId: string, pageId: string, adAccountId: string, rangeDays: 7 | 14 | 30): Promise<string> {
    const detail = await this.getPageDetail(tenantId, pageId, adAccountId, rangeDays);
    if (!detail) return "";
    const header = "Ad ID,Name,Configured Status,Effective Status,Operational Status,Ad Set,Optimization Goal,Last Spend,Last Impressions\n";
    const rows = detail.ads.map(
      (a) =>
        `${a.metaAdId},"${(a.name ?? "").replace(/"/g, '""')}",${a.configuredStatus ?? ""},${a.effectiveStatus ?? ""},${a.operationalStatus},${a.adSet?.name ?? ""},${a.adSet?.optimizationGoal ?? ""},${a.lastSpend},${a.lastImpressions}`
    );
    return header + rows.join("\n");
  }
}
