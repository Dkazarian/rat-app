import { applicationErrors } from "@/server/domain/errors";
import { logger } from "@/server/logger";
import { getServerConfig } from "@/server/config";
import { getRedisClient } from "./client";
import { createAiRateLimitKeys, createSessionKeys } from "./keys";
import { redisOperation } from "./repository-helpers";

const AI_RATE_LIMITS = {
  sessionBurst: 5,
  sessionLifetime: 50,
  globalBurst: 60,
  burstWindowMilliseconds: 60_000,
} as const;

const AI_RATE_LIMIT_SCRIPT = `
local sessionExists = redis.call("EXISTS", KEYS[1])
if sessionExists ~= 1 then
  return {-1, 0, 0}
end

local sessionBurst = tonumber(redis.call("GET", KEYS[2]) or "0")
local sessionLifetime = tonumber(redis.call("HGET", KEYS[1], "aiRequestCount") or "0")
local globalBurst = tonumber(redis.call("GET", KEYS[3]) or "0")

local retryMilliseconds = 0
local scope = 0

if sessionBurst >= tonumber(ARGV[1]) then
  retryMilliseconds = math.max(redis.call("PTTL", KEYS[2]), 1)
  scope = 1
end

if sessionLifetime >= tonumber(ARGV[2]) then
  local lifetimeRetry = math.max(redis.call("PTTL", KEYS[1]), 1)
  if lifetimeRetry > retryMilliseconds then
    retryMilliseconds = lifetimeRetry
    scope = 2
  end
end

if globalBurst >= tonumber(ARGV[3]) then
  local globalRetry = math.max(redis.call("PTTL", KEYS[3]), 1)
  if globalRetry > retryMilliseconds then
    retryMilliseconds = globalRetry
    scope = 3
  end
end

if retryMilliseconds > 0 then
  return {0, retryMilliseconds, scope}
end

local nextSessionBurst = redis.call("INCR", KEYS[2])
if nextSessionBurst == 1 then
  redis.call("PEXPIRE", KEYS[2], ARGV[4])
end

redis.call("HINCRBY", KEYS[1], "aiRequestCount", 1)

local nextGlobalBurst = redis.call("INCR", KEYS[3])
if nextGlobalBurst == 1 then
  redis.call("PEXPIRE", KEYS[3], ARGV[4])
end

return {1, 0, 0}
`;

const limitScopes = {
  1: "session_burst",
  2: "session_lifetime",
  3: "global_burst",
} as const;

export type AiRateLimitDecision =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; retryAfterSeconds: number }>;

function parseScriptResult(value: unknown): readonly [number, number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((item) => typeof item !== "number" || !Number.isFinite(item))
  ) {
    throw new Error("Invalid AI rate-limit response.");
  }
  return value as [number, number, number];
}

export async function consumeAiRateLimit(
  sessionId: string,
): Promise<AiRateLimitDecision> {
  const config = getServerConfig();
  const redis = getRedisClient();
  const sessionKeys = createSessionKeys(config.redisKeyPrefix, sessionId);
  const limitKeys = createAiRateLimitKeys(config.redisKeyPrefix, sessionId);

  return redisOperation(async () => {
    const result = parseScriptResult(
      await redis.eval(
        AI_RATE_LIMIT_SCRIPT,
        [sessionKeys.meta, limitKeys.sessionBurst, limitKeys.globalBurst],
        [
          AI_RATE_LIMITS.sessionBurst,
          AI_RATE_LIMITS.sessionLifetime,
          AI_RATE_LIMITS.globalBurst,
          AI_RATE_LIMITS.burstWindowMilliseconds,
        ],
      ),
    );

    if (result[0] === -1) throw applicationErrors.sessionNotFound();
    if (result[0] !== 0) return { allowed: true };

    const scope = limitScopes[result[2] as keyof typeof limitScopes];
    if (!scope) throw new Error("Invalid AI rate-limit scope.");
    logger.warn("AI request rate limited.", { scope });
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(result[1] / 1000)),
    };
  });
}
