import { Controller, Get, Param, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { PagesService } from "./pages.service";
import { pageDetailQuerySchema, type PageDetailQuery } from "@adpageops/shared";

@Controller("pages")
@UseGuards(AuthGuard("jwt"))
export class PagesController {
  constructor(private pages: PagesService) {}

  @Get(":pageId")
  async get(@Req() req: any, @Param("pageId") pageId: string, @Query() query: unknown) {
    const parsed = pageDetailQuerySchema.parse(query) as PageDetailQuery;
    return this.pages.getPageDetail(req.user.tenantId, pageId, parsed.ad_account_id, parsed.range as 7 | 14 | 30);
  }

  @Get(":pageId/export")
  async export(@Req() req: any, @Param("pageId") pageId: string, @Query() query: unknown, @Res() res: Response) {
    const parsed = pageDetailQuerySchema.parse(query) as PageDetailQuery;
    const csv = await this.pages.exportPageCsv(req.user.tenantId, pageId, parsed.ad_account_id, parsed.range as 7 | 14 | 30);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="page-${pageId}-export.csv"`);
    res.send(csv);
  }
}
