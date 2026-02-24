import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const ROLES_KEY = "roles";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) ?? [];
    if (required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    return user && required.includes(user.role);
  }
}
