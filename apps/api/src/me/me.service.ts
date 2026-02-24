import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MeService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, tenantId: true, createdAt: true },
      include: { tenant: { select: { name: true } } },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: (user as any).tenant?.name,
      createdAt: user.createdAt,
    };
  }
}
