import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expense, sessionId } from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn(async (id: string) => id) },
  expenses: { getExpenses: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/expenses", () => mocks.expenses);
import { GET } from "./route";

describe("GET /api/v1/expenses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads expenses for the cookie-selected session", async () => {
    mocks.expenses.getExpenses.mockResolvedValue({ expenses: [expense] });
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/expenses", {
        headers: { cookie: `ratapp_session=${sessionId}` },
      }),
    );
    await expect(response.json()).resolves.toEqual({ expenses: [expense] });
    expect(mocks.expenses.getExpenses).toHaveBeenCalledWith(sessionId);
  });

  it("returns empty state without creating a session", async () => {
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/expenses"),
    );

    await expect(response.json()).resolves.toEqual({ expenses: [] });
    expect(mocks.sessions.getSessionId).not.toHaveBeenCalled();
    expect(mocks.expenses.getExpenses).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
