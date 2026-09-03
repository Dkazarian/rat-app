import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  expectRouteError,
  jsonRequest,
  routeContext,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn() },
  expenses: {
    createExpenses: vi.fn(),
    getExpenses: vi.fn(),
  },
}));

vi.mock("@/server/redis/persistence", () => ({
  getSessionRepository: () => mocks.sessions,
  getExpenseManager: () => mocks.expenses,
}));

import { POST } from "./route";

describe("POST /session/:sessionId/expenses/prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
  });

  it("validates the request then returns Phase 5 unavailable", async () => {
    const response = await POST(
      jsonRequest("POST", { prompt: "Lunch 12.50", locale: "en" }),
      routeContext({ sessionId }),
    );
    await expectRouteError(response, 501, "classification_unavailable");
    expect(mocks.expenses.createExpenses).not.toHaveBeenCalled();
    expect(mocks.expenses.getExpenses).not.toHaveBeenCalled();
  });

  it("rejects malformed prompts before the unavailable boundary", async () => {
    const response = await POST(
      jsonRequest("POST", { prompt: " ", locale: "en" }),
      routeContext({ sessionId }),
    );
    await expectRouteError(response, 400, "invalid_request");
  });

  it("validates the session before parsing the prompt", async () => {
    mocks.sessions.getSessionId.mockResolvedValue(null);
    const response = await POST(
      jsonRequest("POST", { prompt: " ", locale: "en" }),
      routeContext({ sessionId }),
    );
    await expectRouteError(response, 401, "session_not_found");
  });
});
