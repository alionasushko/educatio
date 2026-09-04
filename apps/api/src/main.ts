import "./instrument";
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
import { TRUSTED_PROXIES } from "./config/env.schema";
import { MULTIPART_LIMITS, applyRouteBodyLimits } from "./config/server";

const parseTrustProxy = (raw: string | undefined): boolean | string => {
  const v = raw?.trim();
  if (!v) return TRUSTED_PROXIES;
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
};

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    }),
    { bufferLogs: true },
  );

  applyRouteBodyLimits(app.getHttpAdapter().getInstance());

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const port = config.get("PORT", { infer: true });
  const webOrigin = config.get("WEB_ORIGIN", { infer: true });

  await app.register(fastifyHelmet);

  await app.register(fastifyCors, {
    origin: webOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(fastifyMultipart, { limits: MULTIPART_LIMITS });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");
  Logger.log(
    `api listening on http://0.0.0.0:${port} (CORS origin: ${webOrigin})`,
    "Bootstrap",
  );
};

void bootstrap();
