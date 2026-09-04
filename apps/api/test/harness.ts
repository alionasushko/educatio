import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import type { Connection, Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import fastifyMultipart from "@fastify/multipart";
import { MULTIPART_LIMITS, applyRouteBodyLimits } from "../src/config/server";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { AuthService } from "../src/auth/auth.service";
import { User } from "../src/schemas/user.schema";
import type { UserDocument } from "../src/schemas/user.schema";

const TEST_DB = "educatio_test";

export interface Harness {
  baseUrl: string;
  tutorJwt: string;
  tutorId: string;
  otherTutorJwt: string;
  newTutorJwt: () => Promise<string>;
  countSnapshots: (lessonId: string) => Promise<number>;
  staleFor: (token: string) => Promise<string>;
  breakEmail: () => () => void;
  auth: AuthService;
  users: Model<UserDocument>;
  magicLinkCount: (email: string) => Promise<number>;
  close: () => Promise<void>;
}

export const startApi = async (): Promise<Harness> => {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri(TEST_DB);

  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = uri;
  process.env.AUTH_JWT_SECRET = "test-secret-that-is-long-enough-to-pass-32";
  process.env.WEB_ORIGIN = "http://localhost:3000";

  const { AppModule } = await import("../src/app.module.js");
  const { validateEnv } = await import("../src/config/env.js");

  if (validateEnv(process.env).MONGODB_URI !== uri) {
    await mongo.stop();
    throw new Error(
      "refusing to run: MONGODB_URI resolved to something other than the ephemeral server",
    );
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  applyRouteBodyLimits(app.getHttpAdapter().getInstance());
  await app.register(fastifyMultipart, { limits: MULTIPART_LIMITS });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  await app.listen(0, "127.0.0.1");

  const expected = new URL(uri);
  const connection = moduleRef.get<Connection>(getConnectionToken());
  if (
    connection.name !== TEST_DB ||
    connection.host !== expected.hostname ||
    connection.port !== Number(expected.port)
  ) {
    await app.close();
    await mongo.stop();
    throw new Error(
      `refusing to run: connected to ${connection.host}:${connection.port}/${connection.name}, expected ${expected.hostname}:${expected.port}/${TEST_DB}`,
    );
  }

  const users = moduleRef.get<Model<UserDocument>>(getModelToken(User.name));

  const breakEmail = (): (() => void) => {
    const seam = moduleRef.get(AuthService) as unknown as {
      sendMagicLink: (...args: unknown[]) => Promise<void>;
    };
    const original = seam.sendMagicLink;
    seam.sendMagicLink = () => Promise.reject(new Error("email delivery down"));
    return () => {
      seam.sendMagicLink = original;
    };
  };
  const jwt = moduleRef.get(JwtService);

  const signTutor = async (email: string, name: string): Promise<string> => {
    const user = await users.create({ email, name, emailVerified: new Date() });
    return jwt.signAsync(
      { kind: "tutor", sub: user.id, email: user.email },
      { expiresIn: "1h" },
    );
  };

  const staleFor = async (token: string): Promise<string> => {
    const claims = jwt.decode<{ sub: string; email: string }>(token);
    const user = await users.findById(claims.sub).select("tokenVersion").lean();
    return jwt.signAsync(
      {
        kind: "tutor",
        sub: claims.sub,
        email: claims.email,
        tokenVersion:
          (user as { tokenVersion?: number } | null)?.tokenVersion ?? 0,
        iat: Math.floor((Date.now() - 60 * 60_000) / 1000),
      },
      { expiresIn: "2h" },
    );
  };

  const tutor = await users.create({
    email: "tutor@example.com",
    name: "Test Tutor",
    emailVerified: new Date(),
  });

  const tutorJwt = await jwt.signAsync(
    { kind: "tutor", sub: tutor.id, email: tutor.email },
    { expiresIn: "1h" },
  );
  const otherTutorJwt = await signTutor("other@example.com", "Other Tutor");

  let spare = 0;

  return {
    baseUrl: await app.getUrl(),
    tutorJwt,
    otherTutorJwt,
    newTutorJwt: () => {
      spare += 1;
      return signTutor(`spare-${spare}@example.com`, `Spare Tutor ${spare}`);
    },
    tutorId: tutor.id,
    staleFor,
    breakEmail,
    auth: moduleRef.get(AuthService),
    users,
    magicLinkCount: async (email: string) => {
      const owner = await users.findOne({ email });
      if (!owner) return 0;
      return connection
        .collection("magic_links")
        .countDocuments({ userId: owner._id });
    },
    countSnapshots: (lessonId: string) =>
      connection
        .collection("lesson_snapshots")
        .countDocuments({ lessonId: new Types.ObjectId(lessonId) }),
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
};
