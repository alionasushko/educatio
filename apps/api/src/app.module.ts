import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateEnv, type Env } from "./config/env";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { LessonsModule } from "./lessons/lessons.module";
import { SessionsModule } from "./sessions/sessions.module";
import { LiveblocksModule } from "./liveblocks/liveblocks.module";
import { SnapshotsModule } from "./snapshots/snapshots.module";
import { UploadModule } from "./upload/upload.module";
import { SummaryModule } from "./summary/summary.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw) => validateEnv(raw),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get("MONGODB_URI", { infer: true }),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CommonModule,
    AuthModule,
    LessonsModule,
    SessionsModule,
    LiveblocksModule,
    SnapshotsModule,
    UploadModule,
    SummaryModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
