import { deleteCategory } from "@/features/categories/category-rules";
import type { Category, CategoryId } from "@/features/categories/types";
import { reassignExpensesFromCategory } from "@/features/expenses/expense-rules";
import type { Expense } from "@/features/expenses/types";

export type CoordinatedCategoryDeletionResult =
  | Readonly<{
      ok: true;
      deletedCategory: Category;
      categories: ReadonlyArray<Category>;
      expenses: ReadonlyArray<Expense>;
    }>
  | Readonly<{
      ok: false;
      code: "not-found" | "protected";
      categories: ReadonlyArray<Category>;
      expenses: ReadonlyArray<Expense>;
    }>;

export function deleteCategoryAndReassignExpenses(
  categories: ReadonlyArray<Category>,
  expenses: ReadonlyArray<Expense>,
  categoryId: CategoryId,
): CoordinatedCategoryDeletionResult {
  const deletion = deleteCategory(categories, categoryId);

  if (!deletion.ok) {
    return {
      ok: false,
      code: deletion.code,
      categories,
      expenses,
    };
  }

  return {
    ok: true,
    deletedCategory: deletion.deletedCategory,
    categories: deletion.categories,
    expenses: reassignExpensesFromCategory(expenses, categoryId),
  };
}
