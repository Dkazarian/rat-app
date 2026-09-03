import { afterEach, describe, expect, it, vi } from "vitest";
import { browserSessionApi, SessionApiError } from "./session-api-client";

afterEach(() => vi.unstubAllGlobals());

describe("browserSessionApi", () => {
  it("encodes identifiers, includes same-origin credentials, and sends JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ expense: { id: "expense" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await browserSessionApi.updateExpenseCategory(
      "session/id",
      "expense id",
      null,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/session/session%2Fid/expenses/expense%20id/category",
      expect.objectContaining({
        method: "PUT",
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ categoryId: null }),
      }),
    );
  });

  it("maps stable error envelopes to typed client errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "classification_unavailable",
              message: "Unavailable",
              field: "prompt",
            },
          }),
          { status: 501, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      browserSessionApi.submitPrompt("session", " exact ", "en"),
    ).rejects.toEqual(
      new SessionApiError(
        "classification_unavailable",
        "Unavailable",
        "prompt",
      ),
    );
  });
});
