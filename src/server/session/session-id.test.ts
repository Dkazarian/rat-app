import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessions = vi.hoisted(() => ({ getSessionId: vi.fn() }));
vi.mock("@/server/redis/session-repository", () => sessions);
import { requireSessionId } from "./session-id";

describe("requireSessionId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts an existing cookie session", async () => {
    const sessionId = randomUUID();
    sessions.getSessionId.mockResolvedValue(sessionId);
    await expect(requireSessionId(sessionId)).resolves.toBe(sessionId);
  });

  it("rejects a missing session", async () => {
    sessions.getSessionId.mockResolvedValue(null);
    await expect(requireSessionId(randomUUID())).rejects.toMatchObject({
      code: "session_not_found",
    });
  });
});
