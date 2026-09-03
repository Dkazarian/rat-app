import type {
  Category,
  CategoryCreationResult,
  CategoryDeletionResult,
  CategoryId,
} from "@/services/categories/types";
import type {
  Expense,
  ExpenseBatchAdditionResult,
  ExpenseCandidate,
  ExpenseId,
  ExpenseReclassificationResult,
  ExpenseSummary,
} from "@/services/expenses/types";

export type PageFeedbackState =
  | Readonly<{ state: "empty" }>
  | Readonly<{ state: "loading" }>
  | Readonly<{
      state: "success";
      extractedCount: number;
      rejectedCount?: number;
    }>
  | Readonly<{ state: "extraction-failure" }>
  | Readonly<{ state: "provider-error" }>;

export type PageSessionSeed = Readonly<{
  categories: ReadonlyArray<Category>;
  expenses: ReadonlyArray<Expense>;
  inputValue: string;
  feedback: PageFeedbackState;
}>;

export type CapturedExpenseCandidate = Omit<ExpenseCandidate, "id"> &
  Readonly<{ id?: ExpenseId }>;

export type PageSessionDependencies = Readonly<{
  createCategoryId?: () => CategoryId;
  createExpenseId?: () => ExpenseId;
}>;

export type PageSession = Readonly<{
  categories: ReadonlyArray<Category>;
  expenses: ReadonlyArray<Expense>;
  inputValue: string;
  feedback: PageFeedbackState;
  summary: ExpenseSummary;
  changeInput: (value: string) => void;
  captureExpenses: (
    candidates: ReadonlyArray<CapturedExpenseCandidate>,
  ) => ExpenseBatchAdditionResult;
  reclassifyExpense: (
    expenseId: ExpenseId,
    categoryId: CategoryId,
  ) => ExpenseReclassificationResult;
  deleteExpense: (expenseId: ExpenseId) => void;
  createCategory: (name: string) => CategoryCreationResult;
  reassignExpensesFromCategory: (
    categoryId: CategoryId,
  ) => ReadonlyArray<Expense>;
  deleteCategory: (categoryId: CategoryId) => CategoryDeletionResult;
}>;
