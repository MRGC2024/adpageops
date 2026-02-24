import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";
import { RolesGuard } from "../common/roles.guard";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: "inventory" },
      { name: "insights" },
      { name: "alerts" }
    ),
  ],
  controllers: [SyncController],
  providers: [SyncService, RolesGuard],
})
export class SyncModule {}
