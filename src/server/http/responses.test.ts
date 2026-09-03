import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorResponse, readBoundedJson } from "./responses";

describe("HTTP response helpers", () => {
  it("parses a bounded JSON body through its request schema", async () => {
    const request = new Request("https://rat.test/session/id/categories", {
      method: "POST",
      body: JSON.stringify({ name: "Food" }),
    });
    await expect(
      readBoundedJson(request, z.object({ name: z.string() })),
    ).resolves.toEqual({ name: "Food" });
  });

  it("rejects an oversized body without exposing its content", async () => {
    const request = new Request("https://rat.test/session/id/categories", {
      method: "POST",
      body: JSON.stringify({ name: "long value" }),
    });
    await expect(
      readBoundedJson(request, z.object({ name: z.string() }), 4),
    ).rejects.toBeInstanceOf(SyntaxError);
  });

  it("maps unknown server failures to one safe no-store response", async () => {
    const response = errorResponse(new Error("secret provider detail"));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "internal_error",
        message: "The request could not be completed.",
      },
    });
  });
});
