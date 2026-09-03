import { createBrowserId } from "@/utils/create-browser-id";
import {
  CategoryValidationError,
  DuplicateCategoryIdError,
} from "./category-errors";
import type { Category, CategoryId, CustomCategory } from "./types";
import { categoryColorTokens } from "./types";
import type { UserId } from "@/services/users/types";
import CategoryStore from "./category-store";

export const CATEGORY_NAME_MAX_LENGTH = 24;
export const CATEGORY_LIMIT = 10;
export const UNCLASSIFIED_CATEGORY_ID = null;

const UNCLASSIFIED_CATEGORY: Category = {
  id: UNCLASSIFIED_CATEGORY_ID,
  kind: "built-in",
  color: "muted",
  system: true,
};
export class CategoryService {
  private readonly categoryStore = new CategoryStore();

  listCategoriesForUser(userId: UserId): ReadonlyArray<Category> {
    return [
      ...this.categoryStore.listCategoriesForUser(userId),
      UNCLASSIFIED_CATEGORY,
    ];
  }

  findUserCategoryById(
    userId: UserId,
    categoryId: CategoryId,
  ): Category | undefined {
    return categoryId === UNCLASSIFIED_CATEGORY_ID
      ? UNCLASSIFIED_CATEGORY
      : this.categoryStore.findUserCategoryById(userId, categoryId);
  }

  exists(userId: UserId, categoryId: CategoryId): boolean {
    return this.findUserCategoryById(userId, categoryId) !== undefined;
  }

  create(userId: UserId, candidateName: string): CustomCategory {
    const name = candidateName.trim();
    if (!name) throw new CategoryValidationError("empty");
    if (name.length > CATEGORY_NAME_MAX_LENGTH)
      throw new CategoryValidationError("too-long");

    const categories = this.listCategoriesForUser(userId);
    if (categories.length >= CATEGORY_LIMIT) {
      throw new CategoryValidationError("limit-reached");
    }

    if (
      categories.some(
        (category) =>
          category.kind === "custom" &&
          category.name.toLocaleLowerCase("en-US") ===
            name.toLocaleLowerCase("en-US"),
      )
    ) {
      throw new CategoryValidationError("duplicate");
    }
    const category: CustomCategory = {
      id: createBrowserId(),
      kind: "custom",
      name,
      color:
        categoryColorTokens[categories.length % categoryColorTokens.length],
      system: false,
    };

    if (this.exists(userId, category.id))
      throw new DuplicateCategoryIdError(category.id);

    this.categoryStore.create(userId, category);
    return category;
  }

  delete(userId: UserId, categoryId: CategoryId) {
    if (categoryId === null) return;
    this.categoryStore.delete(userId, categoryId);
  }
}

export const categoryService = new CategoryService();
