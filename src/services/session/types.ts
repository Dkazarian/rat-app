import type {
  Category,
  CategoryDeletionResult,
} from "@/services/categories/types";
import type { Expense, ExpenseCandidate } from "@/services/expenses/types";
import type { UserId } from "@/services/users/types";

export type CapturedExpenseCandidate = ExpenseCandidate;

export type SessionServiceOptions = Readonly<{
  userId?: UserId;
  initialCategories?: ReadonlyArray<Category>;
  initialExpenses?: ReadonlyArray<ExpenseCandidate>;
}>;

export type SessionCategoryDeletionResult = CategoryDeletionResult &
  Readonly<{ reassignedExpenses: ReadonlyArray<Expense> }>;
