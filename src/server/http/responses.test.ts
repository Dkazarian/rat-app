import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorResponse } from "./responses";

describe("errorResponse", () => {
  it("maps malformed JSON and schema failures to invalid_request", async () => {
    for (const error of [new SyntaxError("bad JSON"), new z.ZodError([])]) {
      const response = errorResponse(error);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "invalid_request" },
      });
    }
  });
});
