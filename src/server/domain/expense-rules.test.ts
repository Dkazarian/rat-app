import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { EXPENSE_DESCRIPTION_MAX_LENGTH } from "@/contracts/session-api";
import { toExpensesResponse, validateExpenseCandidate } from "./expense-rules";

describe("expense rules", () => {
  it("normalizes an unknown category to Unclassified", () => {
    expect(
      validateExpenseCandidate(
        { description: " Lunch ", amountMinor: 1250, categoryId: randomUUID() },
        new Set(),
      ),
    ).toEqual({ description: "Lunch", amountMinor: 1250, categoryId: null });
  });

  it.each([
    [" coffee beans ", "Coffee beans"],
    ["(éclair)", "(Éclair)"],
    ["123 taxi", "123 Taxi"],
    ["iPhone case", "IPhone case"],
    ["123", "123"],
  ])("capitalizes only the first Unicode letter in %j", (input, expected) => {
    expect(
      validateExpenseCandidate(
        { description: input, amountMinor: 100, categoryId: null },
        new Set(),
      ).description,
    ).toBe(expected);
  });

  it("rejects an overlong normalized description", () => {
    expect(() =>
      validateExpenseCandidate(
        {
          description: `a${"b".repeat(EXPENSE_DESCRIPTION_MAX_LENGTH)}`,
          amountMinor: 100,
          categoryId: null,
        },
        new Set(),
      ),
    ).toThrow(expect.objectContaining({ code: "invalid_request" }));
  });

  it("orders newest first and uses IDs to break timestamp ties", () => {
    const categoryId = randomUUID();
    const olderId = randomUUID();
    const tieA = "00000000-0000-4000-8000-000000000001";
    const tieB = "00000000-0000-4000-8000-000000000002";
    const expenses = [
      {
        id: olderId,
        description: "Old",
        amountMinor: 250,
        categoryId: null,
        createdAt: 1,
      },
      {
        id: tieB,
        description: "B",
        amountMinor: 250,
        categoryId,
        createdAt: 2,
      },
      {
        id: tieA,
        description: "A",
        amountMinor: 250,
        categoryId,
        createdAt: 2,
      },
    ];
    expect(
      toExpensesResponse(expenses, new Set([categoryId])).expenses.map(
        ({ id }) => id,
      ),
    ).toEqual([tieA, tieB, olderId]);
  });
});
