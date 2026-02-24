import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MetaService } from "../integrations/meta/meta.service";
import type { SelectAdAccountsInput } from "@adpageops/shared";

@Injectable()
export class AdAccountsService {
  constructor(
    private prisma: PrismaService,
    private meta: MetaService
  ) {}

  async listForTenant(tenantId: string) {
    const accounts = await this.prisma.adAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    if (accounts.length > 0) return accounts;
    const metaAccounts = await this.meta.listAdAccountsForTenant(tenantId);
    for (const m of metaAccounts) {
      const id = m.id.replace("act_", "");
      await this.prisma.adAccount.upsert({
        where: {
          tenantId_metaAdAccountId: { tenantId, metaAdAccountId: m.id },
        },
        create: {
          tenantId,
          metaAdAccountId: m.id,
          name: m.name ?? null,
          isSelected: false,
        },
        update: { name: m.name ?? undefined },
      });
    }
    return this.prisma.adAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async select(tenantId: string, input: SelectAdAccountsInput) {
    await this.prisma.adAccount.updateMany({
      where: { tenantId },
      data: { isSelected: false },
    });
    const ids = await this.prisma.adAccount.findMany({
      where: {
        tenantId,
        metaAdAccountId: { in: input.adAccountIds },
      },
      select: { id: true },
    });
    if (ids.length) {
      await this.prisma.adAccount.updateMany({
        where: { id: { in: ids.map((x) => x.id) } },
        data: { isSelected: true },
      });
    }
    return this.listForTenant(tenantId);
  }
}
