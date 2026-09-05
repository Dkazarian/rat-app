import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ServerConfig } from "@/server/config";
import { InMemoryRedis } from "@/test/in-memory-redis";
import { CategoryManager } from "./category-manager";
import { ExpenseManager } from "./expense-manager";
import { createSessionKeys } from "./keys";
import { UpstashSessionRepository } from "./session-repository";

describe("Redis persistence", () => {
  it("round-trips split resources and keeps cascades and TTLs consistent", async () => {
    const sessionId = randomUUID();
    const config: ServerConfig = {
      redisUrl: "https://redis.test",
      redisToken: "mock-token",
      redisKeyPrefix: `ratapp:test:${randomUUID()}`,
      sessionTtlSeconds: 300,
      maxExpensesPerSession: 100,
      environment: "test",
    };
    const redis = new InMemoryRedis();
    const client = redis.asClient();
    const sessions = new UpstashSessionRepository(client, config);
    const categories = new CategoryManager(client, config);
    const expenses = new ExpenseManager(client, config);
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    const isolatedConfig = {
      ...config,
      redisKeyPrefix: `${config.redisKeyPrefix}:isolated`,
    };
    const isolatedSessions = new UpstashSessionRepository(
      client,
      isolatedConfig,
    );
    const isolatedCategories = new CategoryManager(client, isolatedConfig);

    await sessions.saveSessionId(sessionId, 1_000);
    expect(await sessions.getSessionId(sessionId)).toBe(sessionId);
    expect(await categories.getCategories(sessionId)).toEqual({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    expect(await expenses.getExpenses(sessionId)).toEqual({ expenses: [] });

    const food = await categories.createCategory(sessionId, "Food");
    const unused = await categories.createCategory(sessionId, "Unused");
    const [categorized, unclassified] = await expenses.createExpenses(
      sessionId,
      [
        { description: "Lunch", amountMinor: 125, categoryId: food.id },
        { description: "Mystery", amountMinor: 300, categoryId: null },
      ],
      2_000,
    );
    expect(await categories.getCategories(sessionId)).toEqual({
      categories: expect.arrayContaining([
        { ...food, totalMinor: 125 },
        unused,
      ]),
      unclassifiedTotalMinor: 300,
      totalMinor: 425,
    });
    await expect(
      expenses.createExpenses(
        sessionId,
        Array.from({ length: 99 }, (_, index) => ({
          description: `Overflow ${index}`,
          amountMinor: 1,
          categoryId: null,
        })),
      ),
    ).rejects.toMatchObject({ code: "expense_limit_reached" });

    await categories.deleteCategory(sessionId, food.id);
    expect(await categories.getCategories(sessionId)).toEqual({
      categories: [unused],
      unclassifiedTotalMinor: 425,
      totalMinor: 425,
    });
    expect((await expenses.getExpenses(sessionId)).expenses).toEqual(
      expect.arrayContaining([
        { ...categorized, categoryId: null },
        { ...unclassified, categoryId: null },
      ]),
    );

    await isolatedSessions.saveSessionId(sessionId);
    await isolatedCategories.createCategory(sessionId, "Only isolated");
    expect((await categories.getCategories(sessionId)).categories).toEqual([
      unused,
    ]);

    for (const key of Object.values(keys)) {
      expect(await redis.ttl(key)).toBeGreaterThan(0);
      expect(await redis.ttl(key)).toBeLessThanOrEqual(
        config.sessionTtlSeconds,
      );
    }

    const corruptExpenseId = randomUUID();
    await redis.hset(keys.expenses, {
      [corruptExpenseId]: JSON.stringify({
        id: corruptExpenseId,
        bad: true,
      }),
    });
    await expect(expenses.getExpenses(sessionId)).rejects.toMatchObject({
      name: "RepositoryUnavailableError",
    });
  });
});
