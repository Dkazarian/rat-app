import { Redis } from "@upstash/redis";
import { getServerConfig } from "@/server/config";

let redis: Redis | undefined;

export function getRedisClient(): Redis {
  if (!redis) {
    const config = getServerConfig();
    redis = new Redis({ url: config.redisUrl, token: config.redisToken });
  }
  return redis;
}
