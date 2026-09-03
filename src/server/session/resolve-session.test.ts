import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { ServerConfig } from "@/server/config";
import { resolveSession, type SessionIdStore } from "./resolve-session";

const config: ServerConfig = {
  redisUrl: "https://example.upstash.io",
  redisToken: "secret",
  redisKeyPrefix: "ratapp:test",
  sessionTtlSeconds: 86_400,
  maxExpensesPerSession: 100,
  useSeededSession: false,
  environment: "test",
};

function repositoryStub(): SessionIdStore {
  return {
    saveSessionId: vi.fn(),
    getSessionId: vi.fn().mockResolvedValue(null),
    getActiveSeedSessionId: vi.fn().mockResolvedValue(null),
  };
}

describe("resolveSession", () => {
  it("resumes a live cookie session", async () => {
    const sessionId = randomUUID();
    const repository = repositoryStub();
    vi.mocked(repository.getSessionId).mockResolvedValue(sessionId);
    await expect(
      resolveSession(repository, config, sessionId),
    ).resolves.toEqual({
      sessionId,
      created: false,
    });
    expect(repository.saveSessionId).not.toHaveBeenCalled();
  });

  it("creates an empty replacement for an invalid or expired cookie", async () => {
    const repository = repositoryStub();
    const result = await resolveSession(repository, config, "invalid");
    expect(result.created).toBe(true);
    expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(repository.saveSessionId).toHaveBeenCalledWith(result.sessionId);
  });

  it("returns only a verified active seed in seed mode", async () => {
    const seededSessionId = randomUUID();
    const repository = repositoryStub();
    vi.mocked(repository.getActiveSeedSessionId).mockResolvedValue(
      seededSessionId,
    );
    vi.mocked(repository.getSessionId).mockResolvedValue(seededSessionId);
    await expect(
      resolveSession(
        repository,
        { ...config, useSeededSession: true },
        undefined,
      ),
    ).resolves.toEqual({ sessionId: seededSessionId, created: false });
  });

  it("fails clearly when the active seed is unavailable", async () => {
    const repository = repositoryStub();
    await expect(
      resolveSession(
        repository,
        { ...config, useSeededSession: true },
        undefined,
      ),
    ).rejects.toMatchObject({ code: "seed_session_unavailable", status: 503 });
  });
});
