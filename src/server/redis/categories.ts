import type { Redis } from "@upstash/redis";
import type { CategoriesResponse, CategoryDto } from "@/contracts/session-api";
import { getServerConfig } from "@/server/config";
import {
  createCategoryRecord,
  toCategoriesResponse,
  type StoredCategory,
} from "@/server/domain/category-rules";
import { applicationErrors } from "@/server/domain/errors";
import { createId } from "@/server/ids";
import { storedCategorySchema } from "@/server/validation";
import { getRedisClient } from "./client";
import { readExpenses } from "./expenses";
import { createSessionKeys, type SessionKeys } from "./keys";
import {
  decodeRecord,
  encodeRecord,
  redisOperation,
} from "./repository-helpers";

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

export async function getCategories(
  sessionId: string,
): Promise<CategoriesResponse> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () => {
    const [categories, expenses] = await Promise.all([
      readCategories(redis, keys),
      readExpenses(redis, keys),
    ]);
    return toCategoriesResponse(categories, expenses);
  });
}

export async function createCategory(
  sessionId: string,
  name: string,
): Promise<CategoryDto> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () => {
    const category = createCategoryRecord(
      await readCategories(redis, keys),
      name,
      createId(),
    );
    await redis
      .multi()
      .hset(keys.categories, { [category.id]: encodeRecord(category) })
      .expire(keys.categories, config.sessionTtlSeconds, "NX")
      .exec();
    return { ...category, totalMinor: 0 };
  });
}

export async function deleteCategory(
  sessionId: string,
  categoryId: string,
): Promise<void> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  await redisOperation(async () => {
    const [categories, expenses] = await Promise.all([
      readCategories(redis, keys),
      readExpenses(redis, keys),
    ]);
    if (!categories.some(({ id }) => id === categoryId)) {
      throw applicationErrors.categoryNotFound();
    }

    const transaction = redis.multi();
    for (const expense of expenses) {
      if (expense.categoryId === categoryId) {
        transaction.hset(keys.expenses, {
          [expense.id]: encodeRecord({ ...expense, categoryId: null }),
        });
      }
    }
    transaction.hdel(keys.categories, categoryId);
    await transaction.exec();
  });
}
