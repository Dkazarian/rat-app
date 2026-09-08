import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseExtractorError } from "@/server/ai/expense-extractor";
import { categoryId, expenseId, sessionId } from "@/test/session-route-helpers";

const mocks = vi.hoisted(() => ({
  sessions: { getSessionId: vi.fn(async (id: string) => id) },
  categories: { getCategories: vi.fn() },
  expenses: { getExpenses: vi.fn(), createExpenses: vi.fn() },
  extractor: { extractExpenses: vi.fn() },
  rateLimit: { consumeAiRateLimit: vi.fn() },
  config: { getServerConfig: vi.fn() },
}));

vi.mock("@/server/redis/session-repository", () => mocks.sessions);
vi.mock("@/server/redis/categories", () => mocks.categories);
vi.mock("@/server/redis/expenses", () => mocks.expenses);
vi.mock("@/server/ai/expense-extractor", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/ai/expense-extractor")
  >("@/server/ai/expense-extractor");
  return { ...actual, extractExpenses: mocks.extractor.extractExpenses };
});
vi.mock("@/server/config", () => mocks.config);
vi.mock("@/server/redis/ai-rate-limiter", () => mocks.rateLimit);

import { POST } from "./route";

const config = {
  redisUrl: "https://redis.test",
  redisToken: "mock-token",
  redisKeyPrefix: "ratapp:test",
  sessionTtlSeconds: 300,
  maxExpensesPerSession: 100,
  environment: "test",
};

const food = {
  id: categoryId,
  name: "Food",
  color: "coral" as const,
  totalMinor: 0,
};

const createdExpense = {
  id: expenseId,
  description: "Lunch",
  amountMinor: 1800,
  categoryId,
  createdAt: 1_800_000_000_000,
};

