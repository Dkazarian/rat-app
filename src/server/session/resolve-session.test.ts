import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessions = vi.hoisted(() => ({
  saveSessionId: vi.fn(),
  getSessionId: vi.fn(),
}));
vi.mock("@/server/redis/session-repository", () => sessions);
import { resolveSession } from "./resolve-session";

describe("resolveSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessions.getSessionId.mockResolvedValue(null);
  });

  it("resumes a live cookie session", async () => {
    const sessionId = randomUUID();
    sessions.getSessionId.mockResolvedValue(sessionId);
    await expect(resolveSession(sessionId)).resolves.toEqual({
      sessionId,
      created: false,
    });
    expect(sessions.saveSessionId).not.toHaveBeenCalled();
    expect(sessions.getSessionId).toHaveBeenCalledWith(sessionId);
    expect(sessions.getSessionId).toHaveBeenCalledTimes(1);
  });

  it("creates an empty replacement for an invalid or expired cookie", async () => {
    const result = await resolveSession("invalid");
    expect(result.created).toBe(true);
    expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessions.saveSessionId).toHaveBeenCalledWith(result.sessionId);
  });
});
