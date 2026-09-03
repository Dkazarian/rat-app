import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { isCanonicalId, parseId } from "@/server/ids";
import { createActiveSeedKey } from "./keys";
import { redisOperation, repositoryOperation } from "./repository-helpers";

export class UpstashSessionRepository {
  constructor(
    private readonly redis: Redis,
    private readonly config: ServerConfig,
  ) {}

  async getSessionId(sessionId: string): Promise<string | null> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      return (await this.redis.exists(keys.meta)) === 1 ? sessionId : null;
    });
  }

  async saveSessionId(sessionId: string, now = Date.now()): Promise<void> {
    await repositoryOperation(this.config, sessionId, async (keys) => {
      await this.redis
        .multi()
        .hset(keys.meta, {
          schemaVersion: "1",
          createdAt: String(now),
        })
        .expire(keys.meta, this.config.sessionTtlSeconds)
        .exec();
    });
  }

  async replaceSessionId(sessionId: string, now = Date.now()): Promise<void> {
    await repositoryOperation(this.config, sessionId, async (keys) => {
      await this.redis.del(keys.meta, keys.categories, keys.expenses);
      await this.redis
        .multi()
        .hset(keys.meta, {
          schemaVersion: "1",
          createdAt: String(now),
        })
        .expire(keys.meta, this.config.sessionTtlSeconds)
        .exec();
    });
  }

  async getActiveSeedSessionId(): Promise<string | null> {
    return redisOperation(async () => {
      const value = await this.redis.get<unknown>(
        createActiveSeedKey(this.config.redisKeyPrefix),
      );
      return isCanonicalId(value) ? value : null;
    });
  }

  async setActiveSeedSessionId(sessionId: string): Promise<void> {
    await redisOperation(async () => {
      await this.redis.set(
        createActiveSeedKey(this.config.redisKeyPrefix),
        parseId(sessionId),
        { ex: this.config.sessionTtlSeconds },
      );
    });
  }
}
