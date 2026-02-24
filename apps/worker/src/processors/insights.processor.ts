import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { metaFetchAll, type MetaClientConfig } from "@adpageops/shared";

const prisma = new PrismaClient();

function getTokenDecrypt(encrypted: string): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.TOKEN_ENCRYPTION_KEY || "adpageops-default-32-byte-key!!";
  const key = new TextEncoder().encode(secret.padEnd(32).slice(0, 32));
  const nacl = require("tweetnacl");
  const combined = new Uint8Array(Buffer.from(encrypted, "base64"));
  const nonce = combined.slice(0, 24);
  const box = combined.slice(24);
  const out = nacl.secretbox.open(box, nonce, key);
  if (!out) throw new Error("Decryption failed");
  return new TextDecoder().decode(out);
}

export async function insightsProcessor(job: Job<{ tenantId: string; adAccountId: string; correlationId?: string }>) {
  const { tenantId, adAccountId } = job.data;
  const conn = await prisma.metaConnection.findUnique({ where: { tenantId } });
  if (!conn) throw new Error("No Meta connection");
  const token = getTokenDecrypt(conn.accessTokenEncrypted);
  const config: MetaClientConfig = { accessToken: token, maxRetries: 3, backoffMs: 1000 };

  const account = await prisma.adAccount.findFirst({ where: { id: adAccountId, tenantId } });
  if (!account) throw new Error("Ad account not found");
  const actId = account.metaAdAccountId;

  const since = new Date();
  since.setDate(since.getDate() - 2);
  const timeRange = `{"since":"${since.toISOString().slice(0, 10)}"}`;

  const ads = await prisma.ad.findMany({ where: { tenantId, adAccountId }, select: { id: true, metaAdId: true } });
  for (const ad of ads) {
    const res = await metaFetchAll<any>(
      `/${ad.metaAdId}/insights`,
      { level: "ad", time_range: timeRange, time_increment: "1", fields: "impressions,spend,clicks,actions,action_values" },
      config
    );
    for (const row of res) {
      const date = row.date_start ? new Date(row.date_start) : new Date();
      const actions = row.actions ?? [];
      const actionValues = row.action_values ?? [];
      await prisma.insightDaily.upsert({
        where: {
          tenantId_entityLevel_entityId_date: { tenantId, entityLevel: "ad", entityId: ad.id, date },
        },
        create: {
          tenantId,
          adAccountId,
          entityLevel: "ad",
          entityId: ad.id,
          date,
          impressions: parseInt(row.impressions || "0", 10),
          spend: parseFloat(row.spend || "0"),
          clicks: parseInt(row.clicks || "0", 10),
          actions: actions.length ? actions : undefined,
          actionValues: actionValues.length ? actionValues : undefined,
        },
        update: {
          impressions: parseInt(row.impressions || "0", 10),
          spend: parseFloat(row.spend || "0"),
          clicks: parseInt(row.clicks || "0", 10),
          actions: actions.length ? actions : undefined,
          actionValues: actionValues.length ? actionValues : undefined,
        },
      });
    }
  }

  const pages = await prisma.page.findMany({ where: { tenantId, adAccountId }, include: { ads: { select: { id: true } } } });
  for (const page of pages) {
    const adIds = page.ads.map((a) => a.id);
    const insightRows = await prisma.insightDaily.findMany({
      where: { tenantId, adAccountId, entityLevel: "ad", entityId: { in: adIds }, date: { gte: since } },
    });
    const byDate: Record<string, { impressions: number; spend: number; actions: any[]; actionValues: any[] }> = {};
    for (const r of insightRows) {
      const d = r.date.toISOString().slice(0, 10);
      if (!byDate[d]) byDate[d] = { impressions: 0, spend: 0, actions: [], actionValues: [] };
      byDate[d].impressions += r.impressions;
      byDate[d].spend += Number(r.spend);
    }
    for (const [d, agg] of Object.entries(byDate)) {
      const date = new Date(d);
      await prisma.insightDaily.upsert({
        where: {
          tenantId_entityLevel_entityId_date: { tenantId, entityLevel: "page", entityId: page.id, date },
        },
        create: {
          tenantId,
          adAccountId,
          entityLevel: "page",
          entityId: page.id,
          date,
          impressions: agg.impressions,
          spend: agg.spend,
          actions: agg.actions.length ? agg.actions : undefined,
          actionValues: agg.actionValues.length ? agg.actionValues : undefined,
        },
        update: { impressions: agg.impressions, spend: agg.spend },
      });
    }
  }
}
