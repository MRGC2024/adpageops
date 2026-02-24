import { Module } from "@nestjs/common";
import { AdminHealthController } from "./admin-health.controller";
import { AdminHealthService } from "./admin-health.service";
import { RolesGuard } from "../common/roles.guard";

@Module({
  controllers: [AdminHealthController],
  providers: [AdminHealthService, RolesGuard],
})
export class AdminModule {}
