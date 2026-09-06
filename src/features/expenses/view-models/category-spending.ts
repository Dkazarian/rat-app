import type { CategoryItemData } from "@/features/categories/view-types";
import type { CategorySpendingItemData } from "@/features/expenses/view-types";

export function sumCategorySpending(
  categories: ReadonlyArray<CategoryItemData>,
): number {
  return categories.reduce((total, category) => total + category.totalMinor, 0);
}

export function buildCategorySpendingItems(
  categories: ReadonlyArray<CategoryItemData>,
  totalMinor = sumCategorySpending(categories),
): ReadonlyArray<CategorySpendingItemData> {
  return categories.map(({ id, name, color, totalMinor: categoryTotal }) => ({
    categoryId: id,
    name,
    color,
    percent:
      totalMinor === 0 ? 0 : Math.round((categoryTotal / totalMinor) * 100),
  }));
}
