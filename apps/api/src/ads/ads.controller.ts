import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AdsService } from "./ads.service";
import { adsQuerySchema, type AdsQuery } from "@adpageops/shared";

@Controller("ads")
@UseGuards(AuthGuard("jwt"))
export class AdsController {
  constructor(private ads: AdsService) {}

  @Get()
  async list(@Req() req: any, @Query() query: unknown) {
    const q = adsQuerySchema.parse(query) as AdsQuery;
    return this.ads.list(req.user.tenantId, q.ad_account_id, q.page_id, q.status);
  }
}
