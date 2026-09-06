import { getServerConfig } from "@/server/config";
import { getRedisClient } from "./client";
import { createSessionKeys } from "./keys";
import { redisOperation } from "./repository-helpers";

export async function getSessionId(sessionId: string): Promise<string | null> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () =>
    (await redis.exists(keys.meta)) === 1 ? sessionId : null,
  );
}

export async function saveSessionId(
  sessionId: string,
  now = Date.now(),
): Promise<void> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  await redisOperation(async () => {
    await redis
      .multi()
      .hset(keys.meta, {
        schemaVersion: "1",
        createdAt: String(now),
      })
      .expire(keys.meta, config.sessionTtlSeconds)
      .exec();
  });
}

export async function renewSessionTtl(sessionId: string): Promise<boolean> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(async () => {
    const result = await redis
      .multi()
      .expire(keys.meta, config.sessionTtlSeconds)
      .expire(keys.categories, config.sessionTtlSeconds)
      .expire(keys.expenses, config.sessionTtlSeconds)
      .exec();
    return result[0] === 1;
  });
}
