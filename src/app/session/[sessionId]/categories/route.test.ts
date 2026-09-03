import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applicationErrors,
  RepositoryUnavailableError,
} from "@/server/domain/errors";
import {
  category,
  expectRouteError,
  jsonRequest,
  otherSessionId,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  categories: { getCategories: vi.fn(), createCategory: vi.fn() },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getCategoryManager: () => mocks.categories,
}));

import { GET, POST } from "./route";

describe("GET and POST /session/:sessionId/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.categories.getCategories.mockResolvedValue({
      categories: [category],
      unclassifiedTotalMinor: 500,
      totalMinor: 1750,
    });
    mocks.categories.createCategory.mockResolvedValue({
      ...category,
      totalMinor: 0,
    });
  });

  it("returns the exact category envelope with no-store", async () => {
    const response = await GET(
      new Request("https://rat.test/categories"),
      routeContext({ sessionId }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      categories: [category],
      unclassifiedTotalMinor: 500,
      totalMinor: 1750,
    });
  });

  it("creates a category using the path session rather than the cookie", async () => {
    const response = await POST(
      jsonRequest("POST", { name: " Food " }, otherSessionId),
      routeContext({ sessionId }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      category: { ...category, totalMinor: 0 },
    });
    expect(mocks.categories.createCategory).toHaveBeenCalledWith(
      sessionId,
      " Food ",
    );
  });

  it("rejects malformed bodies before mutation", async () => {
    const response = await POST(
      jsonRequest("POST", { name: 42 }),
      routeContext({ sessionId }),
    );
    await expectRouteError(response, 400, "invalid_request");
    expect(mocks.categories.createCategory).not.toHaveBeenCalled();
  });

  it("rejects malformed and missing sessions before resource access", async () => {
    const malformedResponse = await GET(
      new Request("https://rat.test/categories"),
      routeContext({ sessionId: "bad" }),
    );
    await expectRouteError(malformedResponse, 400, "invalid_request");
    expect(mocks.sessions.getSessionId).not.toHaveBeenCalled();

    mocks.sessions.getSessionId.mockResolvedValue(null);
    const missingResponse = await GET(
      new Request("https://rat.test/categories"),
      routeContext({ sessionId }),
    );
    await expectRouteError(missingResponse, 401, "session_not_found");
    expect(mocks.categories.getCategories).not.toHaveBeenCalled();
  });

  it.each([
    [applicationErrors.invalidCategoryName(), 400, "invalid_category_name"],
    [applicationErrors.duplicateCategory(), 409, "category_name_duplicate"],
    [applicationErrors.categoryLimit(), 409, "category_limit_reached"],
  ] as const)(
    "maps category domain failure %# to its public contract",
    async (error, status, code) => {
      mocks.categories.createCategory.mockRejectedValue(error);
      const response = await POST(
        jsonRequest("POST", { name: "Unclassified" }),
        routeContext({ sessionId }),
      );
      await expectRouteError(response, status, code, "name");
    },
  );

  it("maps Redis failures without leaking provider details", async () => {
    mocks.categories.getCategories.mockRejectedValue(
      new RepositoryUnavailableError({
        cause: new Error("UPSTASH secret-token connection refused"),
      }),
    );
    const response = await GET(
      new Request("https://rat.test/categories"),
      routeContext({ sessionId }),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(JSON.parse(text)).toMatchObject({
      error: { code: "service_unavailable" },
    });
    expect(text).not.toContain("UPSTASH");
    expect(text).not.toContain("secret-token");
    expect(text).not.toContain(sessionId);
  });
});
