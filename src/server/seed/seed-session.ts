import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { parseId } from "@/server/ids";
import { CategoryManager } from "@/server/redis/category-manager";
import { ExpenseManager } from "@/server/redis/expense-manager";
import { UpstashSessionRepository } from "@/server/redis/session-repository";
import { seedCategories, seedExpenses, seedTotalMinor } from "./fixture";

export async function seedExistingSession(
  redis: Redis,
  config: ServerConfig,
  unsafeSessionId: string,
): Promise<string> {
  if (config.environment === "production") {
    throw new Error("Redis seeding is forbidden in production.");
  }
  const sessionId = parseId(unsafeSessionId);
  const sessions = new UpstashSessionRepository(redis, config);
  const categoryManager = new CategoryManager(redis, config);
  const expenseManager = new ExpenseManager(redis, config);
  if (!(await sessions.renewSessionTtl(sessionId))) {
    throw new Error("Cannot seed a missing or expired session.");
  }
  await categoryManager.upsertSeedCategories(sessionId, seedCategories);
  await expenseManager.upsertSeedExpenses(sessionId, seedExpenses);

  const [categories, expenses] = await Promise.all([
    categoryManager.getCategories(sessionId),
    expenseManager.getExpenses(sessionId),
  ]);
  const expectedReferences = new Map<string, string | null>(
    seedExpenses.map((expense) => [expense.id, expense.categoryId]),
  );
  const verified =
    categories.categories.length === seedCategories.length &&
    expenses.expenses.length === seedExpenses.length &&
    categories.totalMinor === seedTotalMinor &&
    expenses.expenses.every(
      (expense) =>
        expectedReferences.get(expense.id) === expense.categoryId &&
        seedExpenses.some(
          (fixture) =>
            fixture.id === expense.id &&
            fixture.createdAt === expense.createdAt,
        ),
    );
  if (!verified) throw new Error("Seed verification failed.");
  return sessionId;
}
