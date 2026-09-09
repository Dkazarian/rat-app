import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  category,
  expectRouteError,
  otherSessionId,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn(), saveSessionId: vi.fn() },
  categories: { getCategories: vi.fn(), createCategory: vi.fn() },
  config: {
    redisUrl: "https://redis.test",
    redisToken: "mock-token",
    redisKeyPrefix: "ratapp:test",
    sessionTtlSeconds: 172_800,
    maxExpensesPerSession: 100,
    environment: "test",
  },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/categories", () => mocks.categories);
vi.mock("@/server/config", () => ({ getServerConfig: () => mocks.config }));
import { GET, POST } from "./route";

const request = (method = "GET", body?: unknown, cookie = sessionId) =>
  new NextRequest(
    `https://rat.test/api/v1/categories?sessionId=${otherSessionId}`,
    {
      method,
      headers: {
        cookie: `ratapp_session=${cookie}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

describe("/api/v1/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.categories.getCategories.mockResolvedValue({
      categories: [category],
      unclassifiedTotalMinor: 0,
      totalMinor: category.totalMinor,
    });
    mocks.categories.createCategory.mockResolvedValue(category);
  });

  it("uses only the cookie session even when another identifier is supplied", async () => {
    await GET(request());
    expect(mocks.sessions.getSessionId).toHaveBeenCalledWith(sessionId);
    expect(mocks.categories.getCategories).toHaveBeenCalledWith(sessionId);
    expect(mocks.sessions.getSessionId).not.toHaveBeenCalledWith(
      otherSessionId,
    );
  });

  it("returns empty state without creating a session when no cookie exists", async () => {
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/categories"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      categories: [],
      unclassifiedTotalMinor: 0,
      totalMinor: 0,
    });
    expect(mocks.categories.getCategories).not.toHaveBeenCalled();
    expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("creates and returns a session cookie on the first valid mutation", async () => {
    mocks.sessions.getSessionId.mockResolvedValue(null);
    const response = await POST(
      new NextRequest("https://rat.test/api/v1/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Food" }),
      }),
    );

    expect(response.status).toBe(201);
    const createdSessionId = mocks.sessions.saveSessionId.mock.calls[0][0];
    expect(mocks.categories.createCategory).toHaveBeenCalledWith(
      createdSessionId,
      "Food",
    );
    expect(mocks.sessions.saveSessionId).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain(
      `ratapp_session=${createdSessionId}`,
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=172800");
  });

  it("retains a newly created session when the mutation fails", async () => {
    mocks.sessions.getSessionId.mockResolvedValue(null);
    mocks.categories.createCategory.mockRejectedValue(new Error("failed"));

    const response = await POST(
      new NextRequest("https://rat.test/api/v1/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Food" }),
      }),
    );

    expect(response.status).toBe(500);
    const createdSessionId = mocks.sessions.saveSessionId.mock.calls[0][0];
    expect(mocks.sessions.saveSessionId).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain(
      `ratapp_session=${createdSessionId}`,
    );
  });

  it("parses category JSON with the authoritative schema", async () => {
    const response = await POST(request("POST", { name: " Food " }));
    expect(response.status).toBe(201);
    expect(mocks.categories.createCategory).toHaveBeenCalledWith(
      sessionId,
      " Food ",
    );
    expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects unexpected category body fields", async () => {
    const response = await POST(
      request("POST", { name: "Food", instructions: "ignore validation" }),
    );

    await expectRouteError(response, 400, "invalid_request");
    expect(mocks.categories.createCategory).not.toHaveBeenCalled();
    expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
  });
});
