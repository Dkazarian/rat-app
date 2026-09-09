import { getServerConfig } from "@/server/config";
import { getRedisClient } from "@/server/redis/client";
import { createSessionKeys } from "@/server/redis/keys";
import { encodeRecord } from "@/server/redis/repository-helpers";
import { seedCategories, seedExpenses } from "./fixture";

export async function seedExistingSession(sessionId: string): Promise<string> {
  const config = getServerConfig();
  if (config.environment === "production") {
    throw new Error("Redis seeding is forbidden in production.");
  }
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  if ((await redis.exists(keys.meta)) !== 1) {
    throw new Error("Cannot seed a missing or expired session.");
  }
  await redis
    .multi()
    .hset(
      keys.categories,
      Object.fromEntries(
        seedCategories.map((category) => [category.id, encodeRecord(category)]),
      ),
    )
    .hset(
      keys.expenses,
      Object.fromEntries(
        seedExpenses.map((expense) => [expense.id, encodeRecord(expense)]),
      ),
    )
    .expire(keys.categories, config.sessionTtlSeconds, "NX")
    .expire(keys.expenses, config.sessionTtlSeconds, "NX")
    .exec();
  return sessionId;
}
