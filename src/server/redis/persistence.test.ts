import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { InMemoryRedis } from "@/test/in-memory-redis";

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

import { createCategory, deleteCategory, getCategories } from "./categories";
import { createExpenses, getExpenses } from "./expenses";
import { createSessionKeys } from "./keys";
import { getSessionId, saveSessionId } from "./session-repository";

describe("Redis persistence", () => {
  let redis: InMemoryRedis;

  beforeEach(() => {
    redis = new InMemoryRedis();
    dependencies.client = redis.asClient();
    dependencies.config = {
      redisUrl: "https://redis.test",
      redisToken: "mock-token",
      redisKeyPrefix: `ratapp:test:${randomUUID()}`,
      sessionTtlSeconds: 300,
      maxExpensesPerSession: 100,
      environment: "test",
    };
  });

  it("round-trips split resources and keeps cascades and TTLs consistent", async () => {
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);

    await saveSessionId(sessionId, 1_000);
    expect(await getSessionId(sessionId)).toBe(sessionId);
    expect(await getCategories(sessionId)).toEqual({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    expect(await getExpenses(sessionId)).toEqual({ expenses: [] });

    const food = await createCategory(sessionId, "Food");
    const unused = await createCategory(sessionId, "Unused");
    const [categorized, unclassified] = await createExpenses(
      sessionId,
      [
        { description: "Lunch", amountMinor: 125, categoryId: food.id },
        { description: "Mystery", amountMinor: 300, categoryId: null },
      ],
      2_000,
    );
    expect(await getCategories(sessionId)).toEqual({
      categories: expect.arrayContaining([
        { ...food, totalMinor: 125 },
        unused,
      ]),
      unclassifiedTotalMinor: 300,
      totalMinor: 425,
    });
    await expect(
      createExpenses(
        sessionId,
        Array.from({ length: 99 }, (_, index) => ({
          description: `Overflow ${index}`,
          amountMinor: 1,
          categoryId: null,
        })),
      ),
    ).rejects.toMatchObject({ code: "expense_limit_reached" });

    await deleteCategory(sessionId, food.id);
    expect(await getCategories(sessionId)).toEqual({
      categories: [unused],
      unclassifiedTotalMinor: 425,
      totalMinor: 425,
    });
    expect((await getExpenses(sessionId)).expenses).toEqual(
      expect.arrayContaining([
        { ...categorized, categoryId: null },
        { ...unclassified, categoryId: null },
      ]),
    );

    dependencies.config = {
      ...config,
      redisKeyPrefix: `${config.redisKeyPrefix}:isolated`,
    };
    await saveSessionId(sessionId);
    await createCategory(sessionId, "Only isolated");
    dependencies.config = config;
    expect((await getCategories(sessionId)).categories).toEqual([unused]);

    for (const key of Object.values(keys)) {
      expect(await redis.ttl(key)).toBeGreaterThan(0);
      expect(await redis.ttl(key)).toBeLessThanOrEqual(
        config.sessionTtlSeconds,
      );
    }

    const corruptExpenseId = randomUUID();
    await redis.hset(keys.expenses, {
      [corruptExpenseId]: JSON.stringify({ id: corruptExpenseId, bad: true }),
    });
    await expect(getExpenses(sessionId)).rejects.toMatchObject({
      name: "RepositoryUnavailableError",
    });
  });
});
