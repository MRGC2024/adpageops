import { Worker } from "bullmq";
import { inventoryProcessor } from "./processors/inventory.processor";
import { insightsProcessor } from "./processors/insights.processor";
import { alertsProcessor } from "./processors/alerts.processor";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const run = async () => {
  const inventoryWorker = new Worker("inventory", inventoryProcessor, { connection, concurrency: 2 });
  const insightsWorker = new Worker("insights", insightsProcessor, { connection, concurrency: 2 });
  const alertsWorker = new Worker("alerts", alertsProcessor, { connection, concurrency: 1 });

  inventoryWorker.on("completed", (job) => {
    console.log(JSON.stringify({ level: "info", queue: "inventory", jobId: job.id, correlationId: job.data?.correlationId }));
  });
  inventoryWorker.on("failed", (job, err) => {
    console.error(JSON.stringify({ level: "error", queue: "inventory", jobId: job?.id, error: err?.message, correlationId: job?.data?.correlationId }));
  });
  insightsWorker.on("completed", (job) => {
    console.log(JSON.stringify({ level: "info", queue: "insights", jobId: job.id, correlationId: job.data?.correlationId }));
  });
  insightsWorker.on("failed", (job, err) => {
    console.error(JSON.stringify({ level: "error", queue: "insights", jobId: job?.id, error: err?.message, correlationId: job?.data?.correlationId }));
  });
  alertsWorker.on("completed", (job) => {
    console.log(JSON.stringify({ level: "info", queue: "alerts", jobId: job.id, correlationId: job.data?.correlationId }));
  });
  alertsWorker.on("failed", (job, err) => {
    console.error(JSON.stringify({ level: "error", queue: "alerts", jobId: job?.id, error: err?.message, correlationId: job?.data?.correlationId }));
  });

  console.log(JSON.stringify({ level: "info", message: "Worker started", queues: ["inventory", "insights", "alerts"] }));
};

run().catch((err) => {
  console.error(JSON.stringify({ level: "error", message: err?.message, stack: err?.stack }));
  process.exit(1);
});
