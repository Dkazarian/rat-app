// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CategoryNotFoundError,
  CategoryValidationError,
} from "@/services/categories/category-errors";
import type { Category } from "@/services/categories/types";
import { ExpenseNotFoundError } from "@/services/expenses/expense-errors";
import type { ExpenseCandidate } from "@/services/expenses/types";
import { SessionService } from "./session-service";

const categories: ReadonlyArray<Category> = [
  { id: "food", kind: "custom", name: "Food", color: "coral", system: false },
  { id: "home", kind: "custom", name: "Home", color: "purple", system: false },
];
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
const rent: ExpenseCandidate = {
  description: "Rent",
  amountMinor: 10000,
  categoryId: "home",
};
function idFor(session: SessionService, name: string) {
  const category = session
    .listCategories()
    .find((category) => category.kind === "custom" && category.name === name);
  if (!category || category.id === null)
    throw new Error("Missing test category: " + name);
  return category.id;
}

describe("SessionService", () => {
  it("remaps seeded category IDs and passes its user ID through capture, totals, and listings", () => {
    const session = new SessionService({
      userId: "alice",
      initialCategories: categories,
      initialExpenses: [lunch],
    });
    const food = idFor(session, "Food");
    const seeded = session.listExpenses()[0];
    const captured = session.captureExpenses([{ ...coffee, categoryId: food }])
      .added[0];
    expect(session.userId).toBe("alice");
    expect(food).not.toBe("food");
    expect(seeded).toEqual({
      ...lunch,
      categoryId: food,
      id: expect.any(String),
    });
    expect(session.listExpenses()).toEqual([seeded, captured]);
    expect(session.totalExpensesInCategory(food)).toBe(2250);
    const sorted = [seeded, captured].sort((a, b) => b.id.localeCompare(a.id));
    expect(session.listExpenses(true)).toEqual(sorted);
    expect(session.listRecentExpenses(1)).toEqual(sorted.slice(0, 1));
    expect(session.listRecentExpenses(10)).toEqual(sorted);
    expect(session.listRecentExpenses(0)).toEqual([]);
    expect(lunch.categoryId).toBe("food");
  });
  it.each([-1, 1.5, NaN, Infinity])(
    "rejects invalid list limit %s",
    (amount) => {
      expect(() => new SessionService().listRecentExpenses(amount)).toThrow(
        RangeError,
      );
    },
  );
  it("deletes a populated category while preserving prior snapshots and unrelated records", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch, rent, coffee],
    });
    const food = idFor(session, "Food");
    const home = idFor(session, "Home");
    const beforeCategories = session.listCategories();
    const [first, unrelated, last] = session.listExpenses();
    const result = session.deleteCategory(food);
    expect(result.deletedCategory).toBe(beforeCategories[0]);
    expect(result.categories.map(({ id }) => id)).toEqual([home, null]);
    expect(result.reassignedExpenses).toEqual([
      { ...first, categoryId: null },
      { ...last, categoryId: null },
    ]);
    expect(session.listExpenses()).toEqual([
      result.reassignedExpenses[0],
      unrelated,
      result.reassignedExpenses[1],
    ]);
    expect(session.listExpenses()[1]).toBe(unrelated);
    expect(first.categoryId).toBe(food);
    expect(last.categoryId).toBe(food);
    expect(session.totalExpensesInCategory(null)).toBe(2250);
    expect(session.totalExpensesInCategory(home)).toBe(10000);
  });
  it.each([null, "missing"])(
    "treats category deletion of %s as a no-op",
    (categoryId) => {
      const session = new SessionService({
        initialCategories: categories,
        initialExpenses: [lunch],
      });
      const beforeCategories = session.listCategories();
      const beforeExpenses = session.listExpenses();
      expect(session.deleteCategory(categoryId)).toEqual({
        ok: true,
        categories: beforeCategories,
        reassignedExpenses: [],
      });
      expect(session.listCategories()).toEqual(beforeCategories);
      expect(session.listExpenses()).toEqual(beforeExpenses);
      expect(session.listExpenses()[0]).toBe(beforeExpenses[0]);
    },
  );
  it("uses generated IDs for reclassification, deletion, and subsequent category removal", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch, coffee],
    });
    const food = idFor(session, "Food");
    const home = idFor(session, "Home");
    const [first, second] = session.listExpenses();
    session.reclassifyExpense(first.id, home);
    session.deleteExpense(second.id);
    expect(session.deleteCategory(food).reassignedExpenses).toEqual([]);
    expect(session.listExpenses()).toEqual([{ ...first, categoryId: home }]);
    expect(session.deleteCategory(home).reassignedExpenses).toEqual([
      { ...first, categoryId: null },
    ]);
    expect(() => session.deleteExpense(second.id)).toThrow(
      ExpenseNotFoundError,
    );
  });
  it("creates, captures, deletes, and captures without restoring deleted categories", () => {
    const session = new SessionService();
    const created = session.createCategory("  Health  ");
    expect(created.category.name).toBe("Health");
    expect(created.categories).toEqual(session.listCategories());
    const first = session.captureExpenses([
      {
        description: "Vitamins",
        amountMinor: 500,
        categoryId: created.category.id,
      },
    ]).added[0];
    session.deleteCategory(created.category.id);
    const second = session.captureExpenses([
      {
        description: "More vitamins",
        amountMinor: 600,
        categoryId: created.category.id,
      },
    ]).added[0];
    expect(session.listCategories().map(({ id }) => id)).toEqual([null]);
    expect(session.listExpenses()).toEqual([
      { ...first, categoryId: null },
      second,
    ]);
    expect(second.categoryId).toBeNull();
    expect(second.id).not.toBe(first.id);
  });
  it("accepts repeated captures and reports invalid candidates without losing accepted items", () => {
    const session = new SessionService({ initialCategories: categories });
    const candidate = { ...lunch, categoryId: idFor(session, "Food") };
    const invalid = {
      description: "Invalid",
      amountMinor: 0,
      categoryId: null,
    };
    const result = session.captureExpenses([
      candidate,
      candidate,
      invalid,
      { description: "Unknown", amountMinor: 100, categoryId: "missing" },
    ]);
    expect(result.added).toEqual([
      { ...candidate, id: expect.any(String) },
      { ...candidate, id: expect.any(String) },
      {
        id: expect.any(String),
        description: "Unknown",
        amountMinor: 100,
        categoryId: null,
      },
    ]);
    expect(new Set(result.added.map(({ id }) => id)).size).toBe(3);
    expect(result.errors.map(({ error }) => error.code)).toEqual([
      "invalid-amount",
    ]);
    expect(result.errors[0].candidate).toBe(invalid);
    expect(session.listExpenses()).toEqual(result.added);
  });
  it("keeps state intact on validation failures and empty capture", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch],
    });
    const beforeCategories = session.listCategories();
    const beforeExpenses = session.listExpenses();
    expect(() => session.createCategory(" ")).toThrow(CategoryValidationError);
    expect(() =>
      session.reclassifyExpense(beforeExpenses[0].id, "missing"),
    ).toThrow(CategoryNotFoundError);
    expect(session.captureExpenses([])).toEqual({ added: [], errors: [] });
    expect(session.listCategories()).toEqual(beforeCategories);
    expect(session.listExpenses()).toEqual(beforeExpenses);
  });
  it("isolates sessions, remaps shared seeds independently, and generates missing user IDs", () => {
    const options = { initialCategories: categories, initialExpenses: [lunch] };
    const first = new SessionService(options);
    const second = new SessionService(options);
    const firstExpense = first.listExpenses()[0];
    const secondExpense = second.listExpenses()[0];
    expect(first.userId).not.toBe(second.userId);
    expect(firstExpense.id).not.toBe(secondExpense.id);
    expect(firstExpense.categoryId).not.toBe(secondExpense.categoryId);
    first.deleteCategory(firstExpense.categoryId);
    expect(second.listExpenses()).toEqual([secondExpense]);
    expect(second.listCategories()).toHaveLength(3);
    expect(first.listExpenses()).toEqual([
      { ...firstExpense, categoryId: null },
    ]);
    expect(new SessionService().listCategories().map(({ id }) => id)).toEqual([
      null,
    ]);
    expect(new SessionService().listExpenses()).toEqual([]);
  });
});
