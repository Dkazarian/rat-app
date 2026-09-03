import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationErrors } from "@/server/domain/errors";
import {
  categoryId,
  expectRouteError,
  expense,
  expenseId,
  jsonRequest,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  expenses: { updateExpenseCategory: vi.fn() },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getExpenseManager: () => mocks.expenses,
}));

import { PUT } from "./route";

describe("PUT /session/:sessionId/expenses/:expenseId/category", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.expenses.updateExpenseCategory.mockResolvedValue({
      ...expense,
      categoryId: null,
    });
  });

  it("reclassifies an expense while returning the authoritative DTO", async () => {
    const response = await PUT(
      jsonRequest("PUT", { categoryId: null }),
      routeContext({ sessionId, expenseId }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      expense: { ...expense, categoryId: null },
    });
    expect(mocks.expenses.updateExpenseCategory).toHaveBeenCalledWith(
      sessionId,
      expenseId,
      null,
    );
  });

  it("rejects malformed bodies and expense IDs before mutation", async () => {
    const bodyResponse = await PUT(
      jsonRequest("PUT", { categoryId: "not-a-uuid" }),
      routeContext({ sessionId, expenseId }),
    );
    await expectRouteError(bodyResponse, 400, "invalid_request");
    expect(mocks.expenses.updateExpenseCategory).not.toHaveBeenCalled();

    const idResponse = await PUT(
      jsonRequest("PUT", { categoryId }),
      routeContext({ sessionId, expenseId: "bad" }),
    );
    await expectRouteError(idResponse, 400, "invalid_request");
    expect(mocks.expenses.updateExpenseCategory).not.toHaveBeenCalled();
  });

  it("maps missing target categories to a safe not-found response", async () => {
    mocks.expenses.updateExpenseCategory.mockRejectedValue(
      applicationErrors.categoryNotFound(),
    );
    const response = await PUT(
      jsonRequest("PUT", { categoryId }),
      routeContext({ sessionId, expenseId }),
    );
    await expectRouteError(response, 404, "category_not_found");
  });
});
