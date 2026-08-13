import { Test } from "@nestjs/testing";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { JwtService } from "@nestjs/jwt";
import { getConnectionToken, getModelToken } from "@nestjs/mongoose";
import type { Connection, Model } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";
import { User } from "../src/schemas/user.schema";
import type { UserDocument } from "../src/schemas/user.schema";

const TEST_DB = "educatio_test";

export interface Harness {
  baseUrl: string;
  tutorJwt: string;
  tutorId: string;
  /** A second, unrelated tutor — for asserting one tutor cannot reach another's rows. */
  otherTutorJwt: string;
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
  const jwt = moduleRef.get(JwtService);

  const signTutor = async (email: string, name: string): Promise<string> => {
    const user = await users.create({ email, name, emailVerified: new Date() });
    return jwt.signAsync(
      { kind: "tutor", sub: user.id, email: user.email },
      { expiresIn: "1h" },
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

  return {
    baseUrl: await app.getUrl(),
    tutorJwt,
    otherTutorJwt,
    tutorId: tutor.id,
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
};
