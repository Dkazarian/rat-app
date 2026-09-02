import { describe, expect, it } from "vitest";

import {
  createCategory,
  createInitialCategories,
} from "@/features/categories/category-rules";
import type { Category } from "@/features/categories/types";
import { deleteCategoryAndReassignExpenses } from "@/features/session/session-rules";

import {
  addExpenseBatch,
  deleteExpense,
  reclassifyExpense,
} from "./expense-rules";
import type { Expense } from "./types";

const categories = createInitialCategories();

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
  it("appends a valid expense and preserves its literal values", () => {
    const result = addExpenseBatch([], categories, [
      {
        id: "expense-coffee",
        description: "  Café cortado  ",
        amountMinor: 450,
        categoryId: "food",
      },
    ]);

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;

    expect(result.addedExpenses).toEqual([
      {
        id: "expense-coffee",
        description: "  Café cortado  ",
        amountMinor: 450,
        categoryId: "food",
      },
    ]);
    expect(result.expenses).not.toBe(result.addedExpenses);
  });

  it("appends later batches without replacing earlier expenses", () => {
    const result = addExpenseBatch([lunch], categories, [
      coffee,
      {
        id: "expense-taxi",
        description: "Taxi",
        amountMinor: 1_200,
        categoryId: "transport",
      },
    ]);

    expect(result.ok && result.expenses.map(({ id }) => id)).toEqual([
      "expense-lunch",
      "expense-coffee",
      "expense-taxi",
    ]);
  });

  it("rejects an empty batch without replacing the collection", () => {
    const existing = [lunch] as const;
    const result = addExpenseBatch(existing, categories, []);

    expect(result).toEqual({
      ok: false,
      code: "empty-batch",
      expenses: existing,
    });
    expect(result.expenses).toBe(existing);
  });

  it.each(["", "   "])(
    "rejects the whole batch for description %j",
    (description) => {
      const existing = [lunch] as const;
      const result = addExpenseBatch(existing, categories, [
        coffee,
        {
          id: "expense-invalid",
          description,
          amountMinor: 100,
          categoryId: "home",
        },
      ]);

      expect(result).toEqual({
        ok: false,
        code: "invalid-description",
        expenses: existing,
      });
      expect(result.expenses).toBe(existing);
    },
  );

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY])(
    "rejects the whole batch for invalid minor-unit amount %s",
    (amountMinor) => {
      const existing = [lunch] as const;
      const result = addExpenseBatch(existing, categories, [
        coffee,
        {
          id: "expense-invalid",
          description: "Invalid amount",
          amountMinor,
          categoryId: "home",
        },
      ]);

      expect(result).toEqual({
        ok: false,
        code: "invalid-amount",
        expenses: existing,
      });
      expect(result.expenses).toBe(existing);
    },
  );

  it("normalizes missing and unknown categories to Unclassified", () => {
    const result = addExpenseBatch([], categories, [
      {
        id: "expense-missing-category",
        description: "Mystery one",
        amountMinor: 100,
      },
      {
        id: "expense-unknown-category",
        description: "Mystery two",
        amountMinor: 200,
        categoryId: "not-a-category",
      },
    ]);

    expect(
      result.ok && result.addedExpenses.map(({ categoryId }) => categoryId),
    ).toEqual(["unclassified", "unclassified"]);
  });

  it("leaves batch inputs and existing values untouched", () => {
    const existing = Object.freeze([Object.freeze({ ...lunch })]);
    const batch = Object.freeze([
      Object.freeze({
        id: "expense-coffee",
        description: "Coffee",
        amountMinor: 450,
        categoryId: "food",
      }),
    ]);
    const existingSnapshot = structuredClone(existing);
    const batchSnapshot = structuredClone(batch);

    const result = addExpenseBatch(existing, categories, batch);

    expect(result.ok).toBe(true);
    expect(existing).toEqual(existingSnapshot);
    expect(batch).toEqual(batchSnapshot);
    expect(result.expenses).not.toBe(existing);
  });
});

