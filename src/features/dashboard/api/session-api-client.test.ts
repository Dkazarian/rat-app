import { afterEach, describe, expect, it, vi } from "vitest";
import { browserSessionApi, SessionApiError } from "./session-api-client";

afterEach(() => vi.unstubAllGlobals());

describe("browserSessionApi", () => {
  it("uses the cookie-scoped API, includes credentials, and sends JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ category: { id: "category" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await browserSessionApi.createCategory(" Health ");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/categories",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ name: " Health " }),
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
      browserSessionApi.submitPrompt(" exact ", "en"),
    ).rejects.toEqual(
      new SessionApiError(
        "classification_unavailable",
        "Unavailable",
        "prompt",
      ),
    );
  });

  it("accepts the empty 204 session response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(browserSessionApi.createSession()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/session",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });
});
