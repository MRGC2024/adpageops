import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdAccountsService } from "./ad-accounts.service";
import { selectAdAccountsSchema, type SelectAdAccountsInput } from "@adpageops/shared";

@Controller("ad-accounts")
@UseGuards(AuthGuard("jwt"))
export class AdAccountsController {
  constructor(private adAccounts: AdAccountsService) {}

  @Get()
  list(@Req() req: any) {
    return this.adAccounts.listForTenant(req.user.tenantId);
  }

  @Post("select")
  select(@Req() req: any, @Body() body: unknown) {
    const input = selectAdAccountsSchema.parse(body) as SelectAdAccountsInput;
    return this.adAccounts.select(req.user.tenantId, input);
  }
}
