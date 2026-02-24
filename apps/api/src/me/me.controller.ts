import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MeService } from "./me.service";

@Controller("me")
@UseGuards(AuthGuard("jwt"))
export class MeController {
  constructor(private me: MeService) {}

  @Get()
  getMe(@Req() req: any) {
    return this.me.getMe(req.user.id);
  }
}
