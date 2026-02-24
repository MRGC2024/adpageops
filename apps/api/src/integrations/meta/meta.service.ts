import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { TokenEncryptionService } from "../../crypto/token-encryption.service";
import { AuditService } from "../../audit/audit.service";
import { getAdAccounts } from "@adpageops/shared";

const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL}/integrations/meta/callback`
  : "http://localhost:4000/integrations/meta/callback";
const SCOPES = "ads_management,ads_read,business_management";
const META_API_VERSION = process.env.META_API_VERSION || "v21.0";

@Injectable()
export class MetaService {
  constructor(
    private prisma: PrismaService,
    private crypto: TokenEncryptionService,
    private audit: AuditService
  ) {}

  getConnectUrl(tenantId: string, userId: string): string {
    const state = Buffer.from(
      JSON.stringify({
        tenantId,
        userId,
        nonce: randomBytes(16).toString("hex"),
      })
    ).toString("base64url");
    const params = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: META_REDIRECT_URI,
      scope: SCOPES,
      response_type: "code",
      state,
    });
    return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<string> {
    const baseUrl = process.env.APP_BASE_URL || process.env.WEB_ORIGIN || "http://localhost:3000";
    const failUrl = `${baseUrl}/integrations?error=callback`;
    if (!code || !state) return failUrl;
    let payload: { tenantId: string; userId: string; nonce: string };
    try {
      payload = JSON.parse(Buffer.from(state, "base64url").toString());
    } catch {
      return failUrl;
    }
    const tokenUrl = `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token`;
    const params = new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: META_REDIRECT_URI,
      code,
    });
    const res = await fetch(`${tokenUrl}?${params.toString()}`);
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return failUrl;
    const encrypted = this.crypto.encrypt(data.access_token);
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;
    const scopesJson = Array.from(new Set(SCOPES.split(",").map((s) => s.trim())));
    let metaUserId: string | null = null;
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/me?access_token=${encodeURIComponent(data.access_token)}`
      );
      const meData = (await meRes.json()) as { id?: string };
      metaUserId = meData.id ?? null;
    } catch {
      // optional
    }
    await this.prisma.metaConnection.upsert({
      where: { tenantId: payload.tenantId },
      create: {
        tenantId: payload.tenantId,
        userId: payload.userId,
        metaUserId,
        accessTokenEncrypted: encrypted,
        tokenExpiresAt: expiresAt,
        scopesJson: scopesJson as any,
        status: "active",
      },
      update: {
        userId: payload.userId,
        metaUserId: metaUserId ?? undefined,
        accessTokenEncrypted: encrypted,
        tokenExpiresAt: expiresAt,
        scopesJson: scopesJson as any,
        status: "active",
      },
    });
    await this.audit.log({
      tenantId: payload.tenantId,
      userId: payload.userId,
      action: "meta_connect",
      entityType: "meta_connection",
      payloadJson: { metaUserId },
    });
    return `${baseUrl}/dashboard?connected=meta`;
  }

  async getStatus(tenantId: string) {
    const conn = await this.prisma.metaConnection.findUnique({
      where: { tenantId },
    });
    if (!conn || conn.status !== "active") return { connected: false };
    return { connected: true, metaUserId: conn.metaUserId };
  }

  async disconnect(tenantId: string, userId: string) {
    const conn = await this.prisma.metaConnection.findUnique({
      where: { tenantId },
    });
    if (conn) {
      await this.prisma.metaConnection.update({
        where: { tenantId },
        data: { status: "revoked" },
      });
      await this.audit.log({
        tenantId,
        userId,
        action: "meta_disconnect",
        entityType: "meta_connection",
      });
    }
  }

  async getAccessToken(tenantId: string): Promise<string | null> {
    const conn = await this.prisma.metaConnection.findUnique({
      where: { tenantId },
    });
    if (!conn || conn.status !== "active") return null;
    try {
      return this.crypto.decrypt(conn.accessTokenEncrypted);
    } catch {
      return null;
    }
  }

  async listAdAccountsForTenant(tenantId: string) {
    const token = await this.getAccessToken(tenantId);
    if (!token) return [];
    return getAdAccounts({ accessToken: token });
  }
}
