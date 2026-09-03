import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  expectRouteError,
  expense,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  expenses: { getExpenses: vi.fn() },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getExpenseManager: () => mocks.expenses,
}));

import { GET } from "./route";

describe("GET /session/:sessionId/expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
    mocks.expenses.getExpenses.mockResolvedValue({ expenses: [expense] });
  });

  it("returns the exact expense envelope with no-store", async () => {
    const response = await GET(
      new Request("https://rat.test/expenses"),
      routeContext({ sessionId }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ expenses: [expense] });
  });

  it("rejects an expired session before querying expenses", async () => {
    mocks.sessions.getSessionId.mockResolvedValue(null);
    const response = await GET(
      new Request("https://rat.test/expenses"),
      routeContext({ sessionId }),
    );
    await expectRouteError(response, 401, "session_not_found");
    expect(mocks.expenses.getExpenses).not.toHaveBeenCalled();
  });
});
