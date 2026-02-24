import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class SyncService {
  constructor(
    @InjectQueue("inventory") private inventoryQueue: Queue,
    @InjectQueue("insights") private insightsQueue: Queue
  ) {}

  async runInventorySync(tenantId: string, adAccountId: string) {
    await this.inventoryQueue.add("sync", { tenantId, adAccountId }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    return { ok: true, job: "inventory" };
  }

  async runInsightsSync(tenantId: string, adAccountId: string) {
    await this.insightsQueue.add("sync", { tenantId, adAccountId }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
    return { ok: true, job: "insights" };
  }
}
