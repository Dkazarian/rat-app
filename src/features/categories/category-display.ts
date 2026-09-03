import type { TranslationKey } from "@/i18n";

import type { CategoryItemData } from "@/features/categories/view-types";
import type { Category } from "@/services/categories/types";
import { UNCLASSIFIED_CATEGORY_ID } from "@/services/categories/category-service";

export type CategoryNameSource = Readonly<{
  id: string;
  name?: string;
}>;

export function getCategoryDisplayName(
  category: CategoryNameSource,
  translate: (key: TranslationKey) => string,
): string {
  return category.id === UNCLASSIFIED_CATEGORY_ID
    ? translate("unclassified")
    : (category.name ?? "");
}

export function mapCategoriesToItems(
  categories: ReadonlyArray<Category>,
  translate: (key: TranslationKey) => string,
): ReadonlyArray<CategoryItemData> {
  return categories.map((category) => ({
    id: category.id,
    name: getCategoryDisplayName(category, translate),
    color: category.color,
    totalMinor: 0,
    canDelete: !category.system,
  }));
}
