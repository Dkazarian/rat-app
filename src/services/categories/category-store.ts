import type { UserId } from "@/services/users/types";
import type { Category, CategoryId, CustomCategory } from "./types";

class CategoryStore {
  private readonly categoriesByUser: Map<UserId, Map<CategoryId, Category>> =
    new Map();

  listCategoriesForUser(userId: UserId): ReadonlyArray<Category> {
    return [...(this.categoriesByUser.get(userId)?.values() ?? [])];
  }

  findUserCategoryById(
    userId: UserId,
    categoryId: CategoryId,
  ): Category | undefined {
    return this.categoriesByUser.get(userId)?.get(categoryId);
  }

  create(userId: UserId, category: CustomCategory): void {
    const categories = this.categoriesByUser.get(userId) ?? new Map();
    categories.set(category.id, category);
    this.categoriesByUser.set(userId, categories);
  }

  delete(userId: UserId, categoryId: CategoryId): void {
    this.categoriesByUser.get(userId)?.delete(categoryId);
  }
}

export default CategoryStore;