describe("reclassifyExpense", () => {
  it("changes only the category of the targeted expense", () => {
    const result = reclassifyExpense([lunch, coffee], categories, {
      expenseId: lunch.id,
      categoryId: "transport",
    });

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;

    expect(result.expense).toEqual({ ...lunch, categoryId: "transport" });
    expect(result.expenses[1]).toBe(coffee);
    expect(result.expenses).not.toEqual([lunch, coffee]);
  });

  it("accepts Unclassified as a destination", () => {
    const result = reclassifyExpense([lunch], categories, {
      expenseId: lunch.id,
      categoryId: "unclassified",
    });

    expect(result.ok && result.expense).toEqual({
      ...lunch,
      categoryId: "unclassified",
    });
  });

  it("rejects a missing expense without replacing the collection", () => {
    const existing = [lunch] as const;
    const result = reclassifyExpense(existing, categories, {
      expenseId: "missing",
      categoryId: "home",
    });

    expect(result).toEqual({
      ok: false,
      code: "expense-not-found",
      expenses: existing,
    });
    expect(result.expenses).toBe(existing);
  });

  it("rejects an unknown destination without replacing the collection", () => {
    const existing = [lunch] as const;
    const result = reclassifyExpense(existing, categories, {
      expenseId: lunch.id,
      categoryId: "missing",
    });

    expect(result).toEqual({
      ok: false,
      code: "category-not-found",
      expenses: existing,
    });
    expect(result.expenses).toBe(existing);
  });
});

describe("deleteExpense", () => {
  it("deletes only the targeted expense", () => {
    const result = deleteExpense([lunch, coffee], lunch.id);

    expect(result).toEqual({
      ok: true,
      deletedExpense: lunch,
      expenses: [coffee],
    });
  });

  it("rejects a missing expense without replacing the collection", () => {
    const existing = [lunch] as const;
    const result = deleteExpense(existing, "missing");

    expect(result).toEqual({
      ok: false,
      code: "expense-not-found",
      expenses: existing,
    });
    expect(result.expenses).toBe(existing);
  });
});

describe("deleteCategoryAndReassignExpenses", () => {
  it("deletes an unreferenced eligible category", () => {
    const existingExpenses = [lunch] as const;
    const result = deleteCategoryAndReassignExpenses(
      categories,
      existingExpenses,
      "home",
    );

    expect(result.ok).toBe(true);
    expect(result.categories.map(({ id }) => id)).toEqual([
      "food",
      "transport",
      "unclassified",
    ]);
    expect(result.expenses).toBe(existingExpenses);
  });

  it("reassigns every affected expense before deleting its category", () => {
    const withCustomCategory = createCategory(categories, {
      id: "work",
      name: "Work",
    });
    expect(withCustomCategory.ok).toBe(true);
    if (!withCustomCategory.ok) return;

    const expenses: ReadonlyArray<Expense> = [
      lunch,
      { ...coffee, categoryId: "work" },
      {
        id: "expense-supplies",
        description: "Supplies",
        amountMinor: 2_500,
        categoryId: "work",
      },
    ];
    const result = deleteCategoryAndReassignExpenses(
      withCustomCategory.categories,
      expenses,
      "work",
    );

    expect(result.ok).toBe(true);
    expect(result.categories.some(({ id }) => id === "work")).toBe(false);
    expect(result.expenses).toEqual([
      lunch,
      { ...coffee, categoryId: "unclassified" },
      {
        id: "expense-supplies",
        description: "Supplies",
        amountMinor: 2_500,
        categoryId: "unclassified",
      },
    ]);
  });

  it.each(["unclassified", "missing"])(
    "rejects deletion of %s without replacing either collection",
    (categoryId) => {
      const existingCategories: ReadonlyArray<Category> = categories;
      const existingExpenses = [lunch] as const;
      const result = deleteCategoryAndReassignExpenses(
        existingCategories,
        existingExpenses,
        categoryId,
      );

      expect(result.ok).toBe(false);
      expect(result.categories).toBe(existingCategories);
      expect(result.expenses).toBe(existingExpenses);
    },
  );
});
