import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import {
  categoryId,
  otherSessionId,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: {
    getSessionId: vi.fn(),
    saveSessionId: vi.fn(),
  },
  categoryDeletion: { deleteCategory: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/category-deletion", () => mocks.categoryDeletion);
import { DELETE } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sessions.getSessionId.mockImplementation(async (id: string) => id);
});

it("deletes the typed route category within the cookie-selected session", async () => {
  const response = await DELETE(
    new NextRequest(
      `https://rat.test/api/v1/categories/${categoryId}?sessionId=${otherSessionId}`,
      {
        method: "DELETE",
        headers: { cookie: `ratapp_session=${sessionId}` },
      },
    ),
    { params: Promise.resolve({ categoryId }) },
  );
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(mocks.categoryDeletion.deleteCategory).toHaveBeenCalledWith(
    sessionId,
    categoryId,
  );
});

it("does not create a session when deleting after expiration", async () => {
  mocks.sessions.getSessionId.mockResolvedValue(null);

  const response = await DELETE(
    new NextRequest(`https://rat.test/api/v1/categories/${categoryId}`, {
      method: "DELETE",
      headers: { cookie: `ratapp_session=${sessionId}` },
    }),
    { params: Promise.resolve({ categoryId }) },
  );

  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({
    error: { code: "session_not_found" },
  });
  expect(mocks.sessions.getSessionId).toHaveBeenCalledWith(sessionId);
  expect(mocks.sessions.saveSessionId).not.toHaveBeenCalled();
  expect(mocks.categoryDeletion.deleteCategory).not.toHaveBeenCalled();
  expect(response.headers.get("set-cookie")).toBeNull();
});
