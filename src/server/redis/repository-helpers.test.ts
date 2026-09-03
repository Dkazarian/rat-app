import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { repositoryOperation } from "./repository-helpers";

describe("repositoryOperation", () => {
  it("provides the validated session key family to the operation", async () => {
    const sessionId = randomUUID();
    const keys = await repositoryOperation(
      { redisKeyPrefix: "ratapp:test" },
      sessionId,
      async (sessionKeys) => sessionKeys,
    );
    expect(keys).toEqual({
      meta: `ratapp:test:session:v1:{${sessionId}}:meta`,
      categories: `ratapp:test:session:v1:{${sessionId}}:categories`,
      expenses: `ratapp:test:session:v1:{${sessionId}}:expenses`,
    });
  });

  it("rejects an invalid session ID before running the operation", async () => {
    let called = false;
    await expect(
      repositoryOperation(
        { redisKeyPrefix: "ratapp:test" },
        "invalid",
        async () => {
          called = true;
        },
      ),
    ).rejects.toMatchObject({ name: "RepositoryUnavailableError" });
    expect(called).toBe(false);
  });
});
