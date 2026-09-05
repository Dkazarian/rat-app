import type { Redis } from "@upstash/redis";
import type { ServerConfig } from "@/server/config";
import { repositoryOperation } from "./repository-helpers";

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

  async renewSessionTtl(sessionId: string): Promise<boolean> {
    return repositoryOperation(this.config, sessionId, async (keys) => {
      return (
        (await this.redis.expire(keys.meta, this.config.sessionTtlSeconds)) ===
        1
      );
    });
  }
}
