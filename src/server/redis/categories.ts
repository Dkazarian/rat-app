import type { Redis } from "@upstash/redis";
import {
  createCategoryRecord,
  type StoredCategory,
} from "@/server/domain/category-rules";
import { createId } from "@/server/ids";
import { storedCategorySchema } from "@/server/validation";
import type { SessionKeys } from "./keys";
import {
  decodeRecord,
  encodeRecord,
  sessionRedisOperation,
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

export async function listCategories(
  sessionId: string,
): Promise<StoredCategory[]> {
  return sessionRedisOperation(sessionId, ({ redis, keys }) =>
    readCategories(redis, keys),
  );
}

export async function createCategory(
  sessionId: string,
  name: string,
): Promise<StoredCategory> {
  return sessionRedisOperation(sessionId, async ({ config, redis, keys }) => {
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
    return category;
  });
}
