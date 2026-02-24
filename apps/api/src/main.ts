import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { correlationIdMiddleware } from "./common/correlation-id.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(correlationIdMiddleware());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true })
  );
  app.enableCors({
    origin: process.env.APP_BASE_URL || process.env.WEB_ORIGIN || "http://localhost:3000",
    credentials: true,
  });
  const port = process.env.PORT || 4000;
  await app.listen(port);
  // Structured log - never log tokens
  console.log(
    JSON.stringify({
      level: "info",
      message: "API started",
      port,
      correlationId: "bootstrap",
    })
  );
}
bootstrap().catch((err) => {
  console.error(JSON.stringify({ level: "error", message: err?.message, stack: err?.stack }));
  process.exit(1);
});
