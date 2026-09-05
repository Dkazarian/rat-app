import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { resolveSession, type SessionIdStore } from "./resolve-session";

function repositoryStub(): SessionIdStore {
  return {
    saveSessionId: vi.fn(),
    getSessionId: vi.fn().mockResolvedValue(null),
  };
}

describe("resolveSession", () => {
  it("resumes a live cookie session", async () => {
    const sessionId = randomUUID();
    const repository = repositoryStub();
    vi.mocked(repository.getSessionId).mockResolvedValue(sessionId);
    await expect(resolveSession(repository, sessionId)).resolves.toEqual({
      sessionId,
      created: false,
    });
    expect(repository.saveSessionId).not.toHaveBeenCalled();
  });

  it("creates an empty replacement for an invalid or expired cookie", async () => {
    const repository = repositoryStub();
    const result = await resolveSession(repository, "invalid");
    expect(result.created).toBe(true);
    expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(repository.saveSessionId).toHaveBeenCalledWith(result.sessionId);
  });
});
