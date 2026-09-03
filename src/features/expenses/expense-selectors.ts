import { UNCLASSIFIED_CATEGORY_ID } from "@/features/categories/category-service";
import type { Category } from "@/features/categories/types";

import type { Expense, ExpenseSummary } from "./types";

export function selectExpenseSummary(
  categories: ReadonlyArray<Category>,
  expenses: ReadonlyArray<Expense>,
): ExpenseSummary {
  const categoryIds = new Set(categories.map(({ id }) => id));
  const normalizedExpenses = expenses.map((expense) =>
    categoryIds.has(expense.categoryId)
      ? expense
      : { ...expense, categoryId: UNCLASSIFIED_CATEGORY_ID },
  );
  const totalMinor = normalizedExpenses.reduce(
    (total, { amountMinor }) => total + amountMinor,
    0,
  );
  const groups = categories.map((category) => {
    const categoryExpenses = normalizedExpenses.filter(
      ({ categoryId }) => categoryId === category.id,
    );
    const categoryTotalMinor = categoryExpenses.reduce(
      (total, { amountMinor }) => total + amountMinor,
      0,
    );

    return {
      category,
      expenses: categoryExpenses,
      totalMinor: categoryTotalMinor,
      percent:
        totalMinor === 0
          ? 0
          : Math.round((categoryTotalMinor / totalMinor) * 100),
    };
  });

  return {
    totalMinor,
    groups,
    chartSlices: groups.map(({ category, totalMinor, percent }) => ({
      categoryId: category.id,
      color: category.color,
      totalMinor,
      percent,
    })),
  };
}
