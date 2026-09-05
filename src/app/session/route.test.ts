import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerConfig } from "@/server/config";
import type { SessionIdStore } from "@/server/session/resolve-session";

const mocks = vi.hoisted(() => ({
  config: {
    redisUrl: "https://example.upstash.io",
    redisToken: "secret",
    redisKeyPrefix: "ratapp:test",
    sessionTtlSeconds: 86_400,
    maxExpensesPerSession: 100,
    environment: "test",
  } satisfies ServerConfig,
  repository: {
    saveSessionId: vi.fn(),
    getSessionId: vi.fn(),
  } satisfies SessionIdStore,
}));

vi.mock("@/server/config", () => ({ getServerConfig: () => mocks.config }));
vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.repository,
}));

import { POST } from "./route";

describe("POST /session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repository.getSessionId.mockResolvedValue(null);
  });

  it("creates an empty session and sends a protected browser-session cookie", async () => {
    const response = await POST(
      new NextRequest("https://rat.test/session", {
        method: "POST",
      }),
    );
    const body = (await response.json()) as { sessionId: string };
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(mocks.repository.saveSessionId).toHaveBeenCalledWith(body.sessionId);
    expect(response.headers.get("set-cookie")).toEqual(
      expect.stringContaining(`ratapp_session=${body.sessionId}`),
    );
    expect(response.headers.get("set-cookie")).toEqual(
      expect.stringContaining("HttpOnly"),
    );
    expect(response.headers.get("set-cookie")).toEqual(
      expect.stringContaining("SameSite=lax"),
    );
    expect(response.headers.get("set-cookie")).not.toContain("Max-Age");
  });

  it("resumes a live cookie session with 200", async () => {
    const sessionId = randomUUID();
    mocks.repository.getSessionId.mockResolvedValue(sessionId);
    const response = await POST(
      new NextRequest("https://rat.test/session", {
        method: "POST",
        headers: {
          origin: "https://rat.test",
          cookie: `ratapp_session=${sessionId}`,
        },
      }),
    );
    await expect(response.json()).resolves.toEqual({ sessionId });
    expect(response.status).toBe(200);
    expect(mocks.repository.saveSessionId).not.toHaveBeenCalled();
  });
});
