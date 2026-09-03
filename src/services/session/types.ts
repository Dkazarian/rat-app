import type {
  Category,
  CategoryDeletionResult,
  CategoryId,
} from "@/services/categories/types";
import type {
  Expense,
  ExpenseCandidate,
  ExpenseId,
} from "@/services/expenses/types";

export type CapturedExpenseCandidate = Omit<ExpenseCandidate, "id"> &
  Readonly<{ id?: ExpenseId }>;

export type SessionServiceOptions = Readonly<{
  initialCategories?: ReadonlyArray<Category>;
  initialExpenses?: ReadonlyArray<Expense>;
  createCategoryId?: () => CategoryId;
  createExpenseId?: () => ExpenseId;
}>;

export type SessionCategoryDeletionResult = CategoryDeletionResult &
  Readonly<{ reassignedExpenses: ReadonlyArray<Expense> }>;
