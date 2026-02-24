import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SyncService } from "./sync.service";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";

@Controller("sync")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class SyncController {
  constructor(private sync: SyncService) {}

  @Post("run")
  @Roles("tenant_admin")
  async run(@Req() req: any, @Body() body: { ad_account_id: string; type?: "inventory" | "insights" }) {
    const tenantId = req.user.tenantId;
    const adAccountId = body?.ad_account_id;
    if (!adAccountId) throw new Error("ad_account_id required");
    if (body?.type === "insights") {
      return this.sync.runInsightsSync(tenantId, adAccountId);
    }
    return this.sync.runInventorySync(tenantId, adAccountId);
  }
}
