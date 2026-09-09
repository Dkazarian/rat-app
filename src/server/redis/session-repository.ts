import { sessionRedisOperation } from "./repository-helpers";

export async function getSessionId(sessionId: string): Promise<string | null> {
  return sessionRedisOperation(sessionId, async ({ redis, keys }) =>
    (await redis.exists(keys.meta)) === 1 ? sessionId : null,
  );
}

export async function saveSessionId(
  sessionId: string,
  now = Date.now(),
): Promise<void> {
  await sessionRedisOperation(sessionId, async ({ config, redis, keys }) => {
    await redis
      .multi()
      .hset(keys.meta, {
        schemaVersion: "1",
        createdAt: String(now),
      })
      .expire(keys.meta, config.sessionTtlSeconds, "NX")
      .exec();
  });
}
