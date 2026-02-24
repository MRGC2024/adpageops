import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
@UseGuards(AuthGuard("jwt"))
export class TenantsController {
  constructor(private tenants: TenantsService) {}

  @Get("me")
  getMyTenant(@Req() req: any) {
    return this.tenants.getTenant(req.user.tenantId);
  }
}
