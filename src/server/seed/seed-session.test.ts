import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { createSessionKeys } from "@/server/redis/keys";
import { InMemoryRedis } from "@/test/in-memory-redis";
import { seedCategories, seedExpenses } from "./fixture";

const dependencies = vi.hoisted(() => ({
  config: undefined as ServerConfig | undefined,
  client: undefined as Redis | undefined,
}));

vi.mock("@/server/config", () => ({
  getServerConfig: () => dependencies.config!,
}));
vi.mock("@/server/redis/client", () => ({
  getRedisClient: () => dependencies.client!,
}));

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
  let redis: InMemoryRedis;

  beforeEach(() => {
    redis = new InMemoryRedis();
    dependencies.client = redis.asClient();
    dependencies.config = createConfig();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates missing fixture hashes with the configured TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    await redis.hset(keys.meta, { schemaVersion: "1", createdAt: "0" });
    await redis.expire(keys.meta, config.sessionTtlSeconds);

    await seedExistingSession(sessionId);

    expect(await redis.ttl(keys.meta)).toBe(300);
    expect(await redis.ttl(keys.categories)).toBe(300);
    expect(await redis.ttl(keys.expenses)).toBe(300);
  });

  it("preserves reduced TTLs while updating existing fixtures", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    await redis.hset(keys.meta, { schemaVersion: "1", createdAt: "0" });
    await redis.hset(keys.categories, { old: "category" });
    await redis.hset(keys.expenses, { old: "expense" });
    await redis.expire(keys.meta, config.sessionTtlSeconds);
    await redis.expire(keys.categories, config.sessionTtlSeconds);
    await redis.expire(keys.expenses, config.sessionTtlSeconds);
    vi.advanceTimersByTime(60_000);

    await seedExistingSession(sessionId);
    await seedExistingSession(sessionId);

    expect(await redis.ttl(keys.meta)).toBe(240);
    expect(await redis.ttl(keys.categories)).toBe(240);
    expect(await redis.ttl(keys.expenses)).toBe(240);
  });

  it("upserts encoded, expiring fixtures without touching another session", async () => {
    const sessionId = randomUUID();
    const otherSessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    const otherKeys = createSessionKeys(config.redisKeyPrefix, otherSessionId);

    await redis.hset(keys.meta, { schemaVersion: "1", createdAt: "1" });
    await redis.expire(keys.meta, config.sessionTtlSeconds);
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
    await redis.hset(otherKeys.meta, { preserved: "true" });

    await seedExistingSession(sessionId);
    await seedExistingSession(sessionId);

    expect(await redis.exists(otherKeys.meta)).toBe(1);
    for (const key of Object.values(keys)) {
      expect(await redis.ttl(key)).toBeGreaterThan(0);
      expect(await redis.ttl(key)).toBeLessThanOrEqual(
        config.sessionTtlSeconds,
      );
    }
    const categories = await redis.hgetall<Record<string, string>>(
      keys.categories,
    );
    const expenses = await redis.hgetall<Record<string, string>>(keys.expenses);
    for (const fixture of seedCategories) {
      expect(JSON.parse(categories![fixture.id])).toEqual(fixture);
    }
    for (const fixture of seedExpenses) {
      expect(JSON.parse(expenses![fixture.id])).toEqual(fixture);
    }
  });

  it("refuses production before touching Redis", async () => {
    dependencies.config = createConfig("production");
    const sessionId = randomUUID();
    const keys = createSessionKeys(
      dependencies.config.redisKeyPrefix,
      sessionId,
    );

    await expect(seedExistingSession(sessionId)).rejects.toThrow(
      "forbidden in production",
    );
    expect(await redis.exists(keys.meta)).toBe(0);
  });

  it("refuses to seed a missing session", async () => {
    const sessionId = randomUUID();
    const keys = createSessionKeys(
      dependencies.config!.redisKeyPrefix,
      sessionId,
    );

    await expect(seedExistingSession(sessionId)).rejects.toThrow(
      "missing or expired session",
    );
    expect(await redis.exists(keys.categories)).toBe(0);
    expect(await redis.exists(keys.expenses)).toBe(0);
  });
});