function request(body: unknown, cookie: string = sessionId) {
  return new NextRequest("https://rat.test/api/v1/expenses/prompt", {
    method: "POST",
    headers: {
      cookie: `ratapp_session=${cookie}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  config.maxExpensesPerSession = 100;
  mocks.config.getServerConfig.mockReturnValue(config);
  mocks.categories.getCategories.mockResolvedValue({
    categories: [food],
    unclassifiedTotalMinor: 0,
    totalMinor: 0,
  });
  mocks.expenses.getExpenses.mockResolvedValue({ expenses: [] });
  mocks.expenses.createExpenses.mockResolvedValue([createdExpense]);
  mocks.extractor.extractExpenses.mockResolvedValue({
    expenses: [
      { description: "lunch", amountMinor: 1800, categoryName: " food " },
    ],
  });
  mocks.rateLimit.consumeAiRateLimit.mockResolvedValue({ allowed: true });
});

describe("POST /api/v1/expenses/prompt", () => {
  it("rate limits after session resolution and before parsing the body", async () => {
    mocks.rateLimit.consumeAiRateLimit.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 37,
    });
    const malformed = new NextRequest(
      "https://rat.test/api/v1/expenses/prompt",
      {
        method: "POST",
        headers: {
          cookie: `ratapp_session=${sessionId}`,
          "content-type": "application/json",
        },
        body: "not-json",
      },
    );

    const response = await POST(malformed);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("37");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: { code: "rate_limited", message: "Too many requests." },
    });
    expect(mocks.rateLimit.consumeAiRateLimit).toHaveBeenCalledWith(sessionId);
    expect(mocks.categories.getCategories).not.toHaveBeenCalled();
    expect(mocks.expenses.getExpenses).not.toHaveBeenCalled();
    expect(mocks.extractor.extractExpenses).not.toHaveBeenCalled();
    expect(mocks.expenses.createExpenses).not.toHaveBeenCalled();
  });

  it("extracts using the exact prompt and persists only server-created DTOs", async () => {
    const exactPrompt = "  Lunch $18  ";
    const response = await POST(request({ prompt: exactPrompt, locale: "en" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      expenses: [createdExpense],
      rejectedCount: 0,
    });
    expect(mocks.extractor.extractExpenses).toHaveBeenCalledWith({
      prompt: exactPrompt,
      locale: "en",
      categoryNames: ["Food"],
    });
    expect(mocks.expenses.createExpenses).toHaveBeenCalledWith(sessionId, [
      { description: "Lunch", amountMinor: 1800, categoryId },
    ]);
  });

  it("keeps valid candidates in order and counts invalid candidates", async () => {
    mocks.extractor.extractExpenses.mockResolvedValue({
      expenses: [
        { description: "", amountMinor: 100, categoryName: null },
        { description: "Coffee", amountMinor: 450, categoryName: "unknown" },
        { description: "Taxi", amountMinor: 1200, categoryName: null },
      ],
    });
    mocks.expenses.createExpenses.mockResolvedValue([
      {
        ...createdExpense,
        description: "Coffee",
        amountMinor: 450,
        categoryId: null,
      },
      {
        ...createdExpense,
        description: "Taxi",
        amountMinor: 1200,
        categoryId: null,
      },
    ]);

    const response = await POST(
      request({ prompt: "Coffee and taxi", locale: "en" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ rejectedCount: 1 });
    expect(mocks.expenses.createExpenses).toHaveBeenCalledWith(sessionId, [
      { description: "Coffee", amountMinor: 450, categoryId: null },
      { description: "Taxi", amountMinor: 1200, categoryId: null },
    ]);
  });

  it("accepts partial batches in extraction order when capacity is limited", async () => {
    config.maxExpensesPerSession = 2;
    mocks.expenses.getExpenses.mockResolvedValue({
      expenses: [
        { ...createdExpense, id: "30000000-0000-4000-8000-000000000001" },
      ],
    });
    mocks.extractor.extractExpenses.mockResolvedValue({
      expenses: [
        { description: "Coffee", amountMinor: 450, categoryName: null },
        { description: "Taxi", amountMinor: 1200, categoryName: null },
      ],
    });
    mocks.expenses.createExpenses.mockResolvedValue([
      {
        ...createdExpense,
        description: "Coffee",
        amountMinor: 450,
        categoryId: null,
      },
    ]);

    const response = await POST(
      request({ prompt: "Coffee and taxi", locale: "en" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      expenses: [expect.objectContaining({ description: "Coffee" })],
      rejectedCount: 1,
    });
    expect(mocks.expenses.createExpenses).toHaveBeenCalledWith(sessionId, [
      { description: "Coffee", amountMinor: 450, categoryId: null },
    ]);
  });

  it("returns the limit before calling the extractor for a full session", async () => {
    config.maxExpensesPerSession = 1;
    mocks.expenses.getExpenses.mockResolvedValue({
      expenses: [createdExpense],
    });

    const response = await POST(request({ prompt: "Lunch $18", locale: "en" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "expense_limit_reached" },
    });
    expect(mocks.extractor.extractExpenses).not.toHaveBeenCalled();
    expect(mocks.expenses.createExpenses).not.toHaveBeenCalled();
  });

  it("returns 422 and writes nothing when every candidate is rejected", async () => {
    mocks.extractor.extractExpenses.mockResolvedValue({
      expenses: [
        { description: "No amount", amountMinor: 0, categoryName: null },
      ],
    });

    const response = await POST(request({ prompt: "No amount", locale: "en" }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "no_expenses_extracted", field: "prompt" },
    });
    expect(mocks.expenses.createExpenses).not.toHaveBeenCalled();
  });

  it.each([
    ["configuration", 500, "internal_error"],
    ["timeout", 503, "service_unavailable"],
    ["provider", 503, "service_unavailable"],
    ["invalid_output", 503, "service_unavailable"],
  ] as const)("maps extractor %s errors safely", async (kind, status, code) => {
    mocks.extractor.extractExpenses.mockRejectedValue(
      new ExpenseExtractorError(kind),
    );

    const response = await POST(request({ prompt: "Lunch $18", locale: "en" }));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error: { code } });
    expect(mocks.expenses.createExpenses).not.toHaveBeenCalled();
  });

  it("requires the session before parsing the request", async () => {
    const response = await POST(
      request({ prompt: "Lunch $18", locale: "en" }, "not-a-uuid"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "session_not_found" },
    });
    expect(mocks.categories.getCategories).not.toHaveBeenCalled();
    expect(mocks.rateLimit.consumeAiRateLimit).not.toHaveBeenCalled();
    expect(mocks.extractor.extractExpenses).not.toHaveBeenCalled();
  });
});
