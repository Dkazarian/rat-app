import { describe, expect, it } from "vitest";
import { z } from "zod";
import { applicationErrors } from "@/server/domain/errors";
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

  it("adds Retry-After only to rate-limit responses", async () => {
    const limited = errorResponse(applicationErrors.rateLimited(42));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("42");
    expect(limited.headers.get("Cache-Control")).toBe("no-store");
    await expect(limited.json()).resolves.toEqual({
      error: { code: "rate_limited", message: "Too many requests." },
    });

    const unavailable = errorResponse(applicationErrors.serviceUnavailable());
    expect(unavailable.headers.get("Retry-After")).toBeNull();
  });
});
