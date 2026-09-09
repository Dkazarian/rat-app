import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { InMemoryRedis } from "@/test/in-memory-redis";
import { otherSessionId } from "@/test/session-route-helpers";

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

import { createCategory, listCategories } from "./categories";
import { deleteCategory } from "./category-deletion";
import { createExpenses, deleteExpense, listExpenses } from "./expenses";
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("assigns fixed TTLs on creation without refreshing them on activity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);

    await saveSessionId(sessionId);
    expect(await redis.ttl(keys.meta)).toBe(300);
    vi.advanceTimersByTime(60_000);
    await expect(getSessionId(sessionId)).resolves.toBe(sessionId);
    expect(await redis.ttl(keys.meta)).toBe(240);

    const food = await createCategory(sessionId, "Food");
    expect(await redis.ttl(keys.categories)).toBe(300);
    vi.advanceTimersByTime(60_000);
    await createCategory(sessionId, "Unused");
    expect(await redis.ttl(keys.categories)).toBe(240);

    await createExpenses(sessionId, [
      { description: "Lunch", amountMinor: 125, categoryId: food.id },
    ]);
    expect(await redis.ttl(keys.expenses)).toBe(300);
    vi.advanceTimersByTime(60_000);
    await createExpenses(sessionId, [
      { description: "Coffee", amountMinor: 250, categoryId: null },
    ]);
    expect(await redis.ttl(keys.expenses)).toBe(240);
  });

  it("does not refresh TTLs when deleting or reclassifying data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    await saveSessionId(sessionId);
    const food = await createCategory(sessionId, "Food");
    const expenses = await createExpenses(sessionId, [
      { description: "Lunch", amountMinor: 125, categoryId: food.id },
      { description: "Coffee", amountMinor: 250, categoryId: food.id },
    ]);

    vi.advanceTimersByTime(60_000);
    const expireSpy = vi.spyOn(redis, "expire");
    await deleteCategory(sessionId, food.id);
    expect(expireSpy).not.toHaveBeenCalled();
    expect(await redis.ttl(keys.categories)).toBe(-2);
    expect(await redis.ttl(keys.expenses)).toBe(240);

    await deleteExpense(sessionId, expenses[0].id);
    expect(await redis.ttl(keys.expenses)).toBe(240);
    expect(await redis.ttl(keys.meta)).toBe(240);
  });

  it("gives a recreated hash a fresh TTL after its last field is deleted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    await saveSessionId(sessionId);

    const category = await createCategory(sessionId, "Food");
    const [originalExpense] = await createExpenses(sessionId, [
      { description: "Lunch", amountMinor: 125, categoryId: category.id },
    ]);
    vi.advanceTimersByTime(60_000);
    await deleteCategory(sessionId, category.id);
    expect(await redis.ttl(keys.categories)).toBe(-2);
    expect(await redis.ttl(keys.expenses)).toBe(240);
    await deleteExpense(sessionId, originalExpense.id);

    const recreatedCategory = await createCategory(sessionId, "Food again");
    expect(await redis.ttl(keys.categories)).toBe(300);
    const [expense] = await createExpenses(sessionId, [
      { description: "Coffee", amountMinor: 250, categoryId: null },
    ]);
    await deleteExpense(sessionId, expense.id);
    expect(await redis.ttl(keys.expenses)).toBe(-2);
    await createExpenses(sessionId, [
      {
        description: "Tea",
        amountMinor: 150,
        categoryId: recreatedCategory.id,
      },
    ]);
    expect(await redis.ttl(keys.expenses)).toBe(300);
  });

  it("expires independently created keys at their fixed deadlines", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    await saveSessionId(sessionId);
    vi.advanceTimersByTime(60_000);
    const category = await createCategory(sessionId, "Food");
    vi.advanceTimersByTime(60_000);
    await createExpenses(sessionId, [
      { description: "Lunch", amountMinor: 125, categoryId: category.id },
    ]);

    vi.advanceTimersByTime(180_000);
    expect(await redis.exists(keys.meta)).toBe(0);
    expect(await redis.exists(keys.categories)).toBe(1);
    expect(await redis.exists(keys.expenses)).toBe(1);
    vi.advanceTimersByTime(60_000);
    expect(await redis.exists(keys.categories)).toBe(0);
    expect(await redis.exists(keys.expenses)).toBe(1);
    vi.advanceTimersByTime(60_000);
    expect(await redis.exists(keys.expenses)).toBe(0);
  });

  it("round-trips split resources and keeps cascades and TTLs consistent", async () => {
    const sessionId = randomUUID();
    const config = dependencies.config!;
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);

    await saveSessionId(sessionId, 1_000);
    expect(await getSessionId(sessionId)).toBe(sessionId);
    expect(await listCategories(sessionId)).toEqual([]);
    expect(await listExpenses(sessionId)).toEqual([]);

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
    expect(await listCategories(sessionId)).toEqual(
      expect.arrayContaining([food, unused]),
    );
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
    expect(await listCategories(sessionId)).toEqual([unused]);
    expect(await listExpenses(sessionId)).toEqual(
      expect.arrayContaining([
        { ...categorized, categoryId: null },
        { ...unclassified, categoryId: null },
      ]),
    );

    await deleteExpense(sessionId, categorized.id);
    expect(await listExpenses(sessionId)).toEqual([unclassified]);
    await expect(
      deleteExpense(sessionId, categorized.id),
    ).resolves.toBeUndefined();
    expect(await listExpenses(sessionId)).toEqual([unclassified]);

    dependencies.config = {
      ...config,
      redisKeyPrefix: `${config.redisKeyPrefix}:isolated`,
    };
    await saveSessionId(sessionId);
    await createCategory(sessionId, "Only isolated");
    dependencies.config = config;
    expect(await listCategories(sessionId)).toEqual([unused]);

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
    await expect(listExpenses(sessionId)).rejects.toMatchObject({
      name: "RepositoryUnavailableError",
    });
  });

  it("does not delete expenses belonging to another session", async () => {
    const sessionId = randomUUID();
    await saveSessionId(sessionId);
    await saveSessionId(otherSessionId);
    const otherSessionExpense = (
      await createExpenses(otherSessionId, [
        { description: "Other session", amountMinor: 50, categoryId: null },
      ])
    )[0];
    await deleteExpense(sessionId, otherSessionExpense.id);
    expect(await listExpenses(otherSessionId)).toEqual([otherSessionExpense]);
  });
});
