import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import { describe, expect, it } from "vitest";
import type { ServerConfig } from "@/server/config";
import { CategoryManager } from "@/server/redis/category-manager";
import { ExpenseManager } from "@/server/redis/expense-manager";
import { createActiveSeedKey, createSessionKeys } from "@/server/redis/keys";
import { seedCategories, seedExpenses, seedTotalMinor } from "./fixture";
import { seedSession } from "./seed-session";

const url = process.env.KV_REST_API_URL ?? process.env.REDIS_KV_REST_API_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.REDIS_KV_REST_API_TOKEN;

describe.runIf(Boolean(url && token))("Redis session seeder", () => {
  it("replaces only the selected family and registers a matching expiring pointer", async () => {
    const sessionId = randomUUID();
    const otherSessionId = randomUUID();
    const config: ServerConfig = {
      redisUrl: url!,
      redisToken: token!,
      redisKeyPrefix: `ratapp:test:seed:${randomUUID()}`,
      sessionTtlSeconds: 300,
      maxExpensesPerSession: 100,
      useSeededSession: true,
      environment: "test",
    };
    const redis = new Redis({ url: url!, token: token! });
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    const otherKeys = createSessionKeys(config.redisKeyPrefix, otherSessionId);
    const pointer = createActiveSeedKey(config.redisKeyPrefix);
    try {
      await redis.hset(otherKeys.meta, { preserved: "true" });
      await seedSession(redis, config, sessionId);
      await seedSession(redis, config, sessionId);

      expect(await redis.get(pointer)).toBe(sessionId);
      expect(await redis.exists(otherKeys.meta)).toBe(1);
      expect(await redis.ttl(pointer)).toBeGreaterThan(0);
      expect(
        await new CategoryManager(redis, config).getCategories(sessionId),
      ).toMatchObject({
        categories: expect.arrayContaining(
          seedCategories.map((category) => ({
            ...category,
            totalMinor: expect.any(Number),
          })),
        ),
        totalMinor: seedTotalMinor,
      });
      expect(
        (await new ExpenseManager(redis, config).getExpenses(sessionId))
          .expenses,
      ).toHaveLength(seedExpenses.length);
    } finally {
      await redis.del(
        ...Object.values(keys),
        ...Object.values(otherKeys),
        pointer,
      );
    }
  }, 30_000);

  it("refuses production before touching Redis", async () => {
    const redis = new Redis({ url: url!, token: token! });
    const config: ServerConfig = {
      redisUrl: url!,
      redisToken: token!,
      redisKeyPrefix: `ratapp:test:seed:${randomUUID()}`,
      sessionTtlSeconds: 300,
      maxExpensesPerSession: 100,
      useSeededSession: false,
      environment: "production",
    };
    await expect(seedSession(redis, config, randomUUID())).rejects.toThrow(
      "forbidden in production",
    );
  });
});
