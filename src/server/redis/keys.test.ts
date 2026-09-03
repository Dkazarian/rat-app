import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createActiveSeedKey, createSessionKeys } from "./keys";

describe("Redis keys", () => {
  it("uses one validated cluster hash tag for the session family", () => {
    const sessionId = randomUUID();
    const keys = createSessionKeys("ratapp:test:run", sessionId);
    expect(Object.values(keys)).toEqual([
      `ratapp:test:run:session:v1:{${sessionId}}:meta`,
      `ratapp:test:run:session:v1:{${sessionId}}:categories`,
      `ratapp:test:run:session:v1:{${sessionId}}:expenses`,
    ]);
    expect(createActiveSeedKey("ratapp:test:run")).toBe(
      "ratapp:test:run:seed:v1:active-session",
    );
  });

  it("rejects malformed IDs before constructing a key", () => {
    expect(() =>
      createSessionKeys("ratapp:test", "../other-session"),
    ).toThrow();
  });
});
