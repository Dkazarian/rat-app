import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerConfig } from "@/server/config";

const mocks = vi.hoisted(() => ({
  config: {
    redisUrl: "https://example.upstash.io",
    redisToken: "secret",
    redisKeyPrefix: "ratapp:test",
    sessionTtlSeconds: 172_800,
    maxExpensesPerSession: 100,
    environment: "test" as ServerConfig["environment"],
  } satisfies ServerConfig,
  sessions: {
    saveSessionId: vi.fn(),
    getSessionId: vi.fn(),
    renewSessionTtl: vi.fn(),
  },
}));

vi.mock("@/server/config", () => ({ getServerConfig: () => mocks.config }));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);

import { POST } from "./route";

describe("POST /api/v1/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockResolvedValue(null);
  });

  it("creates a session, returns no payload, and sets the protected cookie", async () => {
    const response = await POST(
      new NextRequest("https://rat.test/api/v1/session", { method: "POST" }),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    const savedId = mocks.sessions.saveSessionId.mock.calls[0][0];
    expect(savedId).toMatch(/^[0-9a-f-]{36}$/);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain(`ratapp_session=${savedId}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=172800");
    expect(cookie).not.toContain("Secure");
  });

  it("reuses a live cookie session without returning its identifier", async () => {
    const sessionId = randomUUID();
    mocks.sessions.getSessionId.mockResolvedValue(sessionId);
    const response = await POST(
      new NextRequest("https://rat.test/api/v1/session", {
        method: "POST",
        headers: { cookie: `ratapp_session=${sessionId}` },
      }),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
  });

  it("marks the cookie Secure in production", async () => {
    mocks.config.environment = "production";
    const response = await POST(
      new NextRequest("https://rat.test/api/v1/session", { method: "POST" }),
    );
    expect(response.headers.get("set-cookie")).toContain("Secure");
    mocks.config.environment = "test";
  });
});
