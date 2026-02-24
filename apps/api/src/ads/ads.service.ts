import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeOperationalStatus, DEFAULT_STATUS_CONFIG } from "@adpageops/shared";

@Injectable()
export class AdsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, adAccountId: string, pageId?: string, status?: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const where: any = { tenantId, adAccountId };
    if (pageId) where.pageId = pageId;

    const ads = await this.prisma.ad.findMany({
      where,
      include: {
        page: true,
        adSet: true,
        insightsDaily: { where: { date: { gte: since } }, orderBy: { date: "desc" }, take: 1 },
      },
    });
    const config = { ...DEFAULT_STATUS_CONFIG, deliveryWindowDays: 7 };
    const withStatus = ads.map((ad) => {
      const imp = ad.insightsDaily.reduce((s, i) => s + i.impressions, 0);
      const spend = ad.insightsDaily.reduce((s, i) => s + Number(i.spend), 0);
      const operationalStatus = normalizeOperationalStatus({
        configuredStatus: ad.configuredStatus ?? "",
        effectiveStatus: ad.effectiveStatus ?? "",
        impressionsInWindow: imp,
        spendInWindow: spend,
        config: { deliveryWindowDays: config.deliveryWindowDays },
      });
      return {
        id: ad.id,
        metaAdId: ad.metaAdId,
        name: ad.name,
        configuredStatus: ad.configuredStatus,
        effectiveStatus: ad.effectiveStatus,
        operationalStatus,
        pageId: ad.pageId,
        pageName: ad.page?.name,
        adsetId: ad.adSetId,
        campaignId: ad.adSet?.campaignId,
        lastSpend: ad.insightsDaily[0] ? Number(ad.insightsDaily[0].spend) : 0,
        lastImpressions: ad.insightsDaily[0]?.impressions ?? 0,
      };
    });
    if (status) return withStatus.filter((a) => a.operationalStatus === status);
    return withStatus;
  }
}
