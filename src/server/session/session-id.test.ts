import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { requireSessionId } from "./session-id";

describe("requireSessionId", () => {
  it("accepts an existing path session without a cookie", async () => {
    const sessionId = randomUUID();
    const store = { getSessionId: vi.fn().mockResolvedValue(sessionId) };
    await expect(requireSessionId(sessionId, store)).resolves.toBe(sessionId);
  });

  it("rejects a missing session", async () => {
    const store = { getSessionId: vi.fn().mockResolvedValue(null) };
    await expect(requireSessionId(randomUUID(), store)).rejects.toMatchObject({
      code: "session_not_found",
    });
  });
});
