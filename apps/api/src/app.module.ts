import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "./auth/auth.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { AdAccountsModule } from "./ad-accounts/ad-accounts.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { PagesModule } from "./pages/pages.module";
import { AdsModule } from "./ads/ads.module";
import { AlertsModule } from "./alerts/alerts.module";
import { SyncModule } from "./sync/sync.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuditModule } from "./audit/audit.module";
import { MeModule } from "./me/me.module";
import { TenantsModule } from "./tenants/tenants.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379", 10),
            password: process.env.REDIS_PASSWORD || undefined,
          },
    }),
    PrismaModule,
    AuthModule,
    IntegrationsModule,
    AdAccountsModule,
    DashboardModule,
    PagesModule,
    AdsModule,
    AlertsModule,
    SyncModule,
    HealthModule,
    AuditModule,
    MeModule,
    TenantsModule,
    AdminModule,
  ],
})
export class AppModule {}
