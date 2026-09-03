import { beforeEach, describe, expect, it } from "vitest";

import { sampleCategories } from "@/features/dashboard/fixtures/dashboard-session-fixtures";
import { CategoryService } from "@/services/categories/category-service";
import {
  CategoryNotFoundError,
  ProtectedCategoryError,
  CategoryHasExpensesError,
} from "@/services/categories/category-errors";

import { ExpenseNotFoundError, ExpenseValidationError } from "./expense-errors";

import { ExpenseService } from "./expense-service";
import type { Expense } from "./types";

let categoryService: CategoryService;
let expenseService: ExpenseService;
beforeEach(() => {
  categoryService = new CategoryService({
    initialCategories: sampleCategories,
  });
  expenseService = new ExpenseService({ categories: categoryService });
});

const lunch: Expense = {
  id: "expense-lunch",
  description: "Lunch",
  amountMinor: 1_800,
  categoryId: "food",
};

const coffee: Expense = {
  id: "expense-coffee",
  description: "Coffee",
  amountMinor: 450,
  categoryId: "food",
};

describe("addExpenseBatch", () => {
  it("rejects duplicate IDs within one batch without overwriting the first accepted item", () => {
    const duplicate = { ...lunch, amountMinor: 999 };
    const result = expenseService.addExpenseBatch([lunch, duplicate, coffee]);
    expect(result.added).toEqual([lunch, coffee]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].candidate).toBe(duplicate);
    expect(result.errors[0].error.code).toBe("duplicate-id");
    expect(expenseService.list()).toEqual([lunch, coffee]);
  });

  it("keeps previous batches in the Map and rejects duplicate IDs without overwriting them", () => {
    expenseService.addExpenseBatch([lunch]);
    const result = expenseService.addExpenseBatch([
      coffee,
      { ...lunch, amountMinor: 999 },
    ]);
    expect(result.added).toEqual([coffee]);
    expect(result.errors[0].error.code).toBe("duplicate-id");
    expect(expenseService.list()).toEqual([lunch, coffee]);
  });

  it("returns valid candidates as added expenses and preserves literal values", () => {
    const candidate = { ...coffee, description: "  Café cortado  " };
    expect(expenseService.addExpenseBatch([candidate])).toEqual({
      added: [candidate],
      errors: [],
    });
  });

  it("returns empty arrays for an empty batch", () => {
    expect(expenseService.addExpenseBatch([])).toEqual({
      added: [],
      errors: [],
    });
  });

  it.each(["", "   "])(
    "skips invalid description %j without rejecting valid candidates",
    (description) => {
      const invalid = { ...lunch, description };
      const result = expenseService.addExpenseBatch([invalid, coffee]);
      expect(result.added).toEqual([coffee]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].candidate).toBe(invalid);
      expect(result.errors[0].error).toBeInstanceOf(ExpenseValidationError);
      expect(result.errors[0].error.code).toBe("invalid-description");
    },
  );

  it.each([
    0,
    -1,
    1.5,
    Number.POSITIVE_INFINITY,
    NaN,
    Number.MAX_SAFE_INTEGER + 1,
  ])(
    "skips invalid amount %s without rejecting valid candidates",
    (amountMinor) => {
      const invalid = { ...lunch, amountMinor };
      const result = expenseService.addExpenseBatch([coffee, invalid]);
      expect(result.added).toEqual([coffee]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].candidate).toBe(invalid);
      expect(result.errors[0].error.code).toBe("invalid-amount");
    },
  );

  it("keeps input order for accepted candidates and rejected candidates", () => {
    const invalidDescription = {
      ...coffee,
      id: "bad-description",
      description: "",
    };
    const invalidAmount = { ...coffee, id: "bad-amount", amountMinor: -1 };
    const result = expenseService.addExpenseBatch([
      invalidDescription,
      lunch,
      invalidAmount,
      coffee,
    ]);
    expect(result.added).toEqual([lunch, coffee]);
    expect(result.errors.map(({ candidate }) => candidate)).toEqual([
      invalidDescription,
      invalidAmount,
    ]);
  });

  it("reports one error per rejected candidate when all candidates fail", () => {
    const invalid = { ...lunch, description: "", amountMinor: -1 };
    const result = expenseService.addExpenseBatch([
      invalid,
      { ...coffee, amountMinor: 0 },
    ]);
    expect(result.added).toEqual([]);
    expect(result.errors.map(({ error }) => error.code)).toEqual([
      "invalid-description",
      "invalid-amount",
    ]);
  });

  it("normalizes missing and unknown categories to Unclassified", () => {
    const result = expenseService.addExpenseBatch([
      { id: "missing-category", description: "Mystery one", amountMinor: 100 },
      {
        id: "unknown-category",
        description: "Mystery two",
        amountMinor: 200,
        categoryId: "not-a-category",
      },
    ]);
    expect(result.added.map(({ categoryId }) => categoryId)).toEqual([
      "unclassified",
      "unclassified",
    ]);
    expect(result.errors).toEqual([]);
  });

  it("does not mutate candidates or categories while filtering", () => {
    const batch = Object.freeze([
      Object.freeze({ ...coffee }),
      Object.freeze({ ...lunch, amountMinor: 0 }),
    ]);
    const snapshot = structuredClone(batch);
    const categorySnapshot = structuredClone(categoryService.list());
    expenseService.addExpenseBatch(batch);
    expect(batch).toEqual(snapshot);
    expect(categoryService.list()).toEqual(categorySnapshot);
  });
});

