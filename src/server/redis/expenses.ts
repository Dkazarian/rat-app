import type { Redis } from "@upstash/redis";
import type { ExpenseDto, ExpensesResponse } from "@/contracts/session-api";
import { getServerConfig } from "@/server/config";
import { applicationErrors } from "@/server/domain/errors";
import {
  toExpensesResponse,
  validateExpenseCandidate,
  type ExpenseCandidate,
  type StoredExpense,
} from "@/server/domain/expense-rules";
import { createId } from "@/server/ids";
import { storedExpenseSchema } from "@/server/validation";
import { readCategories } from "./categories";
import { getRedisClient } from "./client";
import { createSessionKeys, type SessionKeys } from "./keys";
import {
  decodeRecord,
  encodeRecord,
  redisOperation,
} from "./repository-helpers";

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

export async function getExpenses(
  sessionId: string,
): Promise<ExpensesResponse> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () => {
    const [categories, expenses] = await Promise.all([
      readCategories(redis, keys),
      readExpenses(redis, keys),
    ]);
    return toExpensesResponse(
      expenses,
      new Set(categories.map(({ id }) => id)),
    );
  });
}

export async function createExpenses(
  sessionId: string,
  candidates: ReadonlyArray<ExpenseCandidate>,
  now = Date.now(),
): Promise<ReadonlyArray<ExpenseDto>> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () => {
    if ((await redis.exists(keys.meta)) !== 1) {
      throw applicationErrors.sessionNotFound();
    }
    const [categories, currentExpenses] = await Promise.all([
      readCategories(redis, keys),
      readExpenses(redis, keys),
    ]);
    if (
      currentExpenses.length + candidates.length >
      config.maxExpensesPerSession
    ) {
      throw applicationErrors.expenseLimit();
    }

    const categoryIds = new Set(categories.map(({ id }) => id));
    const expenses = candidates.map((candidate): StoredExpense => ({
      ...validateExpenseCandidate(candidate, categoryIds),
      id: createId(),
      createdAt: now,
    }));
    if (expenses.length === 0) return [];

    const transaction = redis.multi();
    for (const expense of expenses) {
      transaction.hset(keys.expenses, {
        [expense.id]: encodeRecord(expense),
      });
    }
    transaction.expire(keys.expenses, config.sessionTtlSeconds);
    await transaction.exec();
    return expenses;
  });
}

export async function deleteExpense(
  sessionId: string,
  expenseId: string,
): Promise<void> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  await redisOperation(async () => {
    await redis.hdel(keys.expenses, expenseId);
  });
}
