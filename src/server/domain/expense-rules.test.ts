import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
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
