import { NextRequest } from "next/server";
import { it, vi } from "vitest";
import { expectRouteError, sessionId } from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn(async (id: string) => id) },
}));
vi.mock("@/server/redis/session-repository", () => mocks.sessions);
import { POST } from "./route";

it("validates the prompt after requiring the cookie session", async () => {
  const response = await POST(
    new NextRequest("https://rat.test/api/v1/expenses/prompt", {
      method: "POST",
      headers: {
        cookie: `ratapp_session=${sessionId}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prompt: "Lunch 12.50", locale: "en" }),
    }),
  );
  await expectRouteError(response, 501, "classification_unavailable");
});
