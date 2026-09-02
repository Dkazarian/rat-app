import { UNCLASSIFIED_CATEGORY_ID } from "@/features/categories/category-rules";
import type { Category, CategoryId } from "@/features/categories/types";

import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseCandidate,
  ExpenseDeletionResult,
  ExpenseId,
  ExpenseReclassificationResult,
} from "./types";

export function addExpenseBatch(
  expenses: ReadonlyArray<Expense>,
  categories: ReadonlyArray<Category>,
  candidates: ReadonlyArray<ExpenseCandidate>,
): ExpenseBatchAdditionResult {
  if (candidates.length === 0) {
    return { ok: false, code: "empty-batch", expenses };
  }

  if (candidates.some(({ description }) => description.trim().length === 0)) {
    return { ok: false, code: "invalid-description", expenses };
  }

  if (
    candidates.some(
      ({ amountMinor }) =>
        !Number.isSafeInteger(amountMinor) || amountMinor <= 0,
    )
  ) {
    return { ok: false, code: "invalid-amount", expenses };
  }

  const categoryIds = new Set(categories.map(({ id }) => id));
  const addedExpenses = candidates.map(
    ({ id, description, amountMinor, categoryId }): Expense => ({
      id,
      description,
      amountMinor,
      categoryId:
        categoryId && categoryIds.has(categoryId)
          ? categoryId
          : UNCLASSIFIED_CATEGORY_ID,
    }),
  );

  return {
    ok: true,
    addedExpenses,
    expenses: [...expenses, ...addedExpenses],
  };
}

export function reclassifyExpense(
  expenses: ReadonlyArray<Expense>,
  categories: ReadonlyArray<Category>,
  input: Readonly<{ expenseId: ExpenseId; categoryId: CategoryId }>,
): ExpenseReclassificationResult {
  const expense = expenses.find(({ id }) => id === input.expenseId);

  if (!expense) {
    return { ok: false, code: "expense-not-found", expenses };
  }

  if (!categories.some(({ id }) => id === input.categoryId)) {
    return { ok: false, code: "category-not-found", expenses };
  }

  const reclassifiedExpense: Expense = {
    ...expense,
    categoryId: input.categoryId,
  };

  return {
    ok: true,
    expense: reclassifiedExpense,
    expenses: expenses.map((currentExpense) =>
      currentExpense.id === input.expenseId
        ? reclassifiedExpense
        : currentExpense,
    ),
  };
}

export function deleteExpense(
  expenses: ReadonlyArray<Expense>,
  expenseId: ExpenseId,
): ExpenseDeletionResult {
  const deletedExpense = expenses.find(({ id }) => id === expenseId);

  if (!deletedExpense) {
    return { ok: false, code: "expense-not-found", expenses };
  }

  return {
    ok: true,
    deletedExpense,
    expenses: expenses.filter(({ id }) => id !== expenseId),
  };
}

export function reassignExpensesFromCategory(
  expenses: ReadonlyArray<Expense>,
  categoryId: CategoryId,
): ReadonlyArray<Expense> {
  if (!expenses.some((expense) => expense.categoryId === categoryId)) {
    return expenses;
  }

  return expenses.map((expense) =>
    expense.categoryId === categoryId
      ? { ...expense, categoryId: UNCLASSIFIED_CATEGORY_ID }
      : expense,
  );
}
