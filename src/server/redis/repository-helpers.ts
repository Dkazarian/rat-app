import type { Redis } from "@upstash/redis";
import { getServerConfig, type ServerConfig } from "@/server/config";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";
import { getRedisClient } from "./client";
import { createSessionKeys, type SessionKeys } from "./keys";

type SessionRedisContext = Readonly<{
  config: ServerConfig;
  redis: Redis;
  keys: SessionKeys;
}>;

export const encodeRecord = (value: unknown): string => JSON.stringify(value);

export const decodeRecord = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export async function redisOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    if (error instanceof RepositoryUnavailableError) throw error;
    throw new RepositoryUnavailableError({ cause: error });
  }
}

export function sessionRedisOperation<T>(
  sessionId: string,
  operation: (context: SessionRedisContext) => Promise<T>,
): Promise<T> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const keys = createSessionKeys(config.redisKeyPrefix, sessionId);
  return redisOperation(() => operation({ config, redis, keys }));
}
