import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { type Connection, type Model } from "mongoose";
import { MongoThrottlerStorage } from "../src/common/mongo-throttler.storage";
import {
  ThrottleHitSchema,
  type ThrottleHitDocument,
} from "../src/schemas/throttle-hit.schema";

let mongo: MongoMemoryServer;
let connection: Connection;
let storage: MongoThrottlerStorage;
let model: Model<ThrottleHitDocument>;

const TTL = 60_000;
const LIMIT = 5;

const hit = (key: string) => storage.increment(key, TTL, LIMIT, TTL, "default");

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  connection = await mongoose
    .createConnection(mongo.getUri("throttle"))
    .asPromise();
  model = connection.model(
    "ThrottleHit",
    ThrottleHitSchema,
  ) as unknown as Model<ThrottleHitDocument>;
  storage = new MongoThrottlerStorage(model);
});

afterAll(async () => {
  await connection.close();
  await mongo.stop();
});

describe("counting requests", () => {
  it("counts up and reports when the window ends", async () => {
    const first = await hit("counts");
    expect(first.totalHits).toBe(1);
    expect(first.isBlocked).toBe(false);
    // Seconds, not the milliseconds it was given — the guard builds Retry-After from it.
    expect(first.timeToExpire).toBeGreaterThan(0);
    expect(first.timeToExpire).toBeLessThanOrEqual(TTL / 1000);

    const second = await hit("counts");
    expect(second.totalHits).toBe(2);
  });

  it("blocks once the limit is passed, and stops counting while blocked", async () => {
    for (let i = 0; i < LIMIT; i += 1) {
      expect((await hit("blocks")).isBlocked).toBe(false);
    }

    const over = await hit("blocks");
    expect(over.isBlocked).toBe(true);
    expect(over.totalHits).toBe(LIMIT + 1);
    expect(over.timeToBlockExpire).toBeGreaterThan(0);

    const again = await hit("blocks");
    expect(again.totalHits).toBe(LIMIT + 1);
  });

  it("keeps separate keys and throttlers apart", async () => {
    await hit("alice");
    await hit("alice");
    expect((await hit("bob")).totalHits).toBe(1);
    expect(
      (await storage.increment("alice", TTL, LIMIT, TTL, "strict")).totalHits,
    ).toBe(1);
  });
});

describe("concurrency", () => {
  // The reason this is one findOneAndUpdate rather than a read then a write:
  // parallel requests would otherwise all read the same count and overwrite
  // each other, letting a caller past the limit.
  it("loses no hits when requests arrive together", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        storage.increment("parallel", TTL, 1000, TTL, "default"),
      ),
    );

    expect(Math.max(...results.map((r) => r.totalHits))).toBe(20);
    expect(new Set(results.map((r) => r.totalHits)).size).toBe(20);
  });
});

describe("durability", () => {
  it("survives the process that counted them", async () => {
    await hit("persisted");
    await hit("persisted");

    const fresh = new MongoThrottlerStorage(model);
    expect(
      (await fresh.increment("persisted", TTL, LIMIT, TTL, "default"))
        .totalHits,
    ).toBe(3);
  });
});
