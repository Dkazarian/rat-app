import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { category, expense, sessionId } from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: {
    getSessionId: vi.fn(),
    saveSessionId: vi.fn(),
  },
  categories: { listCategories: vi.fn() },
  expenses: { listExpenses: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/categories", () => mocks.categories);
vi.mock("@/server/redis/expenses", () => mocks.expenses);
import { GET } from "./route";

describe("GET /api/v1/expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
  });

  it("reads expenses for the cookie-selected session", async () => {
    mocks.categories.listCategories.mockResolvedValue([
      { id: category.id, name: category.name, color: category.color },
    ]);
    mocks.expenses.listExpenses.mockResolvedValue([expense]);
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/expenses", {
        headers: { cookie: `ratapp_session=${sessionId}` },
      }),
    );
    await expect(response.json()).resolves.toEqual({ expenses: [expense] });
    expect(mocks.categories.listCategories).toHaveBeenCalledWith(sessionId);
    expect(mocks.expenses.listExpenses).toHaveBeenCalledWith(sessionId);
  });

  it("returns empty state without creating a session", async () => {
    const response = await GET(
      new NextRequest("https://rat.test/api/v1/expenses"),
    );

    await expect(response.json()).resolves.toEqual({ expenses: [] });
    expect(mocks.sessions.getSessionId).not.toHaveBeenCalled();
    expect(mocks.categories.listCategories).not.toHaveBeenCalled();
    expect(mocks.expenses.listExpenses).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns empty state without creating a session for an expired cookie", async () => {
    mocks.sessions.getSessionId.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("https://rat.test/api/v1/expenses", {
        headers: { cookie: `ratapp_session=${sessionId}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ expenses: [] });
    expect(mocks.sessions.getSessionId).toHaveBeenCalledWith(sessionId);
    expect(mocks.categories.listCategories).not.toHaveBeenCalled();
    expect(mocks.expenses.listExpenses).not.toHaveBeenCalled();
    expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
