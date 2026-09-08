import type { Redis } from "@upstash/redis";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApplicationError,
  RepositoryUnavailableError,
} from "@/server/domain/errors";

type Counter = { value: number; expiresAt: number };
type Session = { aiRequestCount: number; expiresAt: number };

class FakeRateLimitRedis {
  now = 0;
  fail = false;
  readonly counters = new Map<string, Counter>();
  readonly sessions = new Map<string, Session>();

  createSession(sessionId: string, ttlMilliseconds = 600_000) {
    this.sessions.set(sessionId, {
      aiRequestCount: 0,
      expiresAt: this.now + ttlMilliseconds,
    });
  }

  renewSession(sessionId: string, ttlMilliseconds: number) {
    const session = this.sessions.get(sessionId);
    if (session) session.expiresAt = this.now + ttlMilliseconds;
  }

  advance(milliseconds: number) {
    this.now += milliseconds;
  }

  private liveCounter(key: string): Counter | undefined {
    const counter = this.counters.get(key);
    if (counter && counter.expiresAt <= this.now) {
      this.counters.delete(key);
      return undefined;
    }
    return counter;
  }

  async eval(
    _script: string,
    keys: string[],
    args: number[],
  ): Promise<[number, number, number]> {
    if (this.fail) throw new Error("Redis unavailable");
    const [metaKey, sessionBurstKey, globalBurstKey] = keys;
    const sessionId = /\{([^}]+)\}:meta$/.exec(metaKey)?.[1];
    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (!session || session.expiresAt <= this.now) return [-1, 0, 0];

    const sessionBurst = this.liveCounter(sessionBurstKey);
    const globalBurst = this.liveCounter(globalBurstKey);
    const retries: Array<[number, number]> = [];
    if ((sessionBurst?.value ?? 0) >= args[0]) {
      retries.push([sessionBurst!.expiresAt - this.now, 1]);
    }
    if (session.aiRequestCount >= args[1]) {
      retries.push([session.expiresAt - this.now, 2]);
    }
    if ((globalBurst?.value ?? 0) >= args[2]) {
      retries.push([globalBurst!.expiresAt - this.now, 3]);
    }
    if (retries.length > 0) {
      return [0, ...retries.sort((a, b) => b[0] - a[0])[0]];
    }

    const windowMilliseconds = args[3];
    this.counters.set(sessionBurstKey, {
      value: (sessionBurst?.value ?? 0) + 1,
      expiresAt: sessionBurst?.expiresAt ?? this.now + windowMilliseconds,
    });
    session.aiRequestCount += 1;
    this.counters.set(globalBurstKey, {
      value: (globalBurst?.value ?? 0) + 1,
      expiresAt: globalBurst?.expiresAt ?? this.now + windowMilliseconds,
    });
    return [1, 0, 0];
  }
}

