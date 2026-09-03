import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryService } from "@/services/categories/category-service";
import { ExpenseNotFoundError, ExpenseValidationError } from "./expense-errors";
import { ExpenseService } from "./expense-service";
import type { Expense, ExpenseCandidate } from "./types";

const lunch: ExpenseCandidate = {
  description: "Lunch",
  amountMinor: 1800,
  categoryId: "food",
};
const coffee: ExpenseCandidate = {
  description: "Coffee",
  amountMinor: 450,
  categoryId: "food",
};
let categories: CategoryService;
let service: ExpenseService;
beforeEach(() => {
  categories = new CategoryService();
  vi.spyOn(categories, "exists").mockImplementation(
    (userId, categoryId) =>
      ["alice", "bob"].includes(userId) &&
      ["food", "home", null].includes(categoryId),
  );
  service = new ExpenseService({ categories });
});
afterEach(() => vi.restoreAllMocks());

describe("createExpense", () => {
  it("accepts only categories belonging to the expense's user", () => {
    const realCategories = new CategoryService();
    const category = realCategories.create("alice", "Food");
    const expenses = new ExpenseService({ categories: realCategories });
    const candidate = { ...lunch, categoryId: category.id };
    expect(expenses.createExpense(candidate, "alice").categoryId).toBe(
      category.id,
    );
    expect(expenses.createExpense(candidate, "bob").categoryId).toBeNull();
  });
  it("generates an ID and stores literal values without mutating the candidate", () => {
    const candidate = Object.freeze({
      ...coffee,
      description: "  Café cortado  ",
    });
    const expense = service.createExpense(candidate, "alice");
    expect(expense).toEqual({ ...candidate, id: expect.any(String) });
    expect(expense.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(candidate).not.toHaveProperty("id");
    expect(service.listExpensesForUser("alice")).toEqual([expense]);
    expect(service.listExpensesForUser("bob")).toEqual([]);
  });
  it.each(["", "   "])("rejects description %j", (description) => {
    expect(() =>
      service.createExpense({ ...lunch, description }, "alice"),
    ).toThrow(new ExpenseValidationError("invalid-description"));
    expect(service.listExpensesForUser("alice")).toEqual([]);
  });
  it.each([0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects amount %s",
    (amountMinor) => {
      expect(() =>
        service.createExpense({ ...lunch, amountMinor }, "alice"),
      ).toThrow(new ExpenseValidationError("invalid-amount"));
      expect(service.listExpensesForUser("alice")).toEqual([]);
    },
  );
  it.each([null, "missing"])(
    "normalizes category %s to Unclassified",
    (categoryId) => {
      expect(
        service.createExpense({ ...lunch, categoryId }, "alice").categoryId,
      ).toBeNull();
    },
  );
  it("uses the current category collection", () => {
    vi.mocked(categories.exists).mockReturnValue(false);
    expect(service.createExpense(lunch, "alice").categoryId).toBeNull();
  });
});

describe("addExpenseBatch", () => {
  it("accepts repeated candidates within and across batches with distinct generated IDs", () => {
    const first = service.addExpenseBatch([lunch, lunch], "alice");
    const second = service.addExpenseBatch([lunch], "alice");
    const all = [...first.added, ...second.added];
    expect(first.errors).toEqual([]);
    expect(second.errors).toEqual([]);
    expect(all).toHaveLength(3);
    expect(new Set(all.map(({ id }) => id)).size).toBe(3);
    expect(service.listExpensesForUser("alice")).toEqual(all);
    expect(all).toEqual(all.map(() => ({ ...lunch, id: expect.any(String) })));
  });
  it("keeps accepted and rejected items in input order and preserves previous batches", () => {
    const prior = service.createExpense(coffee, "alice");
    const invalidDescription = Object.freeze({ ...lunch, description: "" });
    const invalidAmount = Object.freeze({ ...coffee, amountMinor: 0 });
    const batch = Object.freeze([
      invalidDescription,
      lunch,
      invalidAmount,
      coffee,
    ]);
    const result = service.addExpenseBatch(batch, "alice");
    expect(result.added).toEqual([
      { ...lunch, id: expect.any(String) },
      { ...coffee, id: expect.any(String) },
    ]);
    expect(result.errors.map(({ candidate }) => candidate)).toEqual([
      invalidDescription,
      invalidAmount,
    ]);
    expect(result.errors.map(({ error }) => error.code)).toEqual([
      "invalid-description",
      "invalid-amount",
    ]);
    expect(result.errors[0].candidate).toBe(invalidDescription);
    expect(result.errors[0].error).toBeInstanceOf(ExpenseValidationError);
    expect(service.listExpensesForUser("alice")).toEqual([
      prior,
      ...result.added,
    ]);
    expect(categories.exists).toHaveBeenCalledWith("alice", "food");
    expect(lunch).not.toHaveProperty("id");
  });
  it("returns empty results for an empty batch and one error per invalid candidate", () => {
    expect(service.addExpenseBatch([], "alice")).toEqual({
      added: [],
      errors: [],
    });
    const result = service.addExpenseBatch(
      [
        { ...lunch, description: "", amountMinor: -1 },
        { ...coffee, amountMinor: 0 },
      ],
      "alice",
    );
    expect(result.added).toEqual([]);
    expect(result.errors.map(({ error }) => error.code)).toEqual([
      "invalid-description",
      "invalid-amount",
    ]);
  });
  it("propagates unexpected failures instead of treating them as validation errors", () => {
    const failure = new Error("UUID unavailable");
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw failure;
    });
    expect(() => service.addExpenseBatch([lunch], "alice")).toThrow(failure);
    expect(service.listExpensesForUser("alice")).toEqual([]);
  });
});

