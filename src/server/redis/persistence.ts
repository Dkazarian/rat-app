import { getServerConfig } from "@/server/config";
import { CategoryManager } from "@/server/redis/category-manager";
import { getRedisClient } from "@/server/redis/client";
import { ExpenseManager } from "@/server/redis/expense-manager";
import { UpstashSessionRepository } from "@/server/redis/session-repository";

let sessionRepository: UpstashSessionRepository | undefined;
let categoryManager: CategoryManager | undefined;
let expenseManager: ExpenseManager | undefined;

export function getSessionRepository(): UpstashSessionRepository {
  sessionRepository ??= new UpstashSessionRepository(
    getRedisClient(),
    getServerConfig(),
  );
  return sessionRepository;
}

export function getCategoryManager(): CategoryManager {
  categoryManager ??= new CategoryManager(getRedisClient(), getServerConfig());
  return categoryManager;
}

export function getExpenseManager(): ExpenseManager {
  expenseManager ??= new ExpenseManager(getRedisClient(), getServerConfig());
  return expenseManager;
}

export function clearPersistenceForTests(): void {
  sessionRepository = undefined;
  categoryManager = undefined;
  expenseManager = undefined;
}
