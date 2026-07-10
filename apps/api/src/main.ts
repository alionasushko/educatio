import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import type { Env } from "./config/env";
import { MAX_UPLOAD_BYTES } from "@educatio/shared/api/upload";

const parseTrustProxy = (
  raw: string | undefined,
): boolean | number | string => {
  const v = raw?.trim() || "1";
  if (v === "true") return true;
  if (v === "false") return false;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : v;
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    }),
    { bufferLogs: true },
  );

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const port = config.get("PORT", { infer: true });
  const webOrigin = config.get("WEB_ORIGIN", { infer: true });

  await app.register(fastifyHelmet);

  await app.register(fastifyCors, {
    origin: webOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");
  Logger.log(
    `api listening on http://0.0.0.0:${port} (CORS origin: ${webOrigin})`,
    "Bootstrap",
  );
}

void bootstrap();
