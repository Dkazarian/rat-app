import { categoryColors } from "@/contracts/session-api";
import type {
  CategoriesResponse,
  CategoryColor,
  CategoryDto,
  ExpenseDto,
} from "@/contracts/session-api";
import { applicationErrors } from "./errors";

export const CATEGORY_LIMIT = 10;
export const CATEGORY_NAME_MAX_LENGTH = 24;
const RESERVED_CATEGORY_NAMES = new Set(["unclassified", "sin clasificar"]);

export type StoredCategory = Readonly<{
  id: string;
  name: string;
  color: CategoryColor;
}>;

export function normalizeCategoryName(candidate: string): string {
  const name = candidate.trim();
  if (!name || name.length > CATEGORY_NAME_MAX_LENGTH) {
    throw applicationErrors.invalidCategoryName();
  }
  if (RESERVED_CATEGORY_NAMES.has(name.toLocaleLowerCase("en-US"))) {
    throw applicationErrors.invalidCategoryName();
  }
  return name;
}

export function createCategoryRecord(
  categories: ReadonlyArray<StoredCategory>,
  candidateName: string,
  id: string,
): StoredCategory {
  const name = normalizeCategoryName(candidateName);
  if (categories.length >= CATEGORY_LIMIT) {
    throw applicationErrors.categoryLimit();
  }
  const normalized = name.toLocaleLowerCase("en-US");
  if (
    categories.some(
      (category) => category.name.toLocaleLowerCase("en-US") === normalized,
    )
  ) {
    throw applicationErrors.duplicateCategory();
  }
  return {
    id,
    name,
    color: categoryColors[categories.length % categoryColors.length],
  };
}

export function toCategoriesResponse(
  storedCategories: ReadonlyArray<StoredCategory>,
  expenses: ReadonlyArray<ExpenseDto>,
): CategoriesResponse {
  const categoryTotals = new Map<string, number>(
    storedCategories.map(({ id }) => [id, 0] as const),
  );
  let unclassifiedTotalMinor = 0;
  for (const expense of expenses) {
    if (expense.categoryId !== null && categoryTotals.has(expense.categoryId)) {
      categoryTotals.set(
        expense.categoryId,
        (categoryTotals.get(expense.categoryId) ?? 0) + expense.amountMinor,
      );
    } else {
      unclassifiedTotalMinor += expense.amountMinor;
    }
  }
  const categories = storedCategories.map((category): CategoryDto => ({
    ...category,
    totalMinor: categoryTotals.get(category.id) ?? 0,
  }));
  const totalMinor = categories.reduce(
    (total, category) => total + category.totalMinor,
    unclassifiedTotalMinor,
  );
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0) {
    throw new Error("Stored category totals are invalid");
  }
  return { categories, unclassifiedTotalMinor, totalMinor };
}