describe("reclassifyExpense", () => {
  beforeEach(() => {
    expenseService = new ExpenseService({
      initialExpenses: [lunch, coffee],
      categories: categoryService,
    });
  });

  it("looks up the expense by ID and changes only its stored category", () => {
    const result = expenseService.reclassifyExpense(lunch.id, "transport");
    expect(result).toEqual({ ...lunch, categoryId: "transport" });
    expect(expenseService.list()).toEqual([result, coffee]);
    expect(expenseService.list()[1]).toBe(coffee);
    expect(lunch.categoryId).toBe("food");
  });

  it("can reclassify an expense added to the Map by a batch", () => {
    const result = expenseService.addExpenseBatch([
      { id: "new", description: "New", amountMinor: 100 },
    ]);
    const updated = expenseService.reclassifyExpense(
      result.added[0].id,
      "home",
    );
    expect(updated.categoryId).toBe("home");
    expect(expenseService.list().at(-1)).toBe(updated);
  });

  it("accepts Unclassified as a destination", () => {
    expect(expenseService.reclassifyExpense(lunch.id, "unclassified")).toEqual({
      ...lunch,
      categoryId: "unclassified",
    });
  });

  it("throws for a missing expense without changing the Map", () => {
    expect(() => expenseService.reclassifyExpense("missing", "home")).toThrow(
      new ExpenseNotFoundError("missing"),
    );
    expect(expenseService.list()).toEqual([lunch, coffee]);
  });

  it("throws for an unknown destination without changing the Map", () => {
    expect(() => expenseService.reclassifyExpense(lunch.id, "missing")).toThrow(
      new CategoryNotFoundError("missing"),
    );
    expect(expenseService.list()).toEqual([lunch, coffee]);
  });
});

describe("deleteExpense", () => {
  it("removes the expense from the Map so it cannot be reclassified later", () => {
    const service = new ExpenseService({ initialExpenses: [lunch, coffee] });
    expect(service.deleteExpense(lunch.id)).toBeUndefined();
    expect(service.list()).toEqual([coffee]);
    expect(() => service.reclassifyExpense(lunch.id, "home")).toThrow(
      ExpenseNotFoundError,
    );
  });

  it("throws for a missing expense without changing the Map", () => {
    const service = new ExpenseService({
      initialExpenses: [lunch],
      categories: categoryService,
    });
    expect(() => service.deleteExpense("missing")).toThrow(
      new ExpenseNotFoundError("missing"),
    );
    expect(service.list()).toEqual([lunch]);
  });
});

