import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";
import {
  ThrottleHit,
  ThrottleHitDocument,
} from "../schemas/throttle-hit.schema";

const seconds = (ms: number): number => Math.max(0, Math.ceil(ms / 1000));

@Injectable()
export class MongoThrottlerStorage implements ThrottlerStorage {
  constructor(
    @InjectModel(ThrottleHit.name)
    private readonly hits: Model<ThrottleHitDocument>,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = new Date();
    const epoch = new Date(0);

    const hit = await this.hits.findOneAndUpdate(
      { _id: `${throttlerName}:${key}` },
      [
        {
          $set: {
            blocked: { $gt: [{ $ifNull: ["$blockExpiresAt", epoch] }, now] },
            stale: { $lte: [{ $ifNull: ["$expiresAt", epoch] }, now] },
          },
        },
        {
          $set: {
            totalHits: {
              $cond: [
                "$blocked",
                { $ifNull: ["$totalHits", 0] },
                {
                  $cond: [
                    "$stale",
                    1,
                    { $add: [{ $ifNull: ["$totalHits", 0] }, 1] },
                  ],
                },
              ],
            },
            expiresAt: {
              $cond: [
                { $and: [{ $not: ["$blocked"] }, "$stale"] },
                new Date(now.getTime() + ttl),
                { $ifNull: ["$expiresAt", new Date(now.getTime() + ttl)] },
              ],
            },
          },
        },
        {
          $set: {
            blockExpiresAt: {
              $cond: [
                {
                  $and: [
                    { $not: ["$blocked"] },
                    { $gt: ["$totalHits", limit] },
                  ],
                },
                new Date(now.getTime() + blockDuration),
                "$blockExpiresAt",
              ],
            },
          },
        },
        { $unset: ["blocked", "stale"] },
      ],
      { upsert: true, returnDocument: "after", updatePipeline: true },
    );

    const blockExpiresAt = hit?.blockExpiresAt?.getTime() ?? 0;
    const isBlocked = blockExpiresAt > now.getTime();

    return {
      totalHits: hit?.totalHits ?? 1,
      timeToExpire: seconds(
        (hit?.expiresAt?.getTime() ?? now.getTime() + ttl) - now.getTime(),
      ),
      isBlocked,
      timeToBlockExpire: isBlocked
        ? seconds(blockExpiresAt - now.getTime())
        : 0,
    };
  }
}
