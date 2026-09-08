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
              code: "service_unavailable",
              message: "Unavailable",
              field: "prompt",
            },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      browserSessionApi.submitPrompt(" exact ", "en"),
    ).rejects.toEqual(
      new SessionApiError("service_unavailable", "Unavailable", "prompt"),
    );
  });

  it("keeps rate limits as typed client errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { code: "rate_limited", message: "Too many requests." } },
            { status: 429, headers: { "Retry-After": "60" } },
          ),
        ),
    );

    await expect(
      browserSessionApi.submitPrompt("Lunch $18", "en"),
    ).rejects.toEqual(
      new SessionApiError("rate_limited", "Too many requests."),
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

  it("deletes an expense through the cookie-scoped API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      browserSessionApi.deleteExpense("expense/id"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/expenses/expense%2Fid",
      expect.objectContaining({
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
  });

  it("validates prompt mutation success responses before returning them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            expenses: [{ id: "not-a-uuid" }],
            rejectedCount: 0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      browserSessionApi.submitPrompt("Lunch $18", "en"),
    ).rejects.toEqual(
      new SessionApiError(
        "internal_error",
        "The request could not be completed.",
      ),
    );
  });

  it("returns a schema-valid prompt mutation response", async () => {
    const payload = {
      expenses: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          description: "Lunch",
          amountMinor: 1800,
          categoryId: null,
          createdAt: 1,
        },
      ],
      rejectedCount: 2,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      browserSessionApi.submitPrompt("Lunch $18", "en"),
    ).resolves.toEqual(payload);
  });
});
