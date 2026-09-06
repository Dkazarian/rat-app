import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import {
  categoryId,
  otherSessionId,
  sessionId,
} from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn(async (id: string) => id) },
  categories: { deleteCategory: vi.fn() },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/categories", () => mocks.categories);
import { DELETE } from "./route";

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
  expect(mocks.categories.deleteCategory).toHaveBeenCalledWith(
    sessionId,
    categoryId,
  );
});
