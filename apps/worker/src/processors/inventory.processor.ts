import { Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { metaFetch, metaFetchAll, type MetaClientConfig } from "@adpageops/shared";

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

function extractPageIdFromCreative(creative: any): { pageId?: string; instagramActorId?: string } {
  const spec = creative?.object_story_spec;
  if (!spec) return {};
  const link = spec?.link_data?.picture;
  const page = spec?.page_id ?? spec?.instagram_actor_id;
  const ig = spec?.instagram_actor_id ?? spec?.page_id;
  return { pageId: page || undefined, instagramActorId: ig || undefined };
}

export async function inventoryProcessor(job: Job<{ tenantId: string; adAccountId: string; correlationId?: string }>) {
  const { tenantId, adAccountId } = job.data;
  const conn = await prisma.metaConnection.findUnique({ where: { tenantId } });
  if (!conn) throw new Error("No Meta connection");
  const token = getTokenDecrypt(conn.accessTokenEncrypted);
  const config: MetaClientConfig = { accessToken: token, maxRetries: 3, backoffMs: 1000 };

  const account = await prisma.adAccount.findFirst({ where: { id: adAccountId, tenantId } });
  if (!account) throw new Error("Ad account not found");
  const actId = account.metaAdAccountId;

  const campaignsData = await metaFetchAll<{ id: string; name: string; status: string; effective_status: string }>(
    `/${actId}/campaigns`,
    { fields: "id,name,status,effective_status" },
    config
  );
  for (const c of campaignsData) {
    await prisma.campaign.upsert({
      where: { tenantId_metaCampaignId: { tenantId, metaCampaignId: c.id } },
      create: { tenantId, adAccountId, metaCampaignId: c.id, name: c.name, status: c.status, effectiveStatus: c.effective_status },
      update: { name: c.name, status: c.status, effectiveStatus: c.effective_status },
    });
  }

  const campaigns = await prisma.campaign.findMany({ where: { tenantId, adAccountId }, select: { id: true, metaCampaignId: true } });
  for (const camp of campaigns) {
    const adsetsData = await metaFetchAll<{ id: string; name: string; status: string; effective_status: string; optimization_goal?: string; billing_event?: string }>(
      `/${camp.metaCampaignId}/adsets`,
      { fields: "id,name,status,effective_status,optimization_goal,billing_event" },
      config
    );
    for (const a of adsetsData) {
      await prisma.adSet.upsert({
        where: { tenantId_metaAdSetId: { tenantId, metaAdSetId: a.id } },
        create: {
          tenantId,
          adAccountId,
          campaignId: camp.id,
          metaAdSetId: a.id,
          name: a.name,
          status: a.status,
          effectiveStatus: a.effective_status,
          optimizationGoal: a.optimization_goal,
          billingEvent: a.billing_event,
        },
        update: { name: a.name, status: a.status, effectiveStatus: a.effective_status, optimizationGoal: a.optimization_goal, billingEvent: a.billing_event },
      });
    }
  }

  const adsets = await prisma.adSet.findMany({ where: { tenantId, adAccountId }, select: { id: true, metaAdSetId: true } });
  for (const adset of adsets) {
    const adsData = await metaFetchAll<{ id: string; name: string; configured_status: string; effective_status: string; creative?: { id: string } }>(
      `/${adset.metaAdSetId}/ads`,
      { fields: "id,name,configured_status,effective_status,creative{id}" },
      config
    );
    for (const ad of adsData) {
      let pageId: string | null = null;
      if (ad.creative?.id) {
        const creativeRes = await metaFetch<any>(`/${ad.creative.id}`, { fields: "object_story_spec" }, config);
        const data = creativeRes as { object_story_spec?: any };
        const { pageId: pid, instagramActorId: igId } = extractPageIdFromCreative(data);
        const pageKey = pid || igId;
        if (pageKey) {
          const page = await prisma.page.upsert({
            where: {
              tenantId_adAccountId_metaPageId: { tenantId, adAccountId, metaPageId: pageKey },
            },
            create: {
              tenantId,
              adAccountId,
              metaPageId: pid ?? null,
              metaInstagramActorId: igId ?? null,
              name: pageKey,
            },
            update: {},
          });
          pageId = page.id;
        }
      }
      await prisma.ad.upsert({
        where: { tenantId_metaAdId: { tenantId, metaAdId: ad.id } },
        create: {
          tenantId,
          adAccountId,
          adSetId: adset.id,
          metaAdId: ad.id,
          name: ad.name,
          configuredStatus: ad.configured_status,
          effectiveStatus: ad.effective_status,
          pageId,
        },
        update: {
          name: ad.name,
          configuredStatus: ad.configured_status,
          effectiveStatus: ad.effective_status,
          pageId,
        },
      });
    }
  }
}
