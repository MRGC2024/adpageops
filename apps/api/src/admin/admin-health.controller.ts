import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AdminHealthService } from "./admin-health.service";

@Controller("admin/health")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("tenant_admin")
export class AdminHealthController {
  constructor(private health: AdminHealthService) {}

  @Get("db")
  async db() {
    return this.health.checkDb();
  }

  @Get("redis")
  async redis() {
    return this.health.checkRedis();
  }

  @Get("meta")
  async meta() {
    return this.health.checkMeta();
  }

  @Get("secrets-generator")
  async secretsGenerator() {
    return this.health.generateSecrets();
  }
}
