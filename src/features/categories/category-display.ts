import type { TranslationKey } from "@/i18n";

import type { CategoryItemData } from "./components/category-item";
import type { Category } from "./types";

const categoryTranslationKeys: Readonly<
  Partial<Record<string, TranslationKey>>
> = {
  food: "food",
  home: "home",
  transport: "transport",
  unclassified: "unclassified",
  // Retained for the Phase 2 spending fixture until Phase 4 replaces it.
  fun: "fun",
};

export type CategoryNameSource = Readonly<{
  id: string;
  name?: string;
}>;

export function getCategoryDisplayName(
  category: CategoryNameSource,
  translate: (key: TranslationKey) => string,
): string {
  const translationKey = categoryTranslationKeys[category.id];

  return translationKey ? translate(translationKey) : (category.name ?? "");
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
