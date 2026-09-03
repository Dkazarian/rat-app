import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";
import type { StoredCategory } from "@/server/domain/category-rules";
import type { StoredExpense } from "@/server/domain/expense-rules";
import { storedCategorySchema, storedExpenseSchema } from "@/server/validation";
import type { SessionKeys } from "./keys";
import { createSessionKeys } from "./keys";

export const encodeRecord = (value: unknown): string => JSON.stringify(value);

const decodeRecord = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export async function readCategories(
  redis: Redis,
  keys: SessionKeys,
): Promise<StoredCategory[]> {
  const fields = await redis.hgetall<Record<string, unknown>>(keys.categories);
  return Object.entries(fields ?? {}).map(([id, value]) => {
    const category = storedCategorySchema.parse(decodeRecord(value));
    if (id !== category.id) throw new Error("Invalid stored category");
    return category;
  });
}

export async function readExpenses(
  redis: Redis,
  keys: SessionKeys,
): Promise<StoredExpense[]> {
  const fields = await redis.hgetall<Record<string, unknown>>(keys.expenses);
  return Object.entries(fields ?? {}).map(([id, value]) => {
    const expense = storedExpenseSchema.parse(decodeRecord(value));
    if (id !== expense.id) throw new Error("Invalid stored expense");
    return expense;
  });
}

export async function redisOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    if (error instanceof RepositoryUnavailableError) throw error;
    throw new RepositoryUnavailableError({ cause: error });
  }
}

export function repositoryOperation<T>(
  config: Pick<ServerConfig, "redisKeyPrefix">,
  sessionId: string,
  operation: (keys: SessionKeys) => Promise<T>,
): Promise<T> {
  return redisOperation(() =>
    operation(createSessionKeys(config.redisKeyPrefix, sessionId)),
  );
}
