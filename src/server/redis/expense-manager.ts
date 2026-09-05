import type { Redis } from "@upstash/redis";
import type { ExpenseDto, ExpensesResponse } from "@/contracts/session-api";
import type { ServerConfig } from "@/server/config";
import { applicationErrors } from "@/server/domain/errors";
import {
  toExpensesResponse,
  validateExpenseCandidate,
  type ExpenseCandidate,
  type StoredExpense,
} from "@/server/domain/expense-rules";
import { createId, parseId } from "@/server/ids";
import {
  encodeRecord,
  readCategories,
  readExpenses,
  repositoryOperation,
} from "./repository-helpers";

export class ExpenseManager {
  constructor(
    private readonly redis: Redis,
    private readonly config: ServerConfig,
  ) {}

  async getExpenses(sessionId: string): Promise<ExpensesResponse> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      const [categories, expenses] = await Promise.all([
        readCategories(this.redis, keys),
        readExpenses(this.redis, keys),
      ]);
      return toExpensesResponse(
        expenses,
        new Set(categories.map(({ id }) => id)),
      );
    });
  }

  async createExpenses(
    sessionId: string,
    candidates: ReadonlyArray<ExpenseCandidate>,
    now = Date.now(),
  ): Promise<ReadonlyArray<ExpenseDto>> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      const [categories, currentExpenses] = await Promise.all([
        readCategories(this.redis, keys),
        readExpenses(this.redis, keys),
      ]);
      if (
        currentExpenses.length + candidates.length >
        this.config.maxExpensesPerSession
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

      const transaction = this.redis.multi();
      for (const expense of expenses) {
        transaction.hset(keys.expenses, {
          [expense.id]: encodeRecord(expense),
        });
      }
      transaction.expire(keys.expenses, this.config.sessionTtlSeconds);
      await transaction.exec();
      return expenses;
    });
  }

  async upsertSeedExpenses(
    sessionId: string,
    fixture: ReadonlyArray<StoredExpense>,
  ): Promise<void> {
    await repositoryOperation(this.config, sessionId, async (keys) => {
      if (fixture.length > this.config.maxExpensesPerSession) {
        throw applicationErrors.expenseLimit();
      }
      const categories = await readCategories(this.redis, keys);
      const categoryIds = new Set(categories.map(({ id }) => id));
      const validated = fixture.map((item): StoredExpense => ({
        ...validateExpenseCandidate(item, categoryIds),
        id: parseId(item.id),
        createdAt: item.createdAt,
      }));
      if (
        validated.some(
          (expense) =>
            !Number.isSafeInteger(expense.createdAt) || expense.createdAt < 0,
        )
      ) {
        throw applicationErrors.invalidRequest();
      }
      const transaction = this.redis.multi();
      if (validated.length > 0) {
        transaction.hset(
          keys.expenses,
          Object.fromEntries(
            validated.map((expense) => [expense.id, encodeRecord(expense)]),
          ),
        );
      }
      transaction.expire(keys.expenses, this.config.sessionTtlSeconds);
      await transaction.exec();
    });
  }
}
