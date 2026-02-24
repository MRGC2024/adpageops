import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DashboardService } from "./dashboard.service";
import { dashboardQuerySchema, type DashboardQuery } from "@adpageops/shared";

@Controller("dashboard")
@UseGuards(AuthGuard("jwt"))
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  async get(@Req() req: any, @Query() query: unknown) {
    const { ad_account_id, range } = dashboardQuerySchema.parse(query) as DashboardQuery;
    return this.dashboard.getDashboard(req.user.tenantId, ad_account_id, range as 7 | 14 | 30);
  }
}
