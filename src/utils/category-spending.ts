import type { CategorySpendingItemData } from "@/components/spending-summary/category-spending-item";
import type { CategoryItemData } from "@/features/categories/components/category-item";

export function sumCategorySpending(
  categories: ReadonlyArray<CategoryItemData>,
): number {
  return categories.reduce((total, category) => total + category.totalMinor, 0);
}

export function buildCategorySpendingItems(
  categories: ReadonlyArray<CategoryItemData>,
): ReadonlyArray<CategorySpendingItemData> {
  const totalMinor = sumCategorySpending(categories);

  return categories.map(({ id, name, color, totalMinor: categoryTotal }) => ({
    categoryId: id,
    name,
    color,
    percent:
      totalMinor === 0 ? 0 : Math.round((categoryTotal / totalMinor) * 100),
  }));
}
