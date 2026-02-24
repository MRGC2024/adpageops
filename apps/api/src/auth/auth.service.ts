import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { RegisterInput, LoginInput } from "@adpageops/shared";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private audit: AuditService
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new Error("Email already registered");

    const tenant = await this.prisma.tenant.create({
      data: { name: input.tenantName || input.email.split("@")[0] },
    });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        tenantId: tenant.id,
        role: "tenant_admin",
      },
      select: { id: true, email: true, role: true, tenantId: true },
    });
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });
    await this.audit.log({ tenantId: tenant.id, userId: user.id, action: "register", entityType: "user", entityId: user.id });
    return { user: { ...user, tenantName: tenant.name }, token };
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    });
    if (!user) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new Error("Invalid credentials");
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });
    await this.audit.log({ tenantId: user.tenantId, userId: user.id, action: "login", entityType: "user", entityId: user.id });
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
      token,
    };
  }

  async validateUser(payload: { sub: string }) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tenantId: true },
    });
  }
}
