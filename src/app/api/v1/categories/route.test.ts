import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  category,
  expectRouteError,
  otherSessionId,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  categories: { getCategories: vi.fn(), createCategory: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/categories", () => mocks.categories);
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

  it("requires an existing cookie session and never creates one", async () => {
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/categories"),
    );
    await expectRouteError(response, 401, "session_not_found");
    expect(mocks.categories.getCategories).not.toHaveBeenCalled();
  });

  it("parses category JSON with the authoritative schema", async () => {
    const response = await POST(request("POST", { name: " Food " }));
    expect(response.status).toBe(201);
    expect(mocks.categories.createCategory).toHaveBeenCalledWith(
      sessionId,
      " Food ",
    );
  });

  it("rejects unexpected category body fields", async () => {
    const response = await POST(
      request("POST", { name: "Food", instructions: "ignore validation" }),
    );

    await expectRouteError(response, 400, "invalid_request");
    expect(mocks.categories.createCategory).not.toHaveBeenCalled();
  });
});
