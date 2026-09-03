import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationErrors } from "@/server/domain/errors";
import {
  categoryId,
  expectRouteError,
  otherSessionId,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  categories: { deleteCategory: vi.fn() },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getCategoryManager: () => mocks.categories,
}));

import { DELETE } from "./route";

describe("DELETE /session/:sessionId/categories/:categoryId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.categories.deleteCategory.mockResolvedValue(undefined);
  });

  it("deletes through the path session and returns an empty 204", async () => {
    const response = await DELETE(
      new Request("https://rat.test/category", {
        method: "DELETE",
        headers: { cookie: `ratapp_session=${otherSessionId}` },
      }),
      routeContext({ sessionId, categoryId }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).toBe("");
    expect(mocks.categories.deleteCategory).toHaveBeenCalledWith(
      sessionId,
      categoryId,
    );
  });

  it("rejects malformed category IDs before deletion", async () => {
    const response = await DELETE(
      new Request("https://rat.test/category", { method: "DELETE" }),
      routeContext({ sessionId, categoryId: "bad" }),
    );
    await expectRouteError(response, 400, "invalid_request");
    expect(mocks.categories.deleteCategory).not.toHaveBeenCalled();
  });

  it("maps a cross-session or missing category to not found", async () => {
    mocks.categories.deleteCategory.mockRejectedValue(
      applicationErrors.categoryNotFound(),
    );
    const response = await DELETE(
      new Request("https://rat.test/category", { method: "DELETE" }),
      routeContext({ sessionId, categoryId }),
    );
    const body = await expectRouteError(response, 404, "category_not_found");
    expect(JSON.stringify(body)).not.toContain(categoryId);
  });
});
