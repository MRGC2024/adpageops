import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AlertsService } from "./alerts.service";
import { alertsQuerySchema, type AlertsQuery } from "@adpageops/shared";

@Controller("alerts")
@UseGuards(AuthGuard("jwt"))
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  async list(@Req() req: any, @Query() query: unknown) {
    const q = alertsQuerySchema.parse(query) as AlertsQuery;
    return this.alerts.list(req.user.tenantId, q.ad_account_id, q.status);
  }

  @Post(":id/resolve")
  async resolve(@Req() req: any, @Param("id") id: string) {
    return this.alerts.resolve(req.user.tenantId, req.user.id, id);
  }
}
