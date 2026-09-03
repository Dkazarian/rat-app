import type { ExpenseListItemData } from "@/components/expense-list/expense-list-item";
import type { CategorySpendingItemData } from "@/components/spending-summary/category-spending-item";
import type { CategoryItemData } from "@/features/categories/components/category-item";
import { getCategoryDisplayName } from "@/features/categories/category-display";
import { UNCLASSIFIED_CATEGORY_ID } from "@/features/categories/category-service";
import type { Category } from "@/features/categories/types";
import type { TranslationKey } from "@/i18n";
import type { Locale } from "@/i18n";
import { formatAmount } from "@/utils/format-amount";

import type { Expense, ExpenseSummary } from "./types";

type Translate = (key: TranslationKey) => string;

export function mapExpensesToListItems(
  expenses: ReadonlyArray<ExpenseListItemData>,
  translate: Translate,
): ReadonlyArray<ExpenseListItemData> {
  return expenses.map((expense) => ({
    ...expense,
    categoryName: getCategoryDisplayName(
      { id: expense.categoryId, name: expense.categoryName },
      translate,
    ),
  }));
}

export function mapCategorySpendingToItems(
  items: ReadonlyArray<CategorySpendingItemData>,
  translate: Translate,
): ReadonlyArray<CategorySpendingItemData> {
  return items.map((item) => ({
    ...item,
    name: getCategoryDisplayName(
      { id: item.categoryId, name: item.name },
      translate,
    ),
  }));
}

export function mapExpenseValuesToListItems(
  expenses: ReadonlyArray<Expense>,
  categories: ReadonlyArray<Category>,
  translate: Translate,
): ReadonlyArray<ExpenseListItemData> {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const unclassified = categoryById.get(UNCLASSIFIED_CATEGORY_ID);

  if (!unclassified) {
    throw new Error("The expense session requires an Unclassified category");
  }

  return expenses.map((expense) => {
    const category = categoryById.get(expense.categoryId) ?? unclassified;

    return {
      id: expense.id,
      description: expense.description,
      categoryId: category.id,
      categoryName: getCategoryDisplayName(category, translate),
      color: category.color,
      amountMinor: expense.amountMinor,
    };
  });
}

export function mapExpenseSummaryToSpendingItems(
  summary: ExpenseSummary,
  translate: Translate,
): ReadonlyArray<CategorySpendingItemData> {
  return summary.groups.map(({ category, percent }) => ({
    categoryId: category.id,
    name: getCategoryDisplayName(category, translate),
    color: category.color,
    percent,
  }));
}

export function mapExpenseSummaryToCategoryItems(
  summary: ExpenseSummary,
  translate: Translate,
): ReadonlyArray<CategoryItemData> {
  return summary.groups.map(({ category, totalMinor }) => ({
    id: category.id,
    name: getCategoryDisplayName(category, translate),
    color: category.color,
    totalMinor,
    canDelete: !category.system,
  }));
}

export function buildSpendingChartLabel(
  summary: ExpenseSummary,
  locale: Locale,
  translate: Translate,
): string {
  const categorySummary = summary.groups
    .filter(({ percent }) => percent > 0)
    .map(
      ({ category, percent }) =>
        `${getCategoryDisplayName(category, translate)} ${percent}%`,
    )
    .join(", ");
  const spendingSummary = categorySummary || translate("noSpending");

  return `${translate("spending")}: ${spendingSummary}. ${translate("total")}: ${formatAmount(summary.totalMinor, locale)}`;
}
