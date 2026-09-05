import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ServerConfig } from "@/server/config";
import { CategoryManager } from "@/server/redis/category-manager";
import { ExpenseManager } from "@/server/redis/expense-manager";
import { createSessionKeys } from "@/server/redis/keys";
import { UpstashSessionRepository } from "@/server/redis/session-repository";
import { InMemoryRedis } from "@/test/in-memory-redis";
import { seedCategories, seedExpenses, seedTotalMinor } from "./fixture";
import { seedExistingSession } from "./seed-session";

const createConfig = (environment: ServerConfig["environment"] = "test") =>
  ({
    redisUrl: "https://redis.test",
    redisToken: "mock-token",
    redisKeyPrefix: `ratapp:test:seed:${randomUUID()}`,
    sessionTtlSeconds: 300,
    maxExpensesPerSession: 100,
    environment,
  }) satisfies ServerConfig;

describe("Redis session seeder", () => {
  it("upserts expiring seed records without touching another session", async () => {
    const sessionId = randomUUID();
    const otherSessionId = randomUUID();
    const config = createConfig();
    const redis = new InMemoryRedis();
    const client = redis.asClient();
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    const otherKeys = createSessionKeys(config.redisKeyPrefix, otherSessionId);

    await new UpstashSessionRepository(client, config).saveSessionId(sessionId);

    await redis.hset(keys.categories, {
      [seedCategories[0].id]: JSON.stringify({
        ...seedCategories[0],
        name: "Outdated name",
      }),
    });
    await redis.hset(keys.expenses, {
      [seedExpenses[0].id]: JSON.stringify({
        ...seedExpenses[0],
        amountMinor: 1,
      }),
    });
    await redis.expire(keys.categories, 300);
    await redis.expire(keys.expenses, 300);
    await redis.hset(otherKeys.meta, { preserved: "true" });

    await seedExistingSession(client, config, sessionId);
    await seedExistingSession(client, config, sessionId);

    expect(await redis.exists(otherKeys.meta)).toBe(1);
    for (const key of Object.values(keys)) {
      expect(await redis.ttl(key)).toBeGreaterThan(0);
      expect(await redis.ttl(key)).toBeLessThanOrEqual(
        config.sessionTtlSeconds,
      );
    }
    expect(
      await new CategoryManager(client, config).getCategories(sessionId),
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
      (await new ExpenseManager(client, config).getExpenses(sessionId))
        .expenses,
    ).toHaveLength(seedExpenses.length);
  });

  it("refuses production before touching Redis", async () => {
    const redis = new InMemoryRedis();
    const config = createConfig("production");
    const sessionId = randomUUID();
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);

    await expect(
      seedExistingSession(redis.asClient(), config, sessionId),
    ).rejects.toThrow("forbidden in production");
    expect(await redis.exists(keys.meta)).toBe(0);
  });

  it("refuses to seed a missing session", async () => {
    const redis = new InMemoryRedis();
    const config = createConfig();
    const sessionId = randomUUID();
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);

    await expect(
      seedExistingSession(redis.asClient(), config, sessionId),
    ).rejects.toThrow("missing or expired session");
    expect(await redis.exists(keys.categories)).toBe(0);
    expect(await redis.exists(keys.expenses)).toBe(0);
  });
});
