// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CategoryNotFoundError,
  CategoryValidationError,
  ProtectedCategoryError,
} from "@/services/categories/category-errors";
import type { Category } from "@/services/categories/types";
import { ExpenseNotFoundError } from "@/services/expenses/expense-errors";
import type { Expense } from "@/services/expenses/types";
import { SessionService } from "./session-service";

const categories: ReadonlyArray<Category> = [
  {
    id: "food",
    kind: "custom",
    name: "Food",
    color: "coral",
    system: false,
  },
  {
    id: "home",
    kind: "custom",
    name: "Home",
    color: "purple",
    system: false,
  },
];
const lunch: Expense = {
  id: "lunch",
  description: "Lunch",
  amountMinor: 1800,
  categoryId: "food",
};
const coffee: Expense = {
  id: "coffee",
  description: "Coffee",
  amountMinor: 450,
  categoryId: "food",
};
const rent: Expense = {
  id: "rent",
  description: "Rent",
  amountMinor: 10000,
  categoryId: "home",
};

describe("SessionService", () => {
  it("deletes a populated category and reassigns only its expenses, preserving previous values", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch, rent, coffee],
    });
    const previousCategories = session.listCategories();
    const previousExpenses = session.listExpenses();

    const result = session.deleteCategory("food");

    expect(result.deletedCategory).toEqual(categories[0]);
    expect(result.categories.map(({ id }) => id)).toEqual([
      "home",
      "unclassified",
    ]);
    expect(result.reassignedExpenses).toEqual([
      { ...lunch, categoryId: "unclassified" },
      { ...coffee, categoryId: "unclassified" },
    ]);
    expect(session.listExpenses()).toEqual([
      result.reassignedExpenses[0],
      rent,
      result.reassignedExpenses[1],
    ]);
    expect(session.listExpenses()[1]).toBe(rent);
    expect(previousCategories).toContain(categories[0]);
    expect(previousExpenses).toEqual([lunch, rent, coffee]);
    expect(
      session
        .listExpenses()
        .reduce((total, expense) => total + expense.amountMinor, 0),
    ).toBe(12250);
  });

  it.each([
    ["unclassified", ProtectedCategoryError],
    ["missing", CategoryNotFoundError],
  ] as const)(
    "rejects deletion of %s without changing either collection",
    (id, ErrorType) => {
      const unclassifiedExpense = { ...coffee, categoryId: "unclassified" };
      const session = new SessionService({
        initialCategories: categories,
        initialExpenses: [lunch, unclassifiedExpense],
      });
      const beforeCategories = session.listCategories();
      const beforeExpenses = session.listExpenses();

      expect(() => session.deleteCategory(id)).toThrow(ErrorType);
      expect(session.listCategories()).toEqual(beforeCategories);
      expect(session.listExpenses()).toEqual(beforeExpenses);
      expect(session.listExpenses()[0]).toBe(lunch);
      expect(session.listExpenses()[1]).toBe(unclassifiedExpense);
    },
  );

  it("uses current expense references after reclassification and deletion", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch, coffee],
    });
    session.reclassifyExpense(lunch.id, "home");
    session.deleteExpense(coffee.id);
    expect(session.deleteCategory("food").reassignedExpenses).toEqual([]);
    expect(session.listExpenses()).toEqual([{ ...lunch, categoryId: "home" }]);
    expect(session.deleteCategory("home").reassignedExpenses).toEqual([
      { ...lunch, categoryId: "unclassified" },
    ]);
    expect(() => session.deleteExpense(coffee.id)).toThrow(
      ExpenseNotFoundError,
    );
  });

  it("supports create, capture, delete and capture again without restoring a deleted category", () => {
    let nextId = 0;
    const session = new SessionService({
      createCategoryId: () => "health",
      createExpenseId: () => `expense-${++nextId}`,
    });
    const created = session.createCategory("  Health  ");
    expect(created.category.name).toBe("Health");
    expect(created.categories).toEqual(session.listCategories());
    session.captureExpenses([
      {
        description: "Vitamins",
        amountMinor: 500,
        categoryId: created.category.id,
      },
    ]);
    session.deleteCategory(created.category.id);
    session.captureExpenses([
      {
        description: "More vitamins",
        amountMinor: 600,
        categoryId: created.category.id,
      },
    ]);
    expect(session.listCategories().map(({ id }) => id)).toEqual([
      "unclassified",
    ]);
    expect(
      session.listExpenses().map(({ id, categoryId }) => ({ id, categoryId })),
    ).toEqual([
      { id: "expense-1", categoryId: "unclassified" },
      { id: "expense-2", categoryId: "unclassified" },
    ]);
  });

  it("accepts partial batches, preserves supplied IDs and never overwrites duplicates", () => {
    let nextId = 0;
    const session = new SessionService({
      initialCategories: categories,
      createExpenseId: () => `generated-${++nextId}`,
    });
    const result = session.captureExpenses([
      lunch,
      { ...lunch, amountMinor: 999 },
      { description: "Invalid", amountMinor: 0 },
      { description: "Unknown", amountMinor: 100, categoryId: "missing" },
    ]);
    expect(result.added).toEqual([
      lunch,
      {
        id: "generated-2",
        description: "Unknown",
        amountMinor: 100,
        categoryId: "unclassified",
      },
    ]);
    expect(result.errors.map(({ error }) => error.code)).toEqual([
      "duplicate-id",
      "invalid-amount",
    ]);
    expect(session.listExpenses()).toEqual(result.added);
  });

  it("leaves state intact for invalid category creation, reclassification and empty capture", () => {
    const session = new SessionService({
      initialCategories: categories,
      initialExpenses: [lunch],
    });
    const before = session.listCategories();
    expect(() => session.createCategory(" ")).toThrow(CategoryValidationError);
    expect(() => session.reclassifyExpense(lunch.id, "missing")).toThrow(
      CategoryNotFoundError,
    );
    expect(session.captureExpenses([])).toEqual({ added: [], errors: [] });
    expect(session.listCategories()).toEqual(before);
    expect(session.listExpenses()).toEqual([lunch]);
  });

  it("isolates sessions even when they share seeds", () => {
    const options = { initialCategories: categories, initialExpenses: [lunch] };
    const first = new SessionService(options);
    const second = new SessionService(options);
    first.deleteCategory("food");
    expect(second.listCategories()).toContain(categories[0]);
    expect(second.listExpenses()).toEqual([lunch]);
    second.captureExpenses([coffee]);
    expect(first.listExpenses()).toEqual([
      { ...lunch, categoryId: "unclassified" },
    ]);
    expect(new SessionService().listCategories().map(({ id }) => id)).toEqual([
      "unclassified",
    ]);
    expect(new SessionService().listExpenses()).toEqual([]);
  });
});
