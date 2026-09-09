import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import {
  expenseId,
  otherSessionId,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: {
    getSessionId: vi.fn(),
    saveSessionId: vi.fn(),
  },
  expenses: { deleteExpense: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/expenses", () => mocks.expenses);
import { DELETE } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
});

it("deletes the typed route expense within the cookie-selected session", async () => {
  const response = await DELETE(
    new NextRequest(
      `https://rat.test/api/v1/expenses/${expenseId}?sessionId=${otherSessionId}`,
      {
        method: "DELETE",
        headers: { cookie: `ratapp_session=${sessionId}` },
      },
    ),
    { params: Promise.resolve({ expenseId }) },
  );

  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(mocks.expenses.deleteExpense).toHaveBeenCalledWith(
    sessionId,
    expenseId,
  );
});

it("rejects malformed expense IDs", async () => {
  mocks.expenses.deleteExpense.mockClear();
  const response = await DELETE(
    new NextRequest("https://rat.test/api/v1/expenses/not-an-id", {
      method: "DELETE",
      headers: { cookie: `ratapp_session=${sessionId}` },
    }),
    { params: Promise.resolve({ expenseId: "not-an-id" }) },
  );

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({
    error: { code: "invalid_request" },
  });
  expect(mocks.expenses.deleteExpense).not.toHaveBeenCalled();
});

it("does not create a session when deleting after expiration", async () => {
  mocks.sessions.getSessionId.mockResolvedValue(null);

  const response = await DELETE(
    new NextRequest(`https://rat.test/api/v1/expenses/${expenseId}`, {
      method: "DELETE",
      headers: { cookie: `ratapp_session=${sessionId}` },
    }),
    { params: Promise.resolve({ expenseId }) },
  );

  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({
    error: { code: "session_not_found" },
  });
  expect(mocks.sessions.getSessionId).toHaveBeenCalledWith(sessionId);
  expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
  expect(mocks.expenses.deleteExpense).not.toHaveBeenCalled();
  expect(response.headers.get("set-cookie")).toBeNull();
});
