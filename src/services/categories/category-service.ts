import { createBrowserId } from "@/utils/create-browser-id";
import {
  CategoryValidationError,
  CategoryNotFoundError,
  ProtectedCategoryError,
  DuplicateCategoryIdError,
} from "./category-errors";
import type {
  Category,
  CategoryId,
  CustomCategory,
  BuiltInCategoryIdentity,
} from "./types";
import { categoryColorTokens } from "./types";

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

export class CategoryService {
  private readonly categories: Map<CategoryId, Category>;
  private readonly createId: () => CategoryId;

  constructor(
    options: {
      initialCategories?: ReadonlyArray<Category>;
      createId?: () => CategoryId;
    } = {},
  ) {
    this.categories = new Map(
      (options.initialCategories ?? []).map((category) => [
        category.id,
        category,
      ]),
    );
    this.categories.set(UNCLASSIFIED_CATEGORY_ID, {
      id: UNCLASSIFIED_CATEGORY_ID,
      kind: "built-in",
      identity: "unclassified",
      color: "muted",
      system: true,
    });
    this.createId = options.createId ?? createBrowserId;
  }

  list(): ReadonlyArray<Category> {
    return [...this.categories.values()];
  }

  find(categoryId: CategoryId): Category {
    const category = this.categories.get(categoryId);
    if (!category) throw new CategoryNotFoundError(categoryId);
    return category;
  }

  create(candidateName: string): CustomCategory {
    const name = this._validateCategoryName(candidateName);
    const category: CustomCategory = {
      id: this.createId(),
      kind: "custom",
      name,
      color: this._selectCategoryColor(),
      system: false,
    };
    if (this.categories.has(category.id))
      throw new DuplicateCategoryIdError(category.id);
    this.categories.set(category.id, category);
    return category;
  }

  assertCanDelete(categoryId: CategoryId): Category {
    const category = this.find(categoryId);
    if (category.id === UNCLASSIFIED_CATEGORY_ID || category.system)
      throw new ProtectedCategoryError(categoryId);
    return category;
  }

  // Sessions must coordinate expense reassignment through SessionService.
  delete(categoryId: CategoryId): Category {
    const category = this.assertCanDelete(categoryId);
    this.categories.delete(categoryId);
    return category;
  }

  private _validateCategoryName(candidateName: string): string {
    const name = candidateName.trim();
    if (!name) throw new CategoryValidationError("empty");
    if (name.length > CATEGORY_NAME_MAX_LENGTH)
      throw new CategoryValidationError("too-long");
    const comparableName = normalizeForComparison(name);
    if (reservedCategoryNames.has(comparableName))
      throw new CategoryValidationError("reserved");
    if (
      this.list().some(
        (category) =>
          category.kind === "custom" &&
          normalizeForComparison(category.name) === comparableName,
      )
    )
      throw new CategoryValidationError("duplicate");
    if (this.categories.size >= CATEGORY_LIMIT)
      throw new CategoryValidationError("limit-reached");
    return name;
  }

  private _selectCategoryColor(): (typeof categoryColorTokens)[number] {
    const count = this.list().length - 1; // Exclude the unclassified category from the count
    return categoryColorTokens[count % categoryColorTokens.length];
  }
}

export const categoryService = new CategoryService();
function normalizeForComparison(name: string): string {
  return name.trim().toLocaleLowerCase("en-US");
}
