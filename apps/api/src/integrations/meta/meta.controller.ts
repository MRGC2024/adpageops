import { Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { MetaService } from "./meta.service";

@Controller("integrations/meta")
export class MetaController {
  constructor(private meta: MetaService) {}

  @Get("connect")
  @UseGuards(AuthGuard("jwt"))
  connect(@Req() req: Request, @Res() res: Response) {
    const url = this.meta.getConnectUrl((req as any).user.tenantId, (req as any).user.id);
    const accept = (req.headers.accept || "").toLowerCase();
    if (accept.includes("application/json")) {
      return res.json({ redirectUrl: url });
    }
    return res.redirect(url);
  }

  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response
  ) {
    const redirect = await this.meta.handleCallback(code, state);
    return res.redirect(redirect);
  }

  @Get("status")
  @UseGuards(AuthGuard("jwt"))
  async status(@Req() req: Request) {
    const user = (req as any).user;
    return this.meta.getStatus(user.tenantId);
  }

  @Post("disconnect")
  @UseGuards(AuthGuard("jwt"))
  async disconnect(@Req() req: Request) {
    const user = (req as any).user;
    await this.meta.disconnect(user.tenantId, user.id);
    return { ok: true };
  }
}
