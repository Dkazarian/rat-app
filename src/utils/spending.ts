import type { CategoryItemData } from "@/components/category-panel/category-item";
import type { SpendingCategoryPercentItemData } from "@/components/spending-summary/spending-category-percent-item";

export function sumCategoryTotals(
  categories: ReadonlyArray<CategoryItemData>,
): number {
  return categories.reduce((total, category) => total + category.totalMinor, 0);
}

export function buildSpendingItems(
  categories: ReadonlyArray<CategoryItemData>,
): ReadonlyArray<SpendingCategoryPercentItemData> {
  const totalMinor = sumCategoryTotals(categories);

  return categories.map(({ id, name, color, totalMinor: categoryTotal }) => ({
    categoryId: id,
    name,
    color,
    percent:
      totalMinor === 0 ? 0 : Math.round((categoryTotal / totalMinor) * 100),
  }));
}
