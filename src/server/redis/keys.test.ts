import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAiRateLimitKeys, createSessionKeys } from "./keys";

describe("Redis keys", () => {
  it("uses one trusted cluster hash tag for the session family", () => {
    const sessionId = randomUUID();
    const keys = createSessionKeys("ratapp:test:run", sessionId);
    expect(Object.values(keys)).toEqual([
      `ratapp:test:run:session:v1:{${sessionId}}:meta`,
      `ratapp:test:run:session:v1:{${sessionId}}:categories`,
      `ratapp:test:run:session:v1:{${sessionId}}:expenses`,
    ]);
  });

  it("creates environment-scoped AI rate-limit keys", () => {
    const sessionId = randomUUID();
    expect(createAiRateLimitKeys("ratapp:test:run", sessionId)).toEqual({
      sessionBurst: `ratapp:test:run:ratelimit:ai:burst:{${sessionId}}`,
      globalBurst: "ratapp:test:run:ratelimit:ai:global",
    });
  });
});