describe("reassignExpensesFromCategory", () => {
  it("returns all affected expenses in order without including other categories", () => {
    const unrelated: Expense = {
      id: "taxi",
      description: "Taxi",
      amountMinor: 300,
      categoryId: "transport",
    };
    const service = new ExpenseService({
      initialExpenses: [lunch, unrelated, coffee],
      categories: categoryService,
    });
    const changed = service.reassignExpensesFromCategory("food");
    expect(changed).toEqual([
      { ...lunch, categoryId: "unclassified" },
      { ...coffee, categoryId: "unclassified" },
    ]);
    expect(service.list()).toEqual([changed[0], unrelated, changed[1]]);
    expect(service.list()[1]).toBe(unrelated);
    expect(lunch.categoryId).toBe("food");
    expect(coffee.categoryId).toBe("food");
  });

  it("throws for an unknown category without changing stored expenses", () => {
    const service = new ExpenseService({
      initialExpenses: [lunch, coffee],
      categories: categoryService,
    });
    expect(() => service.reassignExpensesFromCategory("missing")).toThrow(
      new CategoryNotFoundError("missing"),
    );
    expect(service.list()).toEqual([lunch, coffee]);
    expect(service.list()[0]).toBe(lunch);
    expect(service.list()[1]).toBe(coffee);
  });

  it("returns only changed expenses and leaves unrelated records untouched", () => {
    const unrelated = { ...coffee, categoryId: "home" };
    const service = new ExpenseService({
      initialExpenses: [lunch, unrelated],
      categories: categoryService,
    });
    const changed = service.reassignExpensesFromCategory("food");
    expect(changed).toEqual([{ ...lunch, categoryId: "unclassified" }]);
    expect(service.list()).toEqual([changed[0], unrelated]);
    expect(service.list()[1]).toBe(unrelated);
    expect(service.reassignExpensesFromCategory("food")).toEqual([]);
    expect(service.reassignExpensesFromCategory("unclassified")).toEqual([]);
    expect(service.list()[0]).toBe(changed[0]);
  });
});

describe("category deletion", () => {
  it("blocks deletion while expenses reference the category and allows it after reassignment", () => {
    const categories = new CategoryService({
      initialCategories: sampleCategories,
    });
    const expenses = new ExpenseService({
      initialExpenses: [lunch, coffee],
      categories,
    });
    expect(() => categories.delete("food")).toThrow(
      new CategoryHasExpensesError("food"),
    );
    expect(categories.find("food").id).toBe("food");
    expect(expenses.list()).toEqual([lunch, coffee]);
    expenses.reassignExpensesFromCategory("food");
    categories.delete("food");
    expect(expenses.list()).toEqual([
      { ...lunch, categoryId: "unclassified" },
      { ...coffee, categoryId: "unclassified" },
    ]);
    expect(() => categories.find("food")).toThrow(CategoryNotFoundError);
  });

  it("checks newly added expenses and releases the category after they are deleted", () => {
    const categories = new CategoryService({
      initialCategories: sampleCategories,
    });
    const expenses = new ExpenseService({ categories });
    expenses.addExpenseBatch([lunch]);
    expect(() => categories.delete("food")).toThrow(CategoryHasExpensesError);
    expenses.deleteExpense(lunch.id);
    expect(categories.delete("food").id).toBe("food");
  });

  it("checks current references after reclassification", () => {
    const categories = new CategoryService({
      initialCategories: sampleCategories,
    });
    const expenses = new ExpenseService({
      initialExpenses: [lunch],
      categories,
    });
    expenses.reclassifyExpense(lunch.id, "home");
    expect(categories.delete("food").id).toBe("food");
    expect(() => categories.delete("home")).toThrow(CategoryHasExpensesError);
  });

  it.each([
    ["unclassified", ProtectedCategoryError],
    ["missing", CategoryNotFoundError],
  ] as const)(
    "rejects %s without changing either collection",
    (id, ErrorType) => {
      const categories = new CategoryService({
        initialCategories: sampleCategories,
      });
      const expenses = new ExpenseService({
        initialExpenses: [lunch],
        categories,
      });
      const before = categories.list();
      expect(() => categories.delete(id)).toThrow(ErrorType);
      expect(categories.list()).toEqual(before);
      expect(expenses.list()).toEqual([lunch]);
    },
  );
});
