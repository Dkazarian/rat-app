import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationErrors } from "@/server/domain/errors";
import {
  expectRouteError,
  expenseId,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  expenses: { deleteExpense: vi.fn() },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getExpenseManager: () => mocks.expenses,
}));

import { DELETE } from "./route";

describe("DELETE /session/:sessionId/expenses/:expenseId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.expenses.deleteExpense.mockResolvedValue(undefined);
  });

  it("deletes an expense and returns an empty 204", async () => {
    const response = await DELETE(
      new Request("https://rat.test/expense", { method: "DELETE" }),
      routeContext({ sessionId, expenseId }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("");
    expect(mocks.expenses.deleteExpense).toHaveBeenCalledWith(
      sessionId,
      expenseId,
    );
  });

  it("rejects malformed expense IDs before deletion", async () => {
    const response = await DELETE(
      new Request("https://rat.test/expense", { method: "DELETE" }),
      routeContext({ sessionId, expenseId: "bad" }),
    );
    await expectRouteError(response, 400, "invalid_request");
    expect(mocks.expenses.deleteExpense).not.toHaveBeenCalled();
  });

  it("maps missing expenses without leaking their identifiers", async () => {
    mocks.expenses.deleteExpense.mockRejectedValue(
      applicationErrors.expenseNotFound(),
    );
    const response = await DELETE(
      new Request("https://rat.test/expense", { method: "DELETE" }),
      routeContext({ sessionId, expenseId }),
    );
    const body = await expectRouteError(response, 404, "expense_not_found");
    expect(JSON.stringify(body)).not.toContain(expenseId);
  });
});