describe("user expense queries", () => {
  it("isolates totals and lists by user and category, including Unclassified and empty results", () => {
    const alice = service.addExpenseBatch(
      [lunch, coffee, { ...coffee, categoryId: null }],
      "alice",
    ).added;
    const bob = service.createExpense({ ...lunch, amountMinor: 900 }, "bob");
    expect(service.listExpensesForUser("alice")).toEqual(alice);
    expect(service.listExpensesForUser("bob")).toEqual([bob]);
    expect(service.totalExpensesInCategoryForUser("alice", "food")).toBe(2250);
    expect(service.totalExpensesInCategoryForUser("alice", null)).toBe(450);
    expect(service.totalExpensesInCategoryForUser("bob", "food")).toBe(900);
    expect(service.totalExpensesInCategoryForUser("alice", "home")).toBe(0);
    expect(service.totalExpensesInCategoryForUser("unknown", "food")).toBe(0);
    expect(service.listExpensesForUser("unknown", true)).toEqual([]);
  });
  it("sorts descending by ID only when requested, without changing stored order", () => {
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("10000000-0000-4000-8000-000000000000")
      .mockReturnValueOnce("f0000000-0000-4000-8000-000000000000")
      .mockReturnValueOnce("50000000-0000-4000-8000-000000000000");
    const [first, second, third] = service.addExpenseBatch(
      [lunch, coffee, lunch],
      "alice",
    ).added;
    expect(service.listExpensesForUser("alice", true)).toEqual([
      second,
      third,
      first,
    ]);
    const list = service.listExpensesForUser;
    expect(list("alice", false)).toEqual([first, second, third]);
    (list("alice") as Expense[]).pop();
    expect(list("alice")).toHaveLength(3);
  });
});

describe("expense mutations", () => {
  it("reclassifies the selected expense, preserves previous records, and accepts null", () => {
    const [first, second] = service.addExpenseBatch(
      [lunch, coffee],
      "alice",
    ).added;
    const bob = service.createExpense(lunch, "bob");
    const updated = service.reclassifyExpense(first.id, "home", "alice");
    expect(updated).toEqual({ ...first, categoryId: "home" });
    expect(service.listExpensesForUser("alice")).toEqual([updated, second]);
    expect(service.listExpensesForUser("alice")[1]).toBe(second);
    expect(service.listExpensesForUser("bob")).toEqual([bob]);
    expect(first.categoryId).toBe("food");
    expect(
      service.reclassifyExpense(first.id, null, "alice").categoryId,
    ).toBeNull();
  });
  it("assigns the provided category without validating the category collection", () => {
    const expense = service.createExpense(lunch, "alice");
    expect(
      service.reclassifyExpense(expense.id, "external-category", "alice"),
    ).toEqual({ ...expense, categoryId: "external-category" });
  });
  it("throws for missing expenses and expenses owned by another user", () => {
    const expense = service.createExpense(lunch, "alice");
    for (const id of ["missing", expense.id]) {
      expect(() => service.reclassifyExpense(id, "home", "bob")).toThrow(
        new ExpenseNotFoundError(id),
      );
      expect(() => service.deleteExpense(id, "bob")).toThrow(
        new ExpenseNotFoundError(id),
      );
    }
    expect(service.listExpensesForUser("alice")).toEqual([expense]);
    expect(service.listExpensesForUser("bob")).toEqual([]);
  });
  it("deletes only the selected expense and rejects subsequent mutations", () => {
    const [first, second] = service.addExpenseBatch(
      [lunch, coffee],
      "alice",
    ).added;
    expect(service.deleteExpense(first.id, "alice")).toBeUndefined();
    expect(service.listExpensesForUser("alice")).toEqual([second]);
    expect(() => service.deleteExpense(first.id, "alice")).toThrow(
      ExpenseNotFoundError,
    );
    expect(() => service.reclassifyExpense(first.id, "home", "alice")).toThrow(
      ExpenseNotFoundError,
    );
  });
});

describe("removeCategoryFromExpensesInCategory", () => {
  it("returns affected records in order and leaves other categories and users untouched", () => {
    const [first, unrelated, last] = service.addExpenseBatch(
      [lunch, { ...coffee, categoryId: "home" }, coffee],
      "alice",
    ).added;
    const bob = service.createExpense(lunch, "bob");
    const changed = service.removeCategoryFromExpensesInCategory(
      "food",
      "alice",
    );
    expect(changed).toEqual([
      { ...first, categoryId: null },
      { ...last, categoryId: null },
    ]);
    expect(service.listExpensesForUser("alice")).toEqual([
      changed[0],
      unrelated,
      changed[1],
    ]);
    expect(service.listExpensesForUser("alice")[1]).toBe(unrelated);
    expect(service.listExpensesForUser("bob")).toEqual([bob]);
    expect(first.categoryId).toBe("food");
    expect(last.categoryId).toBe("food");
    expect(service.totalExpensesInCategoryForUser("alice", "food")).toBe(0);
    expect(service.totalExpensesInCategoryForUser("alice", null)).toBe(2250);
  });
  it("returns no changes for null, unknown, empty, and already-cleared categories", () => {
    const expense = service.createExpense(lunch, "alice");
    expect(service.removeCategoryFromExpensesInCategory(null, "alice")).toEqual(
      [],
    );
    expect(
      service.removeCategoryFromExpensesInCategory("missing", "alice"),
    ).toEqual([]);
    expect(
      service.removeCategoryFromExpensesInCategory("food", "unknown"),
    ).toEqual([]);
    expect(service.listExpensesForUser("alice")[0]).toBe(expense);
    service.removeCategoryFromExpensesInCategory("food", "alice");
    expect(
      service.removeCategoryFromExpensesInCategory("food", "alice"),
    ).toEqual([]);
  });
});
