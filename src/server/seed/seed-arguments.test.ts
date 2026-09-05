import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { readSeedSessionId } from "./seed-arguments";

describe("seed arguments", () => {
  it("requires an explicit canonical session ID", () => {
    const sessionId = randomUUID();

    expect(readSeedSessionId(["--session-id", sessionId])).toBe(sessionId);
    expect(() => readSeedSessionId([])).toThrow(
      "npm run seed:redis -- --session-id <uuid>",
    );
    expect(() => readSeedSessionId(["--session-id", "invalid"])).toThrow();
  });
});
