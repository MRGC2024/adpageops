import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuditService } from "../audit/audit.service";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "@adpageops/shared";

@Controller("auth")
export class AuthController {
  constructor(
    private auth: AuthService,
    private audit: AuditService
  ) {}

  @Post("register")
  async register(@Body() body: unknown) {
    const input = registerSchema.parse(body) as RegisterInput;
    return this.auth.register(input);
  }

  @Post("login")
  async login(@Body() body: unknown) {
    const input = loginSchema.parse(body) as LoginInput;
    return this.auth.login(input);
  }

  @Post("logout")
  @UseGuards(AuthGuard("jwt"))
  async logout(@Req() req: any) {
    await this.audit.log({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: "logout",
      entityType: "user",
      entityId: req.user.id,
    });
    return { ok: true };
  }
}
