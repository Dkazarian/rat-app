import { randomUUID } from "node:crypto";
import { Redis } from "@upstash/redis";
import { describe, expect, it } from "vitest";
import type { ServerConfig } from "@/server/config";
import { CategoryManager } from "./category-manager";
import { ExpenseManager } from "./expense-manager";
import { createSessionKeys } from "./keys";
import { UpstashSessionRepository } from "./session-repository";

const hasRedisConfiguration = Boolean(
  (process.env.KV_REST_API_URL ?? process.env.REDIS_KV_REST_API_URL) &&
  (process.env.KV_REST_API_TOKEN ?? process.env.REDIS_KV_REST_API_TOKEN),
);

describe.runIf(hasRedisConfiguration)("Upstash persistence integration", () => {
  it("round-trips split resources and keeps cascades and TTLs consistent", async () => {
    const sessionId = randomUUID();
    const config: ServerConfig = {
      redisUrl: (process.env.KV_REST_API_URL ??
        process.env.REDIS_KV_REST_API_URL)!,
      redisToken: (process.env.KV_REST_API_TOKEN ??
        process.env.REDIS_KV_REST_API_TOKEN)!,
      redisKeyPrefix: `ratapp:test:${randomUUID()}`,
      sessionTtlSeconds: 300,
      maxExpensesPerSession: 100,
      useSeededSession: false,
      environment: "test",
    };
    const redis = new Redis({
      url: config.redisUrl,
      token: config.redisToken,
    });
    const sessions = new UpstashSessionRepository(redis, config);
    const categories = new CategoryManager(redis, config);
    const expenses = new ExpenseManager(redis, config);
    const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
    const isolatedConfig = {
      ...config,
      redisKeyPrefix: `${config.redisKeyPrefix}:isolated`,
    };
    const isolatedSessions = new UpstashSessionRepository(
      redis,
      isolatedConfig,
    );
    const isolatedCategories = new CategoryManager(redis, isolatedConfig);
    const isolatedKeys = createSessionKeys(
      isolatedConfig.redisKeyPrefix,
      sessionId,
    );

    try {
      await sessions.saveSessionId(sessionId, 1_000);
      expect(await sessions.getSessionId(sessionId)).toBe(sessionId);
      expect(await categories.getCategories(sessionId)).toEqual({
        categories: [],
        unclassifiedTotalMinor: 0,
        totalMinor: 0,
      });
      expect(await expenses.getExpenses(sessionId)).toEqual({
        expenses: [],
      });

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

      const moved = await expenses.updateExpenseCategory(
        sessionId,
        unclassified.id,
        food.id,
      );
      expect(moved).toEqual({ ...unclassified, categoryId: food.id });
      expect((await categories.getCategories(sessionId)).totalMinor).toBe(425);

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

      await expenses.deleteExpense(sessionId, categorized.id);
      expect((await categories.getCategories(sessionId)).totalMinor).toBe(300);

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
    } finally {
      await redis.del(...Object.values(keys));
      await redis.del(...Object.values(isolatedKeys));
    }
  }, 30_000);
});
