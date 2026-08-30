import type { ExpenseListItemData } from "@/components/expense-list/expense-list-item";
import type { CategorySpendingItemData } from "@/components/spending-summary/category-spending-item";
import { getCategoryDisplayName } from "@/features/categories/category-display";
import type { TranslationKey } from "@/i18n";

const expenseTranslationKeys: Readonly<
  Partial<Record<string, TranslationKey>>
> = {
  "expense-lunch": "lunch",
  "expense-coffee": "coffee",
  "expense-taxi": "taxi",
};

type Translate = (key: TranslationKey) => string;

export function mapExpensesToListItems(
  expenses: ReadonlyArray<ExpenseListItemData>,
  translate: Translate,
): ReadonlyArray<ExpenseListItemData> {
  return expenses.map((expense) => ({
    ...expense,
    description: translate(
      expenseTranslationKeys[expense.id] ?? "recentExpenses",
    ),
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
