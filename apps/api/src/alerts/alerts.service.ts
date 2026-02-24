import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async list(tenantId: string, adAccountId?: string, status?: "open" | "resolved") {
    const where: any = { tenantId };
    if (adAccountId) where.adAccountId = adAccountId;
    if (status === "open") where.resolvedAt = null;
    if (status === "resolved") where.resolvedAt = { not: null };
    return this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async resolve(tenantId: string, userId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, tenantId },
    });
    if (!alert) throw new Error("Alert not found");
    await this.prisma.alert.update({
      where: { id: alertId },
      data: { resolvedAt: new Date() },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: "alert_resolve",
      entityType: "alert",
      entityId: alertId,
      payloadJson: { type: alert.type },
    });
    return { ok: true };
  }
}
