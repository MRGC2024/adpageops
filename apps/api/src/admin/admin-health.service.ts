import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminHealthService {
  constructor(private prisma: PrismaService) {}

  async checkDb(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "DB connection failed" };
    }
  }

  async checkRedis(): Promise<{ ok: boolean; error?: string }> {
    try {
      const Redis = require("ioredis");
      const url = process.env.REDIS_URL || "redis://localhost:6379";
      const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
      await client.ping();
      await client.quit();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Redis connection failed" };
    }
  }

  async checkMeta(): Promise<{ ok: boolean; error?: string; hint?: string }> {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_REDIRECT_URI;
    if (!appId || !appSecret) {
      return {
        ok: false,
        error: "META_APP_ID or META_APP_SECRET not set",
        hint: "Meta for Developers → My Apps → [App] → Settings → Basic",
      };
    }
    if (!redirectUri) {
      return {
        ok: false,
        error: "META_REDIRECT_URI not set",
        hint: "Set to API_BASE_URL + /integrations/meta/callback. Meta → Facebook Login → Settings → Valid OAuth Redirect URIs",
      };
    }
    try {
      const version = process.env.META_API_VERSION || "v21.0";
      const res = await fetch(
        `https://graph.facebook.com/${version}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`,
        { method: "GET" }
      );
      const data = await res.json();
      if (data.access_token) return { ok: true };
      return {
        ok: false,
        error: data.error?.message || "Meta API check failed",
        hint: "Verify App ID and App Secret in Meta for Developers → Settings → Basic",
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Meta request failed" };
    }
  }

  generateSecrets(): { jwtSecret: string; encryptionKey: string } {
    const crypto = require("crypto");
    const jwtSecret = crypto.randomBytes(64).toString("hex");
    const encryptionKey = Array.from(crypto.randomBytes(32), (b: number) => String.fromCharCode(33 + (b % 94))).join("");
    return { jwtSecret, encryptionKey };
  }
}
