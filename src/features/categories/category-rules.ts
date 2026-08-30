import type {
  BuiltInCategory,
  BuiltInCategoryIdentity,
  Category,
  CategoryCreationResult,
  CategoryDeletionResult,
  CategoryId,
  CategoryNameValidationResult,
  CustomCategory,
} from "./types";
import { nonMutedCategoryColorTokens } from "./types";

export const CATEGORY_NAME_MAX_LENGTH = 24;
export const CATEGORY_LIMIT = 10;
export const UNCLASSIFIED_CATEGORY_ID = "unclassified";

export const builtInCategoryNames = {
  food: { en: "Food", es: "Comida" },
  home: { en: "Home", es: "Casa" },
  transport: { en: "Transport", es: "Transporte" },
  unclassified: { en: "Unclassified", es: "Sin clasificar" },
} as const satisfies Record<
  BuiltInCategoryIdentity,
  Readonly<{ en: string; es: string }>
>;

const reservedCategoryNames = new Set(
  Object.values(builtInCategoryNames)
    .flatMap(({ en, es }) => [en, es])
    .map(normalizeForComparison),
);

export function createInitialCategories(): ReadonlyArray<BuiltInCategory> {
  return [
    {
      id: "food",
      kind: "built-in",
      identity: "food",
      color: "coral",
      system: false,
    },
    {
      id: "home",
      kind: "built-in",
      identity: "home",
      color: "purple",
      system: false,
    },
    {
      id: "transport",
      kind: "built-in",
      identity: "transport",
      color: "teal",
      system: false,
    },
    {
      id: "unclassified",
      kind: "built-in",
      identity: "unclassified",
      color: "muted",
      system: true,
    },
  ];
}

export function normalizeCategoryName(name: string): string {
  return name.trim();
}

export function validateCategoryName(
  categories: ReadonlyArray<Category>,
  candidateName: string,
): CategoryNameValidationResult {
  const name = normalizeCategoryName(candidateName);

  if (name.length === 0) {
    return { ok: false, code: "empty" };
  }

  if (name.length > CATEGORY_NAME_MAX_LENGTH) {
    return { ok: false, code: "too-long" };
  }

  const comparableName = normalizeForComparison(name);

  if (reservedCategoryNames.has(comparableName)) {
    return { ok: false, code: "reserved" };
  }

  if (
    categories.some(
      (category) =>
        category.kind === "custom" &&
        normalizeForComparison(category.name) === comparableName,
    )
  ) {
    return { ok: false, code: "duplicate" };
  }

  if (categories.length >= CATEGORY_LIMIT) {
    return { ok: false, code: "limit-reached" };
  }

  return { ok: true, name };
}

export function selectCategoryColor(
  categories: ReadonlyArray<Category>,
): (typeof nonMutedCategoryColorTokens)[number] {
  const assignableCategoryCount = categories.filter(
    (category) => category.color !== "muted",
  ).length;

  return nonMutedCategoryColorTokens[
    assignableCategoryCount % nonMutedCategoryColorTokens.length
  ];
}

export function createCategory(
  categories: ReadonlyArray<Category>,
  input: Readonly<{ id: CategoryId; name: string }>,
): CategoryCreationResult {
  const validation = validateCategoryName(categories, input.name);

  if (!validation.ok) {
    return { ...validation, categories };
  }

  const category: CustomCategory = {
    id: input.id,
    kind: "custom",
    name: validation.name,
    color: selectCategoryColor(categories),
    system: false,
  };

  return { ok: true, category, categories: [...categories, category] };
}

export function deleteCategory(
  categories: ReadonlyArray<Category>,
  categoryId: CategoryId,
): CategoryDeletionResult {
  const category = categories.find(({ id }) => id === categoryId);

  if (!category) {
    return { ok: false, code: "not-found", categories };
  }

  if (category.id === UNCLASSIFIED_CATEGORY_ID || category.system) {
    return { ok: false, code: "protected", categories };
  }

  return {
    ok: true,
    deletedCategory: category,
    categories: categories.filter(({ id }) => id !== categoryId),
  };
}

function normalizeForComparison(name: string): string {
  return normalizeCategoryName(name).toLocaleLowerCase("en-US");
}