const mocks = vi.hoisted(() => ({
  getServerConfig: vi.fn(),
  getRedisClient: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/server/config", () => ({ getServerConfig: mocks.getServerConfig }));
vi.mock("./client", () => ({ getRedisClient: mocks.getRedisClient }));
vi.mock("@/server/logger", () => ({
  logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() },
}));

import { consumeAiRateLimit } from "./ai-rate-limiter";

const prefix = "ratapp:test";
let redis: FakeRateLimitRedis;

beforeEach(() => {
  vi.clearAllMocks();
  redis = new FakeRateLimitRedis();
  mocks.getServerConfig.mockReturnValue({ redisKeyPrefix: prefix });
  mocks.getRedisClient.mockReturnValue(redis as unknown as Redis);
});

async function consumeMany(sessionId: string, count: number) {
  const results = [];
  for (let index = 0; index < count; index += 1) {
    if (index > 0 && index % 5 === 0) redis.advance(60_000);
    results.push(await consumeAiRateLimit(sessionId));
  }
  return results;
}

describe("consumeAiRateLimit", () => {
  it("enforces and resets the five-request session burst", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId);
    await expect(consumeMany(sessionId, 5)).resolves.toBeDefined();
    await expect(consumeAiRateLimit(sessionId)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(redis.sessions.get(sessionId)?.aiRequestCount).toBe(5);
    expect(redis.counters.get(`${prefix}:ratelimit:ai:global`)?.value).toBe(5);
    redis.advance(60_000);
    await expect(consumeAiRateLimit(sessionId)).resolves.toEqual({
      allowed: true,
    });
  });

  it("isolates session bursts while sharing the global counter", async () => {
    const first = randomUUID();
    const second = randomUUID();
    redis.createSession(first);
    redis.createSession(second);
    await Promise.all(
      Array.from({ length: 5 }, () => consumeAiRateLimit(first)),
    );
    await expect(consumeAiRateLimit(first)).resolves.toMatchObject({
      allowed: false,
    });
    await expect(consumeAiRateLimit(second)).resolves.toEqual({
      allowed: true,
    });
    expect(redis.sessions.get(second)?.aiRequestCount).toBe(1);
    expect(redis.counters.get(`${prefix}:ratelimit:ai:global`)?.value).toBe(6);
  });

  it("enforces the thirty-request global burst", async () => {
    for (let index = 0; index < 6; index += 1) {
      const sessionId = randomUUID();
      redis.createSession(sessionId);
      const decisions = await Promise.all(
        Array.from({ length: 5 }, () => consumeAiRateLimit(sessionId)),
      );
      expect(decisions.every(({ allowed }) => allowed)).toBe(true);
    }
    const blockedSession = randomUUID();
    redis.createSession(blockedSession);
    await expect(consumeAiRateLimit(blockedSession)).resolves.toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(redis.sessions.get(blockedSession)?.aiRequestCount).toBe(0);
  });

  it("admits at most five concurrent requests for one session", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId);
    const decisions = await Promise.all(
      Array.from({ length: 10 }, () => consumeAiRateLimit(sessionId)),
    );
    expect(decisions.filter(({ allowed }) => allowed)).toHaveLength(5);
    expect(redis.sessions.get(sessionId)?.aiRequestCount).toBe(5);
  });

  it("keeps the fifty-request count for the renewed session lifetime", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId, 3_600_000);
    for (let index = 0; index < 50; index += 1) {
      if (index > 0 && index % 5 === 0) redis.advance(60_000);
      if (index === 25) redis.renewSession(sessionId, 3_600_000);
      await expect(consumeAiRateLimit(sessionId)).resolves.toEqual({
        allowed: true,
      });
    }
    redis.advance(60_000);
    await expect(consumeAiRateLimit(sessionId)).resolves.toMatchObject({
      allowed: false,
    });
  });

  it("removes the lifetime count when the session expires", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId, 1_000);
    await consumeAiRateLimit(sessionId);
    redis.advance(1_000);
    await expect(consumeAiRateLimit(sessionId)).rejects.toMatchObject({
      code: "session_not_found",
    } satisfies Partial<ApplicationError>);
  });

  it("logs only safe scope metadata when blocked", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId);
    await Promise.all(
      Array.from({ length: 5 }, () => consumeAiRateLimit(sessionId)),
    );
    await consumeAiRateLimit(sessionId);
    expect(mocks.warn).toHaveBeenCalledWith("AI request rate limited.", {
      scope: "session_burst",
    });
    expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain(sessionId);
  });

  it("does not partially increment other counters after denial", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId);
    await consumeMany(sessionId, 5);
    const globalKey = `${prefix}:ratelimit:ai:global`;
    const before = redis.counters.get(globalKey)?.value;
    await consumeAiRateLimit(sessionId);
    expect(redis.counters.get(globalKey)?.value).toBe(before);
    expect(redis.sessions.get(sessionId)?.aiRequestCount).toBe(5);
  });

  it("maps Redis failures to repository unavailability", async () => {
    const sessionId = randomUUID();
    redis.createSession(sessionId);
    redis.fail = true;
    await expect(consumeAiRateLimit(sessionId)).rejects.toBeInstanceOf(
      RepositoryUnavailableError,
    );
  });
});
